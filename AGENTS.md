# AGENTS.md

## 项目定位

这是一个本地优先的个人桌面仪表盘项目，目标不是普通网页，而是一个可以长期自用、逐步升级的桌面工作台。

核心形态：

- 组件区：类似手机桌面小组件，可以拖拽、排序、添加组件。
- 工作区：Markdown 笔记、TodoList、番茄钟、每日回顾、备份导入、命令面板。
- 本地后端：用 Node.js/Express 在本机保存数据，不依赖联网服务。

后续所有改动都应该服务于“本地桌面工作台”这个方向，而不是做成通用后台管理系统或营销网页。

## 技术栈

- 前端：React 19、Vite、Tailwind CSS v4、Zustand。
- 拖拽：`@dnd-kit`。
- 图标：`react-icons`。
- Markdown：`marked` + 本地 HTML 清理函数。
- 后端：Express。
- 本地数据库：`sql.js`，数据文件在 `server/data/widgets.db`。
- 本地壁纸文件：`server/data/wallpapers`。

常用命令：

```bash
npm run start
npm run dev
npm run server
npm run lint
npm run build
```

日常使用优先运行：

```bash
npm run start
```

因为它会同时启动本地后端和 Vite 前端。

## 视觉方向

当前 UI 方向：**Apple 风格的玻璃桌面工作台 / glass cockpit**。

设计要求：

- 中文字体优先接近 Apple UI：`PingFang SC`、`Hiragino Sans GB`。
- 英文和数字优先：`SF Pro Text`、`SF Pro Display`。
- Windows 环境没有苹方时，再回退到 `Microsoft YaHei UI`、`Segoe UI Variable`。
- 不要使用过大的标题。除了顶部时间，其他标题都应克制。
- 工作区要像高质量桌面工具，不要像普通网页 Dashboard。
- 使用细边框、轻玻璃、低噪声阴影、克制的蓝/绿点缀。
- 不要使用紫色渐变、装饰光球、漂浮圆点、通用 AI 风背景。
- 不要做卡片套卡片。只有重复项、弹窗、工具面板可以像卡片。
- 紧凑操作优先用图标按钮，并加 `title` 提示。

重要样式文件：

- `src/index.css`
- `src/styles/glass.css`
- `src/styles/animations.css`
- `src/components/ui/*`

## UI 基础组件

通用 UI 组件在 `src/components/ui`：

- `GlassPanel.jsx`
- `PanelHeader.jsx`
- `IconButton.jsx`
- `StatusPill.jsx`
- `SegmentedControl.jsx`
- `EmptyState.jsx`

新增 UI 时优先复用这些组件，不要到处写一套新的 `bg-white/10 border rounded`。

## 数据规则

生产力数据由本地后端负责：

- Todo：`server/routes/todos.js`
- Markdown：`server/routes/markdown.js`
- 每日回顾：`server/routes/reviews.js`
- 番茄钟：`server/routes/pomodoro.js`
- 备份导入：`server/routes/backup.js`
- 壁纸文件：`server/routes/wallpaper.js`

仍在 `localStorage` 的旧数据：

- `glass_items`
- `glass_bg`
- `glass_user`
- `glass_section`
- `glass_sign`

后续升级重点：把组件布局、应用设置、组件私有配置迁移进后端数据库，让备份/导入能覆盖完整数据。

日期必须使用 `src/utils/date.js` 里的本地日期工具。不要用：

```js
new Date().toISOString().slice(0, 10)
```

原因：它是 UTC 日期，在 Asia/Shanghai 凌晨时可能串到前一天。

## Markdown 规则

Markdown 相关文件：

- `src/components/workarea/MarkdownEditor.jsx`
- `src/components/workarea/MarkdownPreview.jsx`
- `src/store/useMarkdownStore.js`
- `src/styles/animations.css`
- `src/utils/sanitizeHtml.js`

预览必须正确支持：

- 标题
- 无序列表 / 有序列表
- 任务列表
- 行内代码 / 代码块
- 表格
- 引用
- 图片
- 分割线

修改 Markdown 渲染时，不要绕过 `sanitizeHtml`。

## 壁纸规则

壁纸支持：

- 图片 URL。
- 本地图片上传到 Express 后端。
- 如果后端上传失败，回退到浏览器 data URL。

相关文件：

- `src/App.jsx`
- `src/api/wallpaperApi.js`
- `server/routes/wallpaper.js`

不要随意删掉 fallback，除非确认本地后端永远可用。

## 验证要求

每次改完代码至少运行：

```bash
npm run lint
```

环境允许时再运行：

```bash
npm run build
```

注意：某些沙箱环境下，Vite/esbuild 可能因为父目录读取权限失败而无法 build。这种情况不一定是项目代码错误。

## 后续升级优先级

建议优先做：

1. 把组件布局和应用设置从 `localStorage` 迁移到后端数据库。
2. 让每个组件实例都有自己的持久化配置，例如图片组件、星座组件。
3. 给备份导入加版本迁移、导入前预览和二次确认。
4. 把工作区右下角的“灵感暂存”升级成真正的便签/快速记录模块。
5. 在桌面端视觉稳定后，再系统优化移动端响应式布局。

## 修改约束

- 保持改动聚焦，不要顺手大范围重构无关模块。
- 优先沿用当前项目模式和 `src/components/ui` 基础组件。
- 不要为了 API routes 轻易迁移到 Next.js。
- 保持本地优先、离线友好。
- 核心日常功能不要依赖联网服务。
- UI 改动默认延续 Apple 风格玻璃工作台方向，除非用户明确要求换视觉语言。
