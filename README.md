# Desktop Widgets

本地优先的个人桌面工作台。启动 `npm run dev` 后，日记、任务、组件与无限画布默认保存在当前浏览器的 IndexedDB。完整 JSON 备份包含画布内容。

## 无限画布

从桌面 Dock 或应用启动台打开「无限画布」。可以用画笔、形状和文字工具创作，拖入、粘贴或上传图片；滚轮平移，按住 Ctrl/Cmd 滚轮缩放，空格拖动画布。画笔、形状和文字工具使用一次后自动回到选择工具。选择工具下双击空白处直接写字，双击已有文字或选中后按 Enter 修改；长文字在可用画布宽度内自动换行。选中文字后拖动右侧手柄或修改「框宽」可调整文本框宽度，文字随宽度重新分行；文字属性还支持字体、字号、行距和左中右对齐，形状属性单独提供线宽。选中元素后可移动、调整形状/图片大小、改颜色，方向键微移、Shift+方向键移动 10px、Ctrl/Cmd+D 复制、Delete 删除、Ctrl/Cmd+Z 撤销，Esc 退出当前选择或工具。

点「实时共享」复制邀请链接，让对方在同一网站加入。浏览器会用随机密钥和 AES-GCM 加密画布数据，邀请链接把密钥放在 `#` 后面，发起者的浏览器也会在本地保存一份以便刷新后恢复。请只把链接发给信任的人；任何拿到链接的人都能查看和编辑。每位参与者的画布副本保存在自己的浏览器。发起者需要保持画布打开，共享连接才能继续；重新进入已加入的画布时请保存并使用原邀请链接。

公网共享优先使用本项目的 WebSocket 房间服务转发加密消息，方式接近 Excalidraw：浏览器先加密，房间服务只看得到房间号和密文，不保存画布。访客断线后会自动重连；发起者返回原邀请链接后可恢复房间。若没有配置房间服务，仍可用 PeerJS 公共信令和 WebRTC 尝试直连，但部分不同网络组合会连接失败。公开域名需使用 HTTPS。发起者离线后，当前版本没有线上房间存储或接力主机。

### 无付款方式的公网共享配置

使用 [Cloudflare Workers Free](https://developers.cloudflare.com/workers/platform/pricing/) 部署 `canvas-relay/`。Workers Free 无需付款方式；本项目使用免费档支持的 SQLite-backed Durable Object 和 WebSocket Hibernation，房间服务只转发密文、不写入存储。免费额度用尽后服务可能拒绝新请求，不会自动变成付费计划。

1. 注册或登录免费 Cloudflare 账号；在项目目录运行 `npm install`、`npx wrangler login`，完成浏览器登录。
2. 运行 `npm run relay:deploy`，记下输出的 `https://desktop-canvas-relay.<你的子域>.workers.dev` 地址。若部署页面提示启用 `workers.dev` 子域，按提示启用免费的子域。
3. 在网站的 Vercel 项目 **Settings → Environment Variables** 中，为 Production 添加 `VITE_CANVAS_RELAY_URL`，值填上一步的完整 `https://...workers.dev` 地址，然后部署本项目的新代码。无需连接 Codex 的 Vercel 账号，也无需 TURN Key。Vite 的 `VITE_` 变量会进入前端，这里只存公开的房间服务地址，没有密钥。
4. 用家用网络和手机流量分别打开同一邀请链接，确认两边都显示已连接并能同步文字、形状和图片。

如网站换域名，需在 Worker 的部署环境设置 `ALLOWED_ORIGIN` 为新的 HTTPS 域名，并重新部署。开发时可在一个终端运行 `npm run relay:dev`，另一个终端设置 `VITE_CANVAS_RELAY_URL=http://127.0.0.1:8787` 后运行 `npm run dev`，再运行 `npm run test:canvas`。

### 可选的 TURN 配置

未设置 `VITE_CANVAS_RELAY_URL` 时可选择 WebRTC + TURN。域名部署在 Vercel 时，项目根目录的 `api/canvas-turn.js` 提供同域接口 `/api/canvas-turn`。若使用 [Cloudflare Realtime TURN](https://developers.cloudflare.com/realtime/turn/generate-credentials/)，在 Vercel 项目环境变量中设置服务端的 `CANVAS_TURN_KEY_ID` 和 `CANVAS_TURN_API_TOKEN`，然后重新部署。两个值不能使用 `VITE_` 前缀，也不能写入前端或 Git。若网站不是 `https://desktop.leoenchanted.top`，另设 `CANVAS_TURN_ALLOWED_ORIGIN` 为实际 HTTPS 域名。

未配置 TURN 时接口返回 503，画布继续尝试免费 STUN 直连，但部分网络组合仍会失败。TURN 由 Cloudflare 提供，Vercel 只用于短时凭据接口；也可以将同一接口部署在其他后端。邀请密钥只留在链接的 `#` 后，不发送给凭据接口或信令服务。

内置 [思源宋体](https://github.com/google/fonts/tree/main/ofl/notoserifsc)、[站酷小薇体](https://github.com/googlefonts/xiaowei)、[马善政](https://github.com/googlefonts/mashanzheng)、[Excalifont](https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/fonts/Excalifont/index.ts) 和 [Poppins](https://github.com/google/fonts/tree/main/ofl/poppins)。字体文件随应用部署，均按 SIL Open Font License 1.1 提供；版权与许可文本随字体放在 `public/fonts/*/OFL.txt`。Excalifont 只覆盖西文字形，中文由马善政回退显示；Poppins 的中文回退到系统字体。

开发验证：按上文启动房间服务和网站，再运行 `npm run test:canvas`；可选 TURN 接口使用 `npm run test:canvas:turn`。浏览器测试使用本机 Chrome；可通过 `CHROME_PATH` 和 `CANVAS_TEST_URL` 指定其他浏览器或开发地址。本机测试不能替代不同网络的上线验收。

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
