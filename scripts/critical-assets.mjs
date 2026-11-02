import { loadEnv } from 'vite';

// Keep this default-avatar mapping in sync with Message/index.vue.
export function criticalAssets(mode) {
    const env = loadEnv(mode, process.cwd());
    const logo = env.VITE_SITE_LOGO === '/image/icon/avatar.png'
        ? '/src/assets/avatar.webp' : env.VITE_SITE_LOGO;

    return {
        name: 'homepage-critical-assets',
        transformIndexHtml: {
            enforce: 'pre',
            transform(html) {
                const icon = env.VITE_SITE_ICON === '/image/icon/favicon.ico'
                    ? '/src/assets/favicon.ico' : env.VITE_SITE_ICON;
                const appleIcon = env.VITE_SITE_ICON_APPLE === '/image/icon/avatar.png'
                    ? '/src/assets/apple-touch-icon.png' : env.VITE_SITE_ICON_APPLE;
                return {
                    html: html.replaceAll('%VITE_SITE_ICON%', icon)
                        .replaceAll('%VITE_SITE_ICON_APPLE%', appleIcon),
                    tags: [
                        ...(logo ? [{ tag: 'link', attrs: { rel: 'preload', as: 'image', href: logo, fetchpriority: 'high' } }] : []),
                        { tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: '/src/assets/fonts/Playball-Regular.woff2', crossorigin: '' } },
                    ],
                };
            },
        },
    };
}
