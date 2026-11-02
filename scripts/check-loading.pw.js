// Run against the production preview:
// npx --yes --package @playwright/cli playwright-cli run-code --filename scripts/check-loading.pw.js
async (page) => {
    const context = await page.context().browser().newContext({ serviceWorkers: 'block' });
    const browserPage = await context.newPage();
    const errors = [];
    const failedAssets = [];
    // Pin the daily text so a date change cannot change the initial font budget.
    await browserPage.route('https://sentence.iciba.com/**', route => {
        const callback = new URL(route.request().url()).searchParams.get('callback');
        return route.fulfill({
            contentType: 'application/javascript',
            body: `${callback}(${JSON.stringify({ errno: 0, content: 'Welcome to my homepage.', note: '欢迎来到我的主页' })})`,
        });
    });
    browserPage.on('pageerror', error => errors.push(error.message));
    browserPage.on('response', response => {
        if (response.url().includes('/assets/') && response.status() >= 400) failedAssets.push(response.url());
    });
    try {
        await browserPage.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
        await browserPage.locator('.logo-image').waitFor({ state: 'visible', timeout: 15000 });
        await browserPage.evaluate(() => document.fonts.ready);
        const result = await browserPage.evaluate(async () => {
            const logo = document.querySelector('.logo-image');
            await logo.decode();
            const entries = performance.getEntriesByType('resource');
            const avatar = entries.find(entry => entry.name === logo.currentSrc);
            const script = entries.find(entry => /\/assets\/index-.*\.js/.test(entry.name));
            const fonts = entries.filter(entry => /\.woff2($|\?)/.test(entry.name));
            return {
                avatar: { url: logo.currentSrc, bytes: avatar.decodedBodySize, start: Math.round(avatar.startTime) },
                scriptEnd: Math.round(script.responseEnd),
                fontCount: fonts.length,
                fontBytes: fonts.reduce((sum, entry) => sum + entry.decodedBodySize, 0),
                decorativeFontBytes: fonts.filter(entry => entry.name.includes('LongCang')).reduce((sum, entry) => sum + entry.decodedBodySize, 0),
                externalFontCount: fonts.filter(entry => new URL(entry.name).origin !== location.origin).length,
                oldTtfCount: entries.filter(entry => /\.ttf($|\?)/.test(entry.name)).length,
                duplicateAvatarCount: entries.filter(entry => entry.name === logo.currentSrc).length,
                preload: document.querySelector('link[rel="preload"][as="image"]').href,
            };
        });
        console.log(JSON.stringify({ ...result, errors, failedAssets }, null, 2));
        if (result.avatar.bytes > 100000 || result.decorativeFontBytes > 200000) throw new Error('First-visit asset budget exceeded');
        if (result.externalFontCount || result.oldTtfCount || errors.length || failedAssets.length) throw new Error('Font loading or runtime regression');
        if (result.avatar.start > result.scriptEnd || result.preload !== result.avatar.url || result.duplicateAvatarCount !== 1) throw new Error('Avatar preload not reused before app startup');
        const fallback = await browserPage.evaluate(async () => {
            const fonts = await document.fonts.load('16px "Long Cang"', '丐龟');
            const entries = performance.getEntriesByType('resource').filter(entry => /LongCang-\d+/.test(entry.name));
            return { loadedFaces: fonts.length, bytes: entries.reduce((sum, entry) => sum + entry.decodedBodySize, 0), requests: entries.length };
        });
        if (!fallback.loadedFaces || !fallback.requests || fallback.bytes > 100000) throw new Error('Uncommon daily-sentence characters did not use small fallback slices');
        await browserPage.locator('#loader-wrapper').waitFor({ state: 'hidden' });
        await browserPage.evaluate(async () => {
            const animations = document.getAnimations().filter(animation => Number.isFinite(animation.effect.getComputedTiming().endTime));
            await Promise.allSettled(animations.map(animation => animation.finished));
        });
        await browserPage.screenshot({ path: 'output/playwright/homepage-desktop.png' });
        await browserPage.setViewportSize({ width: 390, height: 844 });
        await browserPage.screenshot({ path: 'output/playwright/homepage-mobile.png' });
        console.log('PASS: first-visit asset budgets, same-origin fonts, preload reuse, desktop/mobile rendering');
        return { verdict: 'PASS', ...result, fallback, errors, failedAssets };
    } finally {
        await context.close();
    }
}
