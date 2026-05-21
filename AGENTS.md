# AGENTS.md

## 项目定位

这是一个本地优先的个人桌面仪表盘项目，目标不是普通网页，而是一个可以长期自用、逐步升级的桌面工作台。

核心形态：

- 组件区：类似手机桌面小组件，可以拖拽、排序、添加组件。
- 工作区：Markdown 笔记、TodoList、番茄钟、每日回顾、备份导入、命令面板。
- 浏览器本地数据：面向部署到域名后的自用/分享场景，用户数据默认保存在访问者自己的浏览器 IndexedDB 中。
- 本地后端：Express/sql.js 作为历史本机模式和旧数据迁移能力保留，不再作为新功能的首选数据层。

后续所有改动都应该服务于“本地桌面工作台”这个方向，而不是做成通用后台管理系统或营销网页。

## 技术栈

- 前端：React 19、Vite、Tailwind CSS v4、Zustand。
- 拖拽：`@dnd-kit`。
- 图标：`react-icons`。
- Markdown：`marked` + 本地 HTML 清理函数。
- 浏览器数据库：IndexedDB，封装在 `src/data/localDb.js`。
- 浏览器持久化：启动时通过 Storage Persistence API 申请持久化存储。
- 后端：Express，仅作为本机旧数据迁移和兼容层。
- 历史本地数据库：`sql.js`，数据文件在 `server/data/widgets.db`。
- 历史本地壁纸文件：`server/data/wallpapers`。

常用命令：

```bash
npm run start
npm run dev
npm run server
npm run lint
npm run build
```

日常开发优先运行：

```bash
npm run dev
```

因为核心数据现在在浏览器 IndexedDB。需要迁移旧 Express/sql.js 数据时再运行：

```bash
npm run start
```

它会同时启动本地后端和 Vite 前端，前端会尝试从 `/api/backup/export` 做一次旧数据迁移。

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
- 移动端必须保留清晰的“组件区 / 工作区”切换入口，不能只依赖桌面端右侧箭头。
- 备份入口必须在常驻可见工具区，不能只藏在编辑桌面或设置浮层里。

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

## 移动端与 PWA

项目需要支持手机访问，目标是接近轻量 PWA：

- PWA 配置：`public/manifest.webmanifest`
- PWA 图标：`public/pwa-icon.svg`
- Service Worker：`public/sw.js`
- 注册入口：`src/main.jsx`
- 移动端区域切换：`src/components/SectionNav.jsx`

移动端规则：

- `SectionNav` 在移动端必须显示明确的双按钮分段控件：组件区 / 工作区。
- 桌面端和移动端都应在组件区/工作区内容上方居中放置一个切换按钮，使用切换图标，一次点击直接切换页面；不要再把主切换按钮固定到右侧。
- 组件区网格在移动端要压缩间距和单元尺寸，避免横跨 3 格的小组件撑出横向滚动。
- 固定按钮、备份提醒、编辑浮层要考虑 `safe-area-inset-*`，避免被 iOS 底部 Home Indicator 或顶部状态栏挡住。
- 移动端优先保证查看和轻量编辑，不要把桌面端密集工具条原样塞进窄屏。
- PWA 尽量使用沉浸式配置：`viewport-fit=cover`、透明状态栏、`display_override: ["window-controls-overlay", "standalone"]`。注意网页不能强制隐藏所有系统状态栏/窗口按钮，只能请求浏览器支持的显示模式。
- 桌面 PWA 的标题栏融合使用 Window Controls Overlay：manifest 保留 `display_override`，并可加 `window-controls-overlay.preferred_overlay = "controls-only"` 作为浏览器支持时的增强。
- 不要再用 `env(titlebar-area-height)` 给整个页面或 Header 增加顶部 padding；应该用 `navigator.windowControlsOverlay` 的几何信息给右上角窗口按钮留安全区，并保留透明拖拽区域。
- WCO 相关运行时状态在 `src/hooks/useWindowControlsOverlay.js`，样式在 `src/styles/glass.css`。修改后需要 bump `public/sw.js` 的缓存名，减少旧 manifest/service worker 残留。
- PWA manifest 显示模式变化后，用户本机已安装的旧 PWA 可能需要卸载并重新安装才会完全生效。

## 环境音控制器

环境音组件是 `src/components/AmbientPlayer.jsx`，它不是音乐播放器。它应该作为 Header 的中间紧凑控件出现，位于时间/用户名区域和设置/添加按钮之间，并且保持页面几何居中，不要做成脱离布局的 fixed 悬浮层：

- 不显示播放进度。
- 不显示时长。
- 不支持拖动进度。
- 只保留环境音选择、播放/暂停、音量、静音和播放状态。
- 环境音下拉选项必须是绝对定位浮层，不能撑开 Header 或把页面内容顶下去。
- 播放状态指示不要使用方块或竖条跳动动画，避免在玻璃面板上出现黑边闪动；优先使用细胶囊或柔和点状状态。

环境音配置：

- 声音列表：`src/data/ambientSounds.js`
- 白噪音、粉噪音、棕噪音：用 Web Audio API 在浏览器实时生成，不需要音频文件。
- 雨声、海浪、风暴：读取本地短循环音频文件。

本地音频文件位置：

```text
public/audio/ambient/rain.mp3
public/audio/ambient/ocean.mp3
public/audio/ambient/storm.mp3
```

文件规则：

- 优先使用 20-90 秒左右的可循环环境音。
- 文件名必须和 `src/data/ambientSounds.js` 中的 `fileName` 对应。
- 不要默认热链第三方音频 URL，避免 CORS、失效、版权和 PWA 离线问题。
- 如果新增音频类型，先更新 `src/data/ambientSounds.js`，再补充本节说明。

IndexedDB settings 字段：

- `ambientSound`：当前环境音 ID。
- `ambientVolume`：音量，范围 0-1。
- `ambientMuted`：是否静音。

不要保存 `isPlaying`，避免用户打开页面时自动出声；浏览器移动端也通常要求用户手动触发播放。

## 番茄钟规则

番茄钟相关文件：

- UI：`src/components/workarea/PomodoroTimer.jsx`
- 状态：`src/store/usePomodoroStore.js`
- 记录：`src/api/pomodoroApi.js`

规则：

- 默认时长保持 25 分钟。
- 用户可以设置时长，允许范围 5-120 分钟。
- 设置项保存到 IndexedDB `settings.pomodoroDuration`。
- 运行中或暂停中的番茄钟状态保存到 IndexedDB `settings.pomodoroActiveSession`，用于 PWA 后台恢复和页面刷新恢复。
- 运行中修改时长不强制重置当前倒计时；未运行时修改时长会重置当前显示时间。
- 完成记录里的 `duration` 必须使用实际设置的时长，今日专注分钟数应按历史 session 的 duration 求和。
- 番茄钟在工作区侧栏窄卡片里必须完整显示；新增控件时要按 280px 左右宽度检查，不能让时长按钮、圆环或统计区溢出。
- 页面跨天时，番茄钟 `currentDate` 和今日统计必须自动切到新日期；如果计时器正在运行，不要强制打断当前倒计时。
- 番茄钟倒计时必须使用 deadline-based 真实时间模型：开始时记录 `startedAt` 和 `endsAt`，显示时用 `endsAt - Date.now()` 计算剩余时间；`setInterval` 只能用来刷新 UI，不能作为真实计时来源。
- 页面从后台恢复、窗口重新聚焦或 PWA 被系统节流后，必须调用 `syncWithClock` 校准剩余时间；如果已经过了 `endsAt`，自动完成本次番茄钟。

## 组件区尺寸规则

组件区使用 CSS grid + `w/h` 跨格尺寸：

- 布局数据在 `widgets` store 的 `layout` 记录里。
- 组件定义在 `src/config/widgetRegistry.js`。
- 每个组件必须配置 `defaultW/defaultH`，可调整大小的边界用 `minW/minH/maxW/maxH`。
- `defaultW/defaultH` 不能小于 `minW/minH`，默认桌面布局也必须从 registry 默认尺寸生成，不要手写低于最小尺寸的旧值。
- 加载旧布局或导入布局时必须经过 `normalizeWidgetLayout` 修正，避免历史数据低于组件最小尺寸。
- 编辑模式下通过 `src/components/SortableItem.jsx` 的右下角 handle 调整大小。
- 如果达到组件自己的最小尺寸，不能继续缩小。
- 移动端优先保证布局稳定，当前不显示 resize handle。

组件内容必须根据容器自适应：

- `SortableItem` 的内部容器使用 `widget-card`，开启 container query。
- 组件内部根元素优先加 `widget-content`。
- 文本必须 clamp、滚动或隐藏溢出，不能遮挡别的内容或撑破组件。
- 固定尺寸元素，例如日历日期圆点，必须跟随容器尺寸缩放。

## 数据规则

生产力数据由浏览器 IndexedDB 负责。核心封装：

- 数据库封装：`src/data/localDb.js`
- 旧数据迁移：`src/data/migrations.js`
- Todo：`src/api/todoApi.js`
- Markdown：`src/api/markdownApi.js`
- 每日回顾：`src/api/reviewApi.js`
- 番茄钟：`src/api/pomodoroApi.js`
- 备份导入：`src/api/backupApi.js`
- 壁纸/图片资产：`src/api/wallpaperApi.js`

IndexedDB stores：

- `settings`：应用设置，例如用户名、当前分区、壁纸类型、持久化存储状态、备份提醒时间。
- `widgets`：组件布局和组件实例配置，例如 `layout`、`image:<widgetId>`。
- `todos`：任务清单，按 `date` 建索引。
- `markdown_entries`：Markdown 按日草稿，主键使用本地日期 `YYYY-MM-DD`；旧版 `date = "workspace"` 只作为迁移兼容来源。
- `daily_reviews`：每日回顾，按日期保存当天汇总和手写备注。
- `pomodoro_sessions`：番茄钟完成记录，按 `date` 建索引。
- `assets`：本地图片/壁纸 Blob，按 `type` 建索引。

`localStorage` 只作为旧数据迁移来源：

- `glass_items`
- `glass_bg`
- `glass_user`
- `glass_section`
- `glass_sign`

不要再把新功能的数据写入 `localStorage`，除非只是读取旧值并迁移到 IndexedDB。

后续升级重点：继续完善组件私有配置，让每个组件实例的数据都能进入 IndexedDB 和完整备份。

日期必须使用 `src/utils/date.js` 里的本地日期工具。不要用：

```js
new Date().toISOString().slice(0, 10)
```

原因：它是 UTC 日期，在 Asia/Shanghai 凌晨时可能串到前一天。

跨天刷新规则：

- 页面保持打开跨过本地 0 点时，必须用 `src/hooks/useTodayKey.js` 触发日期更新，不要只在组件初次加载时读取一次 `today()`。
- Todo、番茄钟今日统计和今日回顾都应该响应 `todayKey` 变化自动刷新到新一天。
- 今日回顾保留手动刷新按钮，同时可以根据 Todo、番茄钟和 Markdown 字数变化做轻量自动刷新。

## Markdown 规则

Markdown 相关文件：

- `src/components/workarea/MarkdownEditor.jsx`
- `src/components/workarea/MarkdownPreview.jsx`
- `src/store/useMarkdownStore.js`
- `src/styles/animations.css`
- `src/utils/sanitizeHtml.js`

草稿保存规则：

- 新草稿必须按本地日期保存，`date` 使用 `YYYY-MM-DD`。
- 页面跨天时，编辑器必须自动切到新一天空白草稿。
- 用户必须能通过日期选择器回看历史日期草稿。
- 旧版 `workspace` 长期草稿不能丢失，导入或首次读取时按 `updated_at/created_at` 推断日期，推不出来才落到今天。

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

日记草稿导出规则：

- `MarkdownEditor` 必须保留导出 TXT 入口。
- 导出前先保存当前草稿内容。
- TXT 文件使用 UTF-8，并带 BOM 以减少 Windows 中文乱码。
- 文件名格式保持类似 `desktop-widgets-draft-YYYY-MM-DD.txt`。
- `MarkdownEditor` 必须保留“清空当前日期草稿”和“撤回清空”入口，防止误清空后无法恢复。
- 编辑器工具栏里的图标按钮要保持稳定尺寸和稳定按压反馈，不要继承会导致闪烁的缩放式 active 动画。
- Markdown 编辑和预览都必须在固定编辑器卡片内部滚动；预览内容再长也不能撑高工作区 grid 或带着左右组件一起变高。

## 壁纸规则

壁纸支持：

- 图片 URL。
- 本地图片上传后存入 IndexedDB 的 `assets` store。
- 上传图片会做高质量压缩：只在图片过大或体积过大时缩放到最长边 2560px，编码质量保持较高，避免明显损失画质。
- 如果 IndexedDB 保存失败，回退到浏览器 data URL。
- 壁纸设置入口必须作为 Header 顶部按钮，放在「编辑桌面」旁边；不要再藏进编辑模式底部浮层。

相关文件：

- `src/App.jsx`
- `src/components/WallpaperPanel.jsx`
- `src/api/wallpaperApi.js`
- `src/utils/imageCompression.js`

不要随意删掉 fallback，除非确认 IndexedDB 和浏览器文件能力永远可用。

## 备份格式

完整备份由前端导出 JSON，文件名类似：

```text
desktop-widgets-backup-YYYY-MM-DD.json
```

当前格式：

```json
{
  "version": 3,
  "app": "desktop-widgets",
  "storage": "indexeddb",
  "exportedAt": "2026-05-19T00:00:00.000Z",
  "data": {
    "settings": [],
    "widgets": [],
    "todos": [],
    "markdown_entries": [],
    "daily_reviews": [],
    "pomodoro_sessions": [],
    "assets": []
  }
}
```

`assets` 导出时会把 Blob 转成 `dataUrl`，导入时再转回 Blob 存进 IndexedDB。修改备份格式时必须提高 `version`，并在导入逻辑里兼容旧格式。

Markdown 备份兼容规则：

- v2 及更早版本可能存在 `markdown_entries[].date = "workspace"`。
- 导入时必须把 `workspace` 草稿迁移为按日草稿，优先使用 `updated_at`，其次 `created_at`，最后使用今天。
- 如果迁移目标日期已经有草稿内容，必须合并内容，不能直接覆盖。

备份提醒规则：

- 设置项 `lastBackupAt` 记录最近一次导出时间。
- 超过 7 天未导出时，前端显示备份提醒。
- 设置项 `backupReminderSnoozedAt` 记录当天稍后提醒。

## 域名迁移警告

域名即将失效或迁移时，必须优先保护用户本地 IndexedDB 数据：

- 全局迁移弹窗组件在 `src/components/DomainMigrationWarning.jsx`。
- 旧域名打开应用时必须立即提醒用户导出完整 JSON 备份，并引导迁移到 `https://desktop.leoenchanted.top`。
- 用户关闭弹窗后，每 30 分钟必须再次弹出提醒，避免长时间不刷新页面的用户错过备份。
- 新目标域名 `desktop.leoenchanted.top` 本身不要显示旧域名失效警告，避免用户迁移完成后仍被误导。
- 本地开发域名 `localhost`、`127.0.0.1` 默认不弹出；需要测试时可以在 URL 加 `?forceMigrationWarning=1`。
- 弹窗里必须保留一键导出 JSON 入口，直接调用现有完整备份逻辑，不要另写一套不完整导出。

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

1. 给备份导入加版本迁移、导入前预览和二次确认。
2. 继续让每个组件实例都有自己的持久化配置，例如星座组件的实例级配置。
3. 把工作区右下角的“灵感暂存”升级成真正的便签/快速记录模块。
4. 增加 IndexedDB 使用量可视化，提示用户及时导出大体积资源。
5. 在桌面端视觉稳定后，再系统优化移动端响应式布局。

## 修改约束

- 保持改动聚焦，不要顺手大范围重构无关模块。
- 优先沿用当前项目模式和 `src/components/ui` 基础组件。
- 不要为了 API routes 轻易迁移到 Next.js。
- 保持本地优先、离线友好。
- 核心日常功能不要依赖联网服务。
- 域名部署场景下，用户数据必须留在用户自己的浏览器本地，不要默认上传到远程服务。
- UI 改动默认延续 Apple 风格玻璃工作台方向，除非用户明确要求换视觉语言。
- 默认不要主动 `git commit` 或 `git push`。改完代码后只运行验证并说明改动，推送 GitHub 由用户本地测试确认后自己操作；只有用户明确要求“提交/推送”时才执行。
