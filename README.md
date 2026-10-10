# Desktop Widgets

本地优先的个人桌面工作台。启动 `npm run dev` 后，日记、任务、组件与无限画布默认保存在当前浏览器的 IndexedDB。完整 JSON 备份包含画布内容。

## 无限画布

从桌面 Dock 或应用启动台打开「无限画布」。可以用画笔、形状和文字工具创作，拖入、粘贴或上传图片；滚轮平移，按住 Ctrl/Cmd 滚轮缩放，空格拖动画布。画笔、形状和文字工具使用一次后自动回到选择工具。选择工具下双击空白处直接写字，双击已有文字或选中后按 Enter 修改；长文字在可用画布宽度内自动换行。选中元素后可移动、调整形状/图片大小、改颜色和字体，方向键微移、Shift+方向键移动 10px、Ctrl/Cmd+D 复制、Delete 删除、Ctrl/Cmd+Z 撤销，Esc 退出当前选择或工具。

点「实时共享」复制邀请链接，让对方在同一网站加入。浏览器会用随机密钥和 AES-GCM 加密画布数据，邀请链接把密钥放在 `#` 后面，发起者的浏览器也会在本地保存一份以便刷新后恢复。请只把链接发给信任的人；任何拿到链接的人都能查看和编辑。每位参与者的画布副本保存在自己的浏览器。发起者需要保持画布打开，共享连接才能继续；重新进入已加入的画布时请保存并使用原邀请链接。

实时连接使用 PeerJS 公共信令和 WebRTC 直连。信令服务只负责建立连接，画布内容在发送前已加密。部分严格防火墙或无法建立直连的网络可能连接失败；这不会影响本地画布使用。公开域名需使用 HTTPS。发起者离线后，当前版本没有线上房间存储或接力主机。

内置 [思源宋体](https://github.com/google/fonts/tree/main/ofl/notoserifsc)、[站酷小薇体](https://github.com/googlefonts/xiaowei)、[马善政](https://github.com/googlefonts/mashanzheng)、[Excalifont](https://github.com/excalidraw/excalidraw/blob/master/packages/excalidraw/fonts/Excalifont/index.ts) 和 [Poppins](https://github.com/google/fonts/tree/main/ofl/poppins)。字体文件随应用部署，均按 SIL Open Font License 1.1 提供；版权与许可文本随字体放在 `public/fonts/*/OFL.txt`。Excalifont 只覆盖西文字形，中文由马善政回退显示；Poppins 的中文回退到系统字体。

开发验证：先运行 `npm run dev`，再运行 `npm run test:canvas`。浏览器测试使用本机 Chrome；可通过 `CHROME_PATH` 和 `CANVAS_TEST_URL` 指定其他浏览器或开发地址。

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
