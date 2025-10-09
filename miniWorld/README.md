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

### 后续预告
第6轮将加入自动对话/跳过、隐藏 UI、术语图鉴、成就等系统。
