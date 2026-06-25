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
- 动画：`framer-motion`。
- 图标：`react-icons`。
- Markdown：`marked` + 本地 HTML 清理函数。
- WebGL 背景特效：Three.js，运行时优先 CDN 加载，保留本地依赖 fallback。
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

## 全局背景特效规则

全局 WebGL 背景特效是壁纸之上的环境层，不是编辑器局部特效。

相关文件：

- `src/components/workarea/WorkspaceFxLayer.jsx`
- `src/components/WorkspaceFxControl.jsx`
- `src/config/workspaceFxModes.js`
- `src/store/useSettingsStore.js`
- `src/styles/glass.css`

交互规则：

- 特效默认每次进入应用都必须是关闭状态，用户需要手动打开。
- `workspaceFxEnabled` 只作为当前会话 UI 状态，不写入 IndexedDB，也不要写入 `localStorage`。
- 可以持久化 `workspaceFxMode`，让用户下次手动开启时继续使用上次选择的特效模式。
- 全局入口放在常驻可见工具区，当前为右下角特效按钮。
- 点击特效按钮应打开设置面板，不要直接在按钮旁边放常驻下拉框。
- 设置面板上方是开关按钮，下方才是特效模式选项。
- 不要再把特效按钮放进 Markdown 编辑器工具栏，也不要默认启用编辑器内部特效。

渲染层级规则：

- 特效层必须覆盖整个页面背景，作用范围是全 viewport。
- 特效层位于壁纸/背景遮罩之上，但必须低于 Header、组件区、工作区、弹窗、命令面板和全局工具按钮。
- 特效 canvas 必须 `pointer-events: none`，不能影响拖拽、点击、编辑和快捷操作。
- 不要把特效限制在 Markdown 编辑器、工作区某张卡片或单个组件内部。

实现规则：

- Three.js 运行时优先从 CDN 加载，线上可直接使用 CDN；同时保留 `import('three')` fallback，避免 CDN 失败时完全不可用。
- 新增特效模式先更新 `src/config/workspaceFxModes.js`，再在 `WorkspaceFxLayer.jsx` 里补实现。
- 关闭或切换特效时只做动画取消、资源 dispose 和 renderer clear；不要在正常开关流程里调用 `renderer.forceContextLoss()`，否则同一个 canvas 重新开启可能不渲染。
- 需要按设备性能和 `prefers-reduced-motion` 降低粒子密度，并在页面隐藏时暂停渲染。
- 特效不能成为核心日常功能依赖；CDN 失败时工作台本身必须照常可用。

## 更新日志规则

更新日志数据在 `src/data/changelog.js`，展示组件在 `src/components/ChangelogPanel.jsx`：

- 日志展示必须按日期分组，同一天多次更新只显示一个日期节点。
- `CHANGELOG` 数据可以继续按单条改动追加，但 `ChangelogPanel` 必须把相同 `date` 的记录归档到同一个日期下。
- 新增日志时优先把标题写成具体功能点，不要把同一天的日期重复做成多个时间轴节点。
- 如果后续改成真正的分组数据结构，也必须兼容旧的扁平数组格式。

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
- 用户可以设置时长，允许范围 1-120 分钟。
- 设置项保存到 IndexedDB `settings.pomodoroDuration`。
- 结束提示音默认开启，设置项保存到 IndexedDB `settings.pomodoroSoundEnabled`。
- 桌面通知默认关闭，只能由用户在番茄钟设置面板里手动开启；开启时请求浏览器 Notification 权限，设置项保存到 IndexedDB `settings.pomodoroNotificationEnabled`。
- 番茄钟设置面板必须保证足够深的背景和文字对比度，复杂壁纸或全局特效开启时也要清楚可读。
- 番茄钟设置面板打开后，点击面板外部区域应自动关闭；点击面板内部控件或设置按钮本身不能误关。
- 番茄钟结束提醒必须只在一次真实完成事件后触发一次，不能因为 React 重渲染、页面恢复或跨天同步重复播放提示音/重复弹通知。
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
- 活动统计：`src/api/activityApi.js`
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
- `pinned_notes`：工作区置顶记录，主记录 id 为 `main`，长期保留，不按日期切换。
- `backup_snapshots`：自动备份内部快照，不进入普通完整 JSON 导出，用户可以从备份面板里恢复。

IndexedDB 升级规则：

- 每次新增 object store 都必须提高 `src/data/localDb.js` 的 `DB_VERSION`。
- `openDb` 必须处理 `onblocked`、打开超时和 `onversionchange`，避免用户开着旧标签页/PWA 时一直卡在“正在打开本地工作台”。
- App 启动初始化必须捕获 IndexedDB 打开失败并给用户显示可操作提示，不要让加载页无限等待。

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

工作区布局规则：

- 桌面端三列工作区必须有稳定高度，左右栏不能因为 Todo 或其他列表内容变多而撑高整行。
- 工作区板块高度由 `workspace-grid`、`workspace-stack` 的比例轨道分配，不允许由内部文字或列表内容反向撑高。
- 侧栏板块统一使用 `workspace-fixed-panel`，高度必须等于父级轨道高度，内部内容自己滚动或收缩。
- TodoList 的任务列表必须在卡片内部滚动；任务很多时不能撑高右侧栏，也不能带着中间 Markdown 编辑器一起变高。TodoList 外层必须像 MarkdownEditor 一样使用 `overflow-hidden`，不能为了日期弹层改回 `overflow-visible`。
- TodoList 的任务列表层必须脱离普通文档流：外层 `todo-list-panel` 相对定位，头部 `todo-list-header` 固定高度，任务滚动层 `todo-list-scroll` 绝对定位到底部，防止任务项参与卡片高度计算。
- Todo 日期选择器需要保留可见弹层；日期弹层应通过 portal/fixed 浮在 body 上，不要依赖卡片外层 `overflow-visible`。
- 窄屏和移动端不能只靠 grid 行高继承；`workspace-fixed-panel` 自身也必须设置固定高度和 `max-height`，防止内容反推卡片高度。

活动热力图与月度总结规则：

- 活动热力图组件在 `src/components/workarea/ActivityHeatmap.jsx`，日度统计 API 在 `src/api/activityApi.js`。
- 活动热力图是跨日期统计视图，不属于单日日记编辑器内部功能；当前放在左侧工作区侧栏，接替原“今日回顾”位置，和番茄钟同级。
- 第一版统计直接读取现有 IndexedDB stores，不新增 object store：`markdown_entries`、`todos`、`pomodoro_sessions`、`daily_reviews`。
- 每日活动数据必须统一输出日期、score、level、日记活动字数/字符数、Todo 完成数/总数、番茄钟专注分钟、每日回顾状态，后续月度总结必须优先复用该结构。
- score 只用于热力图颜色深浅和趋势概览，不应覆盖或修改原始业务数据；日记记录强度必须使用统一活动字数统计，中文按字、英文和数字按词组，忽略空白和标点，不要混用原始 `content.length` 字符长度。
- 热力图详情区已有当天拆分进度条时，不要再叠加重复的累计字数、任务、专注三格指标。
- 点击热力图日期只更新热力图下方的当天详情，不应直接切换整个工作区日期；详情区必须提供明确的“跳到这一天”按钮，由用户确认后再切换日记、Todo、番茄钟统计等工作区日期。
- 热力图默认打开后应滚动到今天所在视角附近，避免用户每次手动横向滚动才能看到当前日期。
- 热力图颜色使用绿色系整块填充，越深表示当天记录/活动越多；不要使用蓝紫渐变或只靠透明度淡化来表示强度。
- 热力图格子必须使用稳定尺寸和内部滚动，不能撑高 `workspace-grid` 或侧栏；详情区要保证深色背景和足够文字对比度。
- 在热力图或其他高频实时统计组件里使用 Zustand store 时，selector 不要直接返回新的对象字面量或新数组；应分别订阅稳定字段，再用 `useMemo`/组件内部逻辑合并，避免 React/Zustand 循环渲染导致首页空白。
- 后续月度总结应基于 `activityApi.getMonthlySummary(year, month)` 或同等 API 汇总，不要在 UI 组件里重新散写一套统计逻辑。

Todo 每日重复（图钉置顶）规则：

- 每条 todo 支持 `pinned: boolean` 和 `pinGroupId: string` 字段。
- 点击图钉按钮 → 生成新 `pinGroupId`（uuid），设置 `pinned: true`，同时 `sort_order: 0`，其他 todo 下移，置顶项自动移到列表最前面（带 framer-motion 动画）。
- 取消置顶 → 当前日期取消置顶；**未来日期**的同 `pinGroupId` 实例直接删除；**过去日期**的实例保留记录但取消置顶，不再继续克隆。
- `todoApi.clonePinnedForDate(date)` 在 `fetchTodos` 加载目标日期时调用。
- 克隆逻辑：扫描所有 `pinned: true` 的记录 → 按 `pinGroupId` 去重保留最新 → 只从比目标日期更早的源克隆（`source.date < date`）→ 检查目标日期是否已有同组 ID → 没有则克隆（`completed: 0`）。
- 克隆是延迟策略：不预生成数据，只在加载日期时检测补充。修改已置顶 todo 的文字后，后续克隆会使用新文字。
- TodoItem 使用 `motion.div` + `layout` 属性，列表重排时自动 FLIP 动画。

## Markdown 规则

Markdown 相关文件：

- `src/components/workarea/MarkdownEditor.jsx`
- `src/components/workarea/MarkdownEditorSettingsPanel.jsx`
- `src/components/workarea/GlowingTextarea.jsx`
- `src/components/workarea/VditorWrapper.jsx`
- `src/components/workarea/MarkdownPreview.jsx`
- `src/components/workarea/TabBar.jsx`
- `src/store/useMarkdownStore.js`
- `src/styles/animations.css`
- `src/styles/vditor-overrides.css`
- `src/utils/sanitizeHtml.js`

编辑器有两种模式（`editorMode: 'plain' | 'markdown'`），通过 SegmentedControl 切换：

- **纯文本模式**（`plain`）：基于 textarea 的原始文本编辑，并通过 `GlowingTextarea` 渲染自定义发光输入光标。
- **Markdown 模式**（`markdown`）：基于 Vditor 的 WYSIWYG 实时渲染引擎（Typora 风格）。
- content 始终保存为原始 markdown，不混入 HTML。TXT/JSON 导出使用原始 markdown。
- Markdown 模式下，Vditor 接管 markdown→HTML 渲染和 HTML→markdown 输出的全部工作。
- 切换日期时，Vditor 自动通过 `content` prop 重新加载对应日期的 markdown 内容。
- WYSIWYG 模式下表格通过 setValue() 加载时由 Lute 解析渲染为 HTML 表格，不支持管道符手动输入表格。

内容安全机制：

- **VditorWrapper cleanup 存档**：组件卸载时先通过 `onContentChange(instance.getValue())` 主动保存 Vditor 当前内容到 store，再执行 `destroy()`。防止 destroy 阶段异步 `input("")` 清空 store。
- **isDestroyingRef**：`input` 回调中检查 `isDestroyingRef.current`，为 true 时直接 return，阻止销毁阶段残留事件传播。
- **MarkdownEditor contentBackupRef**：render 阶段捕获最新非空 `content` 到 ref，textarea 使用 `value={content || contentBackupRef.current}` 兜底，模式切换时如果 store 被清空则从 ref 恢复。
- **模式切换恢复**：从纯文本切回 Markdown 时，如果 store 内容为空但 ref 有内容，自动 `setContent(contentBackupRef.current)` 恢复。
- 不再使用 `isUpdatingRef` 守卫（`setValue(content, false)` 的 false 参数本身足够防止循环），移除后修复了新页面 Markdown 模式打字 stats 不更新的问题。

编辑器分页规则：

- `src/components/workarea/TabBar.jsx` — 标签栏组件，支持新建、切换、关闭、双击重命名页面。
- 每个日期可创建多个独立页面（`pages` 数组），存储在同一个 IndexedDB 记录中，不改变 DB schema。
- 旧数据自动兼容：加载时无 `pages` 字段的记录自动包装为单页 `[{ id, title: '草稿', content }]`。
- `useMarkdownStore` 的 `pages`/`activePageId` 状态控制当前页，`setContent` 只更新活跃页内容。
- 切换页面时自动更新 `content`、`wordCount`、`charCount` 为对应页的数据。
- 清空/撤回绑定当前页面：`clearedDraft` 记录 `pageId`，切换页面后撤回按钮自动禁用。
- TXT 导出只导出当前活跃页内容。

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

日记草稿发光光标规则：

- 纯文本模式必须保留自定义发光光标，不能退回普通浏览器默认光标；发光效果应明显但延续蓝绿玻璃工作台风格。
- 日记草稿工具栏必须保留文本编辑器设置入口，后续字体、行高、密度等编辑器偏好应继续放进该设置面板，不要分散到全局设置或其他浮层。
- 编辑器设置面板必须通过 portal/fixed 渲染，背景要足够深、文字对比度要足够高，不能被编辑器或工作区的 `overflow-hidden` 裁切。
- 发光光标必须允许用户自行开关，并支持亮度调节；设置项保存到 IndexedDB `settings.editorGlowCaretEnabled` 和 `settings.editorCaretGlowIntensity`，不要写入 `localStorage`。
- `GlowingTextarea` 仍以原生 textarea 作为真实输入层，必须保留 `ref`、`selectionStart/selectionEnd`、`setSelectionRange()` 和滚动能力，避免破坏搜索跳转、Tab 缩进、中文输入法和移动端输入。
- 发光光标定位必须支持多行、自动折行、滚动、点击、方向键移动和搜索结果跳转；选中文本时可以隐藏自定义光标，避免遮挡选区。
- 打字时光标保持常亮，停顿后再恢复闪烁；需要尊重 `prefers-reduced-motion`，降低或关闭光标动画。
- Markdown/Vditor 模式也必须支持发光光标；当前通过 Selection/Range 坐标在 Vditor 容器上叠加光标层，不直接改写 Vditor 内部 markdown 内容或插入持久 DOM。
- 关闭发光光标时，纯文本和 Markdown/Vditor 模式都必须恢复浏览器默认输入光标，避免不喜欢发光效果的用户无法关闭。

日记草稿搜索规则：

- 搜索入口放在 `MarkdownEditor` 的日记草稿工具栏内，不做全局搜索入口。
- 搜索范围覆盖 IndexedDB `markdown_entries` 中所有日期和页面。
- 搜索结果必须显示日期、页面标题和相关片段，并高亮关键词。
- 搜索结果浮层应通过 portal/fixed 渲染，避免被编辑器、工作区或其他 `overflow-hidden` 容器裁切。
- 搜索浮层必须保证足够深的背景和文字对比度，复杂壁纸或全局特效开启时也要清楚可读。
- 点击搜索结果前应先保存当前草稿，再跳转到目标日期和页面。
- 第一版定位优先使用纯文本 textarea 的 selection 定位；Markdown/Vditor 模式可自动切到纯文本以保证定位准确。

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
  "version": 4,
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
    "assets": [],
    "pinned_notes": []
  }
}
```

`assets` 导出时会把 Blob 转成 `dataUrl`，导入时再转回 Blob 存进 IndexedDB。修改备份格式时必须提高 `version`，并在导入逻辑里兼容旧格式。

当前备份版本为 v4，新增 `pinned_notes`。旧备份没有该字段时按空数组处理。

## 置顶记录规则

置顶记录组件在 `src/components/workarea/PinnedNote.jsx`，数据 API 在 `src/api/pinnedNoteApi.js`：

- 置顶记录是长期文本板，不按日期变化，不跨天清空。
- 置顶记录支持多个用户自定义分类，每个分类相当于一个长期页面，适合拆分链接、重要事项等长期信息。
- `pinned_notes` 主记录仍固定为 `main`，分类数据保存在同一条记录的 `categories` 数组中，不新增 object store。
- 旧版 `content` 字段必须兼容迁移为默认分类，不能丢失旧置顶记录内容。
- 小卡片视图只编辑当前分类，并必须显示当前所在分类。
- 支持展开为全屏大窗口编辑（点击 FaExpandAlt 按钮），展开弹窗与卡片视图共享同一 state，无独立状态。
- 展开弹窗通过条件渲染（`expanded` state）内联在主组件中，使用 `createPortal` 渲染到 `document.body` 以避开 Layout 容器 `transform` 对 `position: fixed` 的影响。
- 展开弹窗左侧显示分类列表，支持新增、重命名、删除分类；分类列表可以收起，收起后仍应通过图标/首字提示当前分类。
- 内容自动保存到 IndexedDB `pinned_notes`，当前分类内容和分类列表变更都必须保存。
- UI 必须保留复制当前分类为新分类、清空当前分类和撤回清空，避免误删后无法恢复。
- “复制当前分类”表示新建一个内容相同的分类副本，不是复制文本到剪贴板。
- 删除分类必须保留至少一个分类，并需要二次确认。
- 每个分类可以单独加密码锁；分类更多菜单使用三点按钮，锁相关选项放在该菜单内。
- 置顶记录密码固定为 6 位数字 PIN，输入界面必须支持屏幕数字键盘和实体键盘输入。
- 第一次锁住分类时如果尚未设置密码，必须先引导用户设置并确认 6 位 PIN。
- 置顶记录密码不能明文保存；使用 Web Crypto PBKDF2 派生密钥，AES-GCM 加密已锁分类内容。
- 已锁分类导出到 JSON 时只能包含密文，不应包含明文内容或明文 PIN。
- 修改密码时必须先验证旧 PIN，并用新 PIN 重新加密所有已锁分类。
- 忘记 PIN 后无法恢复已加密分类内容，UI 和文档说明必须明确这一点。
- 内容很多时必须在组件内部滚动，不能撑高工作区侧栏。
- 可以提示“仅保存在当前浏览器本地，公共电脑不要保存敏感密码”，但当前不做加密。
- 完整 JSON 导出、导入和自动快照都必须包含 `pinned_notes`。

Markdown 备份兼容规则：

- v2 及更早版本可能存在 `markdown_entries[].date = "workspace"`。
- 导入时必须把 `workspace` 草稿迁移为按日草稿，优先使用 `updated_at`，其次 `created_at`，最后使用今天。
- 如果迁移目标日期已经有草稿内容，必须合并内容，不能直接覆盖。

备份提醒规则：

- 设置项 `lastBackupAt` 记录最近一次导出时间。
- 超过 7 天未导出时，前端显示备份提醒。
- 设置项 `backupReminderSnoozedAt` 记录当天稍后提醒。

自动备份规则：

- 自动备份逻辑在 `src/api/autoBackupApi.js` 和 `src/hooks/useAutoBackup.js`。
- 默认开启 IndexedDB 内部自动快照，默认频率 1 小时；可选 30 分钟、1 小时、6 小时。
- 内部快照保存到 `backup_snapshots`，用于误删后从浏览器本地恢复，不替代手动 JSON 导出。
- 快照清理采用分层保留：最近 24 份、最近 7 天每天一份、最近 4 周每周一份，避免无限增长。
- Chrome / Edge 桌面端支持 File System Access API 时，可以让用户选择电脑备份文件夹，并在自动备份时额外写入 JSON 文件。
- Safari、Firefox 和多数移动端通常不支持网页写入用户选择的电脑文件夹；UI 必须明确说明限制。
- `autoBackupDirectoryHandle` 是浏览器授权句柄，只能存在本机 IndexedDB setting 中，不能导出到 JSON。
- `autoBackupDirectoryName` 是文件夹名称，同样不进入 JSON 导出，导入时从句柄重新读取。
- 电脑文件夹备份有独立的频率控制（`fileBackupIntervalMinutes`），不再依附于自动快照频率。
- 导入 JSON 或恢复快照时，应尽量保留当前浏览器已经授权的备份文件夹句柄。
- `backup_snapshots` 提供一键清空功能（`clearAllSnapshots`），用于快速清理所有内部快照。

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
