# 性能排查与修改（2026-10-28）

## 头像与字体优化（2026-11-02）

本轮以远端 main 的 `04c5b01` 为基础，在 `codex/homepage-asset-loading` 分支修改。未带入本地旧的“隐藏警告图标”提交。尚未部署线上。

线上首次浏览器采样确认：头像为 876×876 的 PNG，667,666 字节，在页面脚本运行、背景放行后才发现；Long Cang 一次下载完整 5,162,508 字节 TTF；HarmonyOS 字体从 B 站域名按 Unicode 分片请求，绕过本站 CDN。该次响应同时有 EdgeOne 和 Vercel 响应头，HTML 的 EdgeOne 状态为 MISS；这不能推断所有静态资源都未命中。

| 资源 | 修改前 | 修改后 |
| --- | ---: | ---: |
| 头像 | 667,666 B PNG | 11,530 B、240×240 WebP |
| Long Cang 常用字 | 5,162,508 B 完整 TTF | 197,032 B WOFF2 |
| Playball | 42,820 B TTF | 16,820 B WOFF2 |
| favicon | 488,269 B ICO | 9,644 B ICO |
| HarmonyOS | 54 个站外分片 | 同内容、同分片，改为本站带内容哈希的资源 |

头像和标题字体从 HTML preload 提前请求；头像组件使用同一构建 URL，实测只下载一次。原头像、原字体仍保留为生成输入，自定义 `VITE_SITE_LOGO`、站点图标路径继续生效。所有字体使用 `font-display: swap`。

Long Cang 保留全部 7,015 个 Unicode 字符：617 个站内常用字符放入一个字集，其余分为每组至多 64 字的 100 个互不重叠字集。未知的每日一句按需补充字体，不会强行限于固定文案。测试字符“丐龟”触发 2 个补充请求，合计 29,944 字节。

字体、头像和图标经 Vite 生成带内容哈希的 `/assets/` URL，沿用项目已有的一年 immutable 缓存响应头。PWA 为版本化字体使用 CacheFirst，WebP/AVIF 加入图片缓存；字体文件没有加入全量预缓存，不会为了安装 PWA 提前拉取完整字库。没有修改 CDN 控制台、DNS 或服务器配置。

验证：`npm run build` 成功，`git diff --check` 通过；原有 Sass/Browserslist 弃用提示仍存在。`pnpm build` 在本机包装器的依赖检查中失败，原因是 pnpm 的依赖构建批准检查，改用已有 node_modules 执行同一个 npm build 脚本完成验证，未修改项目 pnpm 工作区配置。

启动 `npm run preview -- --host 127.0.0.1 --port 4173` 后，执行：

```powershell
npx --yes --package @playwright/cli playwright-cli run-code --filename scripts/check-loading.pw.js
npx --yes --package @playwright/cli playwright-cli run-code --filename scripts/check-font-cache.pw.js
```

首次访问测试禁用 Service Worker，并固定每日一句，避免日期和外部接口影响资源预算。结果：头像 11,530 字节、仅下载一次；字体 24 个请求、合计 555,340 字节；站外字体和 TTF 请求均为 0；无脚本异常、无 assets 404。头像在约 38 ms 发起、主脚本约 138 ms 完成；仅用于证明启动顺序，不代表线上提速倍数。缓存测试在 Service Worker 接管后离线读取字体成功。桌面及 390×844 手机截图存放于忽略的 `output/playwright/`。

生成脚本为 `scripts/prepare-site-assets.py`，仅重新生成资源时需要 Pillow 和 `fonttools[woff]`，部署构建无需 Python。字体来源和授权文本见 `src/assets/fonts/README.md` 与 `public/font-licenses/`。

项目是 Vue 3 + Vite 的静态主页，使用 Pinia、Element Plus、Swiper 和 PWA。配置数据来自 public/data；没有需要服务器计算的视频接口。

## 线上测量

目标：https://home.evol017.top/data/chunping.mp4

本机一次 curl 下载测量：DNS 0.041 秒，连接 0.188 秒，首字节 0.516 秒；30 秒超时，只收到 195742 / 3440771 字节，平均 6523 字节/秒。响应为 200，X-Vercel-Cache: HIT，节点标识 sin1，支持 Accept-Ranges: bytes。说明该次访问的瓶颈在传输阶段，即便 CDN 命中依然很慢。此结果仅代表当前机器、线路和时间，不代表所有访客。

CNAME 正常解析到 Vercel。阿里云购买域名不意味着内容在阿里云提供。视频 MP4 的 moov 索引已经位于 mdat 前面，无需再做单纯的 faststart 重排。

## 已修改

- 独立 Prank 播放器，点击入口出现警告时才开始预加载，首页不会主动下载视频；浏览器可自行决定实际预加载量。
- 复用媒体元素，按 ended 关闭，移除固定 14.36 秒计时与 loop。
- 加载、自动播放被拦截、加载错误均有反馈，支持重试；恢复原版播放过程中无关闭按钮的行为。
- 恢复原版两次入口文案与计数：首次可取消，再次只可确认；禁用弹框关闭按钮、遮罩关闭和 Escape。保留防重复弹框。
- 视频覆盖期间保留主页和背景，退出不重新挂载。
- 去除背景完成后的随机 300–600 毫秒等待；背景失败或超过 4 秒也放行主页；缩短加载遮罩退出等待。
- Vercel 的带哈希 assets 使用一年 immutable 浏览器缓存；视频使用一天缓存。同路径替换视频时，旧浏览器缓存最多保留一天；要求立即更新时请换文件名/URL。

## 视频迁移入口

在 .env 或 Vercel 项目环境变量设置 VITE_PRANK_VIDEO_URL 为经过实际访问测试的 HTTPS MP4 直链，重新构建部署。留空使用 /data/chunping.mp4。该变量属于构建时配置。外部存储需正确提供 video/mp4，建议支持 Range 请求；避免使用下载页或需要登录的链接。

当前线路上仅预加载不足以解决首次访问。后续应比较压缩视频和独立媒体存储的效果，再决定是否迁移整个静态站。没有修改 DNS 或执行线上部署。

参考：[Vercel 静态 CDN 缓存](https://vercel.com/docs/caching/cdn-cache)、[缓存头](https://vercel.com/docs/caching/cache-control-headers)、[浏览器媒体预加载](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/preload)。

## 人工维护更新日志

更新日志在 public/data/updateRecords.json 中维护，按 fix（修复）、new（新增）、delete（移除）、update（更新）分类填写面向访客的内容。构建直接复制该文件，不读取 Git 提交，也不会覆盖人工编辑。页面版本由 package.json 的 version 字段维护。修改后提交并推送 main，随 Vercel 部署生效。
