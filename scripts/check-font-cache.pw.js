// Run with playwright-cli run-code --filename scripts/check-font-cache.pw.js
async (page) => {
    const context = await page.context().browser().newContext();
    const browserPage = await context.newPage();
    try {
        await browserPage.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
        await browserPage.evaluate(() => navigator.serviceWorker.ready);
        await browserPage.waitForFunction(() => navigator.serviceWorker.controller !== null);
        await browserPage.reload({ waitUntil: 'domcontentloaded' });
        await browserPage.locator('.logo-image').waitFor({ state: 'visible' });
        await browserPage.evaluate(() => document.fonts.ready);
        await browserPage.waitForFunction(async () => (await (await caches.open('versioned-font-cache')).keys()).length > 0);
        const fontUrls = await browserPage.evaluate(async () => (await (await caches.open('versioned-font-cache')).keys()).map(request => request.url));
        await browserPage.evaluate(async url => {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Font unavailable before offline check');
            await response.arrayBuffer();
        }, fontUrls[0]);
        await context.setOffline(true);
        const cachedFontBytes = await browserPage.evaluate(async url => {
            const response = await fetch(url, { mode: 'cors' });
            if (!response.ok) throw new Error('Cached font unavailable offline');
            return (await response.arrayBuffer()).byteLength;
        }, fontUrls[0]);
        if (!cachedFontBytes || fontUrls.some(url => !url.includes('/assets/'))) throw new Error('Versioned font cache regression');
        return { verdict: 'PASS', cachedFonts: fontUrls.length, offlineFontBytes: cachedFontBytes };
    } finally {
        await context.close();
    }
}
