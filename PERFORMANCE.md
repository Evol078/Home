# 性能排查与修改（2026-10-28）

项目是 Vue 3 + Vite 的静态主页，使用 Pinia、Element Plus、Swiper 和 PWA。配置数据来自 public/data；没有需要服务器计算的视频接口。

## 线上测量

目标：https://home.evol017.top/data/chunping.mp4

本机一次 curl 下载测量：DNS 0.041 秒，连接 0.188 秒，首字节 0.516 秒；30 秒超时，只收到 195742 / 3440771 字节，平均 6523 字节/秒。响应为 200，X-Vercel-Cache: HIT，节点标识 sin1，支持 Accept-Ranges: bytes。说明该次访问的瓶颈在传输阶段，即便 CDN 命中依然很慢。此结果仅代表当前机器、线路和时间，不代表所有访客。

CNAME 正常解析到 Vercel。阿里云购买域名不意味着内容在阿里云提供。视频 MP4 的 moov 索引已经位于 mdat 前面，无需再做单纯的 faststart 重排。

## 已修改

- 独立 Prank 播放器，点击入口出现警告时才开始预加载，首页不会主动下载视频；浏览器可自行决定实际预加载量。
- 复用媒体元素，按 ended 关闭，移除固定 14.36 秒计时与 loop。
- 加载、自动播放被拦截、加载错误均有反馈，支持重试、关闭及 Escape。
- 每次均可取消警告，防止重复弹框；取消不会削弱下次警告。
- 视频覆盖期间保留主页和背景，退出不重新挂载。
- 去除背景完成后的随机 300–600 毫秒等待；背景失败或超过 4 秒也放行主页；缩短加载遮罩退出等待。
- Vercel 的带哈希 assets 使用一年 immutable 浏览器缓存；视频使用一天缓存。同路径替换视频时，旧浏览器缓存最多保留一天；要求立即更新时请换文件名/URL。

## 视频迁移入口

在 .env 或 Vercel 项目环境变量设置 VITE_PRANK_VIDEO_URL 为经过实际访问测试的 HTTPS MP4 直链，重新构建部署。留空使用 /data/chunping.mp4。该变量属于构建时配置。外部存储需正确提供 video/mp4，建议支持 Range 请求；避免使用下载页或需要登录的链接。

当前线路上仅预加载不足以解决首次访问。后续应比较压缩视频和独立媒体存储的效果，再决定是否迁移整个静态站。没有修改 DNS 或执行线上部署。

参考：[Vercel 静态 CDN 缓存](https://vercel.com/docs/caching/cdn-cache)、[缓存头](https://vercel.com/docs/caching/cache-control-headers)、[浏览器媒体预加载](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/preload)。
