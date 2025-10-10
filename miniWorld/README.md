# MiniWorld

## 第5轮：像素世界探索 v1

### 如何运行
1. 安装依赖：`pnpm install`
2. 启动开发服务器：`pnpm dev`
3. 构建发布版本：`pnpm build`
4. 预览构建结果：`pnpm preview`

### 外部素材优先级
- 在 `assets_external/tiles/tilesheet.png` 放置瓦片图集，可自动覆盖占位瓦片。
- 在 `assets_external/characters/player.png` 放置角色贴图，可自动覆盖占位角色。
- 如果上述文件缺失，系统会读取 `assets/placeholders/` 元数据，运行时生成占位纹理。

### 按键说明
- 方向键：移动玩家。
- `Z`：采集资源。
- `S`：保存存档。
- `L`：读取存档。

### 数据结构
- `TileType`：地形类型枚举，用于地图生成与通行判断。
- `resourceNodes`：资源点数组，包含坐标、类型与掉落物。
- `Inventory`：背包条目 `Item`（`id`、`name`、`count`）。

## 第6轮：对话与信息系统 v1

### 对话与 UI 行为
- `src/ui/TextTexture.ts` 提供将任意文本渲染为纹理的方法，可用于在世界中展示对话或信息贴图。
- `src/ui/AutoTextController.ts` 管理自动播放与跳过模式：
  - 自动播放（按 `A`）会依据字数估算等待时间，逐段播放文本。
  - 跳过模式（对话时按 `S`）会立即推进到下一段，并在完成后自动关闭跳过模式。
- `src/ui/UIVisibilityManager.ts` 统一控制 HUD 的显示与隐藏，可通过鼠标右键切换，键盘备选为 `Shift+H`。
- 对话演示：靠近树木会触发一段提示文本，系统会根据 Auto/Skip 状态自动推进或立即跳过。

### 图鉴（Glossary）
- `G` 键打开术语图鉴，显示分类与词条列表，按 `Esc` 返回世界。
- 图鉴数据默认读取 `src/ui/glossary/glossary.sample.json`，可在 `assets_external/glossary/glossary.sample.json` 放置同名文件覆盖。
- `GlossaryStore` 会优先读取外部文件，缺失时回落到内置示例。

### 成就系统（Achievements）
- `H` 键打开成就界面（按 `Shift+H` 仍用于隐藏 UI）。
- `src/ui/achievements/achievements.sample.json` 定义成就内容，支持类型：
  - `collect`：统计物品收集数量，例如累计获得木头。
  - `event`：响应事件，例如首次存档。
- 将同名文件放到 `assets_external/achievements/achievements.sample.json` 可覆盖默认表。
- `AchievementManager` 会在解锁时复用飘字提示（显示“达成：xxx”），并自动持久化到本地存储。

### 保存的额外数据
- 存档结构新增 `achievements` 与 `uiSettings` 字段，分别记录成就解锁状态与 UI 设置（自动、跳过、隐藏）。
- 兼容旧存档：缺失字段会使用默认值（全部关闭）。

### 快捷键更新
- 方向键：移动玩家。
- `Z`：采集资源。
- `A`：切换自动播放模式。
- `S`：在世界中保存存档；若当前正在对话，则改为切换跳过模式。
- `L`：读取存档。
- 鼠标右键或 `Shift+H`：隐藏/显示 UI。
- `G`：打开术语图鉴。
- `H`：打开成就界面（不按 `Shift` 时生效）。

## 第7轮：经济与时间系统 v1

### 经济与商店
- `src/economy/ShopTypes.ts` 定义 `Shop`、`Goods`、`Currency` 等结构，默认商店 `general_store` 销售木头、石头与种子。
- `ShopStore` 负责初始化、列出、补货与序列化商店数据，每天根据 `restockRule.daily` 补货并遵守 `maxStock` 上限。
- `ShopService` 与 `Inventory` 协作，金币以 `gold` 物品形式存放，购买会扣除金币并减少库存，出售按五折回收并增加库存。
- `ShopUI` 使用 Phaser 容器绘制列表、详情与数量调整，`Tab` 在买入/卖出之间切换，`Enter` 确认交易，`Esc` 关闭界面。
- `assets_external/` 下放置与商店背景或图标同名素材可覆盖 `assets/placeholders/` 中的占位配置。

### 时间与昼夜
- `TimeSystem` 以 1 秒 = 10 游戏分钟推进时间，包含分钟/小时/日/周/季节/年份，并提供新日、新周、新季节回调。
- 昼夜滤镜会根据当前小时切换亮度：白天透明、傍晚橙色、夜晚深蓝；回调默认每天补货并弹出提示。
- `UIScene` 右上角显示当前时刻，左上角显示年份、季节与日期；信息会在读取存档或倍率切换后实时更新。

### 快进倍率
- `TimeScaleBoost` 支持 1×→2×→4×→1× 循环切换，并在 HUD 显示 `x1/x2/x4` 标签。
- 按 `Shift` 键快速切换倍率（按住 Shift 再按其他键不会触发切换，兼容 `Shift+H` 隐藏 UI）。

### 存档扩展
- 存档结构新增 `time` 与 `shops` 字段，分别序列化 `TimeSystem` 与 `ShopStore` 状态，缺失字段时自动回落到默认。
- 读取旧存档仍会初始化默认商店与时间，不会破坏既有数据；金币仍通过背包物品保存，无需额外字段。

### 新增按键
- `E`：靠近商店 NPC 时打开/关闭商店界面。
- `Shift`：循环切换时间倍率。

### 测试套件
- 使用 `pnpm test` 可运行包含经济、时间与快进等模块在内的单元测试，确保交易、补货、时间推进与倍率切换行为符合预期。

## 第8轮：任务/目标系统 v1

### 任务结构
- `QuestDef`：包含 `id`、`kind`（主/支线）、`title`、`desc`、`steps`、`rewards`、`autoStart`、`unlockBy` 等字段，用于定义完整任务流程。
- `Step`：支持 `collect`、`talk`、`reach`、`equip`、`state` 五种类型，附带物品数量、NPC 标识、目标坐标等参数。
- `Reward`：可以配置金币、物品与成就 ID，完成任务后自动发放，并通过飘字提示展示。
- `QuestProgress`：记录 `status`（locked/active/completed）、当前步骤索引、计数器与追踪标记，随存档持久化。

### 触发器对接
- `QuestTriggers` 提供 `onCollect`、`onTalk`、`onReach`、`onEquip`、`onState` 接口，方便与采集、NPC 交互、移动等系统联动。
- WorldScene 在采集木头时调用 `onCollect`，打开商店时调用 `onTalk('shopkeeper')`，每次移动后向 `onReach` 通报当前网格坐标。
- 未来新增的装备或状态变化，只需在对应系统内调用预留的 `onEquip`/`onState` 方法即可完成接入。

### 任务日志与追踪
- `J` 键打开任务日志，日志界面提供进行中与已完成两个标签，可使用 `↑/↓` 切换任务、`Tab` 切换标签。
- 在任务详情中按 `T` 或 `Enter` 可追踪/取消追踪任务，追踪状态会在 HUD 和世界内显示方向提示。
- `QuestTracker` 根据玩家坐标与目标位置计算方向/距离，以文本标签形式引导玩家前往目标或提示收集进度。

### 奖励与成就联动
- 当 `QuestStore.advanceIfComplete` 推动任务完成时，WorldScene 会自动发放金币与物品奖励，必要时解锁成就。
- 奖励采用 `Inventory.add` 与 `AchievementManager.unlock` 执行，完成时会弹出“任务完成：xxx”的飘字提示。

### 存档兼容
- 存档结构新增 `quests` 字段，保存 `QuestStore.toJSON()` 的序列化结果，包括进度、追踪状态与完成列表。
- 读取旧存档时缺失 `quests` 字段会自动回落到默认状态，仅保留 `autoStart` 任务；任务系统初始化后会重新接管。

### 扩展点
- `QuestStore` 预留 `equip/state` 字段，可在后续版本接入装备需求或世界状态条件。
- `QuestTriggers` 的接口设计便于未来由 NPC 或 AI 派发任务，只需在相关事件中调用触发器即可。
- `QuestJournal` 采用独立容器实现，可扩展排序、筛选或多任务追踪等高级功能。

## 第9轮：建造与世界编辑 v1

### 建造模式
- 按 `U` 进入或退出建造模式，屏幕显示建造菜单与鼠标高亮格。
- 使用 `Z` 或鼠标左键放置当前蓝图，右键拆除可拆除方块；数字键 `1..9` 或鼠标滚轮切换蓝图。
- 资源不足时建造按钮会以红色标记，提示缺少的材料；材料足够将以绿色显示并允许放置。
- 蓝图数据默认读取 `src/build/blueprints.sample.json`，可在 `assets_external/build/blueprints.json` 放置同名文件覆盖。

### 撤销与重做
- `Ctrl+Z` 撤销最近的放置或拆除，`Ctrl+Y` 重做最近一次撤销。
- 撤销栈默认记录 20 步，可在存档中保存最近操作以便跨会话继续。
- 每次放置或拆除都会写入 `UndoStack`，撤销会自动返还或扣除对应材料，确保库存与地形一致。

### 权限系统
- 角色共有 `Admin`、`Manager`、`Worker`、`Visitor` 四种：前三者可以建造，前两者还可审批 AI 申请。
- `Permissions` 会随存档保存当前角色，可在调试菜单或存档 JSON 中修改，默认新开档为 `Visitor`。
- 没有建造权限时尝试进入建造模式会弹出“无权建造”提示。

### AI 代理申请
- `AgentAPI` 提供 `submit` 接口供 NPC 或外部系统请求建造，所有申请进入审批队列。
- 在 HUD 中会看到待审批数量，`Y`/`N` 键由有权限的角色审批通过或拒绝，审批通过后自动尝试建造。
- 未来可在接入 LLM 后由外部智能体调用 `AgentAPI.submit` 生成结构化建造请求。

### 存档扩展
- 新增字段 `permissions`、`mapDiff`、`undo`、`agent` 保存角色、地图改动、撤销栈与审批队列。
- 读取旧存档时这些字段缺失将采用默认值（访客角色、无改动、空栈、空队列），保持向后兼容。
- `mapDiff` 仅记录相对初始地图的变化，确保存档大小可控。
