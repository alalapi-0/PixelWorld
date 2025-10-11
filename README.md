# PixelWorld — 2D Rules-First Sandbox (Java 17 + LibGDX 1.13, LWJGL3 + HTML)

> ⚙️ **PixelWorld 统一说明**：
> 本仓库整合原 MiniWorld 与 PixelWorld 工程。
>
> * 后端（Java / LibGDX）位于 `core/`
> * 前端（Phaser / TypeScript）位于 `frontend/miniworld/`
> * 全局素材路径为 `assets/user_imports/`
>
> 执行 `make build-all` 以构建所有模块。

一个像素风 2D 沙盒/生活模拟原型，设计理念是 **“世界规则优先”**：时间、季节、天气、植物、动物、怪物、BOSS、建造、掉落与 NPC（含性格/关系网）在没有玩家的情况下也能自洽运转。
项目由 **gdx-liftoff** 生成，多模块结构：**core**（跨端逻辑）、**lwjgl3**（桌面端）、**html**（网页端，GWT）。所有素材默认放在**仓库根目录的 `assets/`**。

---

## 目录结构

```
project-root/
├─ assets/
│  ├─ data/
│  ├─ mapping/
│  ├─ user_imports/
│  │  ├─ Audio/
│  │  │  ├─ BGM/
│  │  │  ├─ BGS/
│  │  │  ├─ ME/
│  │  │  └─ SE/
│  │  └─ Graphics/
│  │     ├─ Characters/
│  │     ├─ Animations/
│  │     ├─ Battlebacks1/
│  │     ├─ Battlebacks2/
│  │     ├─ Tilesets/
│  │     └─ ...
│  ├─ build/
│  └─ licenses/
├─ frontend/
│  ├─ miniworld/
│  └─ legacy/
├─ core/
├─ html/
├─ lwjgl3/
├─ scripts/
├─ tests/
├─ package.json
├─ pnpm-workspace.yaml
├─ Makefile
├─ build.gradle
└─ settings.gradle
```

> Liftoff 默认把资源挂在根 `assets/`；桌面与 HTML 构建都会捆绑该目录。

---

## 整合说明

| 文件 / 目录 | 说明 |
| ----------- | ---- |
| `frontend/miniworld/` | Phaser + TypeScript 沙盒子模块，已配置 `@sharedAssets` 别名，共享根目录素材。 |
| `frontend/legacy/` | 保存历史 Phaser/Pixi 原型，避免影响现行模块。 |
| `pnpm-workspace.yaml` | pnpm 工作区定义，收敛前端子项目管理。 |
| `package.json` | 工作区根 package，集中记录开发依赖。 |
| `scripts/import_user_assets.py` | 同步 `assets/user_imports/` → `assets/build/` 并写出 `index.json`，仅执行文本级操作。 |
| `scripts/preview_user_assets.py` | 汇总 `assets/build/index.json` 并生成 `assets/preview_index.json`，供前端快速索引。 |
| `tests/test_minibuild.py` | 集成测试：校验前端 dist、素材同步与索引可解析性。 |

---

## 开发与运行

- **JDK**：17（推荐 Temurin 或 Microsoft OpenJDK）
- **构建**：Gradle（使用仓库自带的 wrapper）

本地运行：

```bash
./gradlew lwjgl3:run
```

网页构建（静态产物在 html/build/dist/）：

```bash
./gradlew html:dist
```

本地预览网页版：

```bash
cd html/build/dist
python -m http.server 8000
# 打开 http://localhost:8000
```

---

## MiniWorld 前端沙盒（Phaser + Vite）

- `make miniworld-dev`：基于 pnpm 工作区启动 Vite 开发服务器（默认 `http://localhost:5173/`），实时读取共享素材。
- `make miniworld-build`：执行 `pnpm --filter miniworld build`，产物输出至 `frontend/miniworld/dist/`。
- `make miniworld-test`：运行 Vitest 用例，保证核心加载逻辑可用。
- `make user-import`：调用 Python 脚本将 `assets/user_imports/` 复制到 `assets/build/`，生成 `index.json`，并保持所有操作为纯文本。
- `make user-preview`：快速重建 `assets/preview_index.json`，并在 `logs/user_imports.log` 中写入明细，便于 Phaser 端调试。

### 素材管理器（只读二进制）

- 入口：在游戏内按下 `M`，或执行 `make miniworld-manager` 直接打开 `ResourceManagerScene`。
- 功能：基于 `assets/preview_index.json` 构建资源列表，支持搜索、类型与标签筛选、批量添加标签/集合，并可编辑描述。
- 数据存储：所有修改写入 `assets/metadata/tags.json`、`assets/metadata/descriptions.json`、`assets/metadata/collections.json`，均为纯文本 JSON，不生成任何二进制文件。
- AI 建议：调用前端 `AiDescribeStub` 依据文件名与类别生成“离线规则”描述，需手动点击保存后才会写入 JSON。
- 安全性：只读取 `assets/build/**` 现有文件，不生成缩略图、不对音频执行转码，控制台会输出 `✅ ResourceManager initialized (text-only)`、`✅ Metadata loaded/saved via JSON`、`✅ No binary generated` 以便审计。

### 运行时热重载与回滚（文本）

- `make hot-run`：启动 MiniWorld Vite 开发服务器，并默认启用自动数据轮询器，前端会在右上角渲染开发者热栏。
- `assets/auto/*.json` 或 `scripts/rules_mapping.json` 变更后，`AutoDataWatcher` 会通过 `/__fileHash` 端点检测 SHA1 摘要差异，然后调用 `HotReloadBus` 广播无刷新热重载事件。
- 三大运行时仓库 `BlueprintStoreRuntime`、`ShopStoreRuntime` 与 `QuestStoreRuntime` 会在事件驱动下替换定义表，同时保留玩家核心状态（建造进度、库存与任务完成度）。
- `make auto-snapshot`：调用 `scripts/snapshot_auto.py`，将当前自动 JSON 文本复制到 `assets/auto/.snapshots/`，文件名携带 UTC 时间戳，方便审计与回滚。
- `make auto-rollback`：调用 `scripts/rollback_auto.py --latest`，从最近快照恢复 `assets/auto/*.json`，仅进行文本复制，不触碰任何二进制。
- `make auto-snapshots`：调用 `scripts/list_auto_snapshots.py`，按时间倒序列出可用快照，便于挑选特定时间戳执行回滚。
- 开发者热栏提供“⟳ 热重载”“⏪ 回滚”按钮，内部同样通过文本端点触发加载或提醒，始终遵守纯文本写入的安全准则。

加载顺序：

1. `@sharedAssets` → 指向仓库根的 `assets/user_imports/`
2. `frontend/miniworld/assets_external/` → 适合临时放置构建产物或下载素材
3. `frontend/miniworld/assets/` → MiniWorld 自带的像素占位纹理与 HUD 元数据

若前两级素材缺失，MiniWorld 会自动生成程序化占位纹理并在 HUD 中显示“占位纹理”提示。

### 智能默认映射（只读二进制）

- **数据来源**：综合 `assets/preview_index.json`、`assets/metadata/tags.json`、`assets/metadata/descriptions.json` 与可选的 `assets/metadata/collections.json`，只读取文本元信息。
- **规则表**：`scripts/rules_mapping.json` 控制标签到蓝图/商店/任务的映射，可按需编辑扩充；缺省时脚本会加载内置默认表。
- **产物位置**：`python3 scripts/synth_defaults.py` 会生成 `assets/auto/blueprints_auto.json`、`assets/auto/shops_auto.json`、`assets/auto/quests_auto.json` 与 `assets/auto/report.txt`，全部为文本文件，明确声明“no binary generated”。
- **合并原则**：运行时通过 `frontend/miniworld/src/config/AutoDataLoader.ts` 加载自动草案，并与人工文件（如 `assets/build/blueprints.json`、`assets/shops/shops.json`、`assets/quests/quests.json`）合并；同 ID 优先保留人工定义，仅对缺口兜底补全，并在控制台输出冲突警告。
- **使用命令**：
  - `make synth-defaults` —— 单独生成最新的自动草案，便于审阅文本结果。
  - `make miniworld-auto` —— 先执行 `synth-defaults`，再启动 Phaser 开发服务器，可在建造/商店/任务界面直接查看草案效果。

### 资产流水线（纯文本操作）

> 核心原则：**整个流程只读写文本文件、复制或移动已有素材，绝不重新编码任何二进制内容。**

1. **目录规范**：
   - 原始素材放置在 `assets/user_imports/`，保留 RPG Maker 风格的 `Audio/*` 与 `Graphics/*` 层级。
   - 导入脚本会根据目录名与可选的 `assets/mapping/import_rules.json` 规则，把文件归类到 `assets/build/` 下的统一结构：
     - `audio/{bgm,bgs,me,se}/`
     - `characters/`
     - `tiles/`
     - `effects/`
     - `ui/`
2. **索引文件**：
   - `assets/build/index.json`：`scripts/import_user_assets.py` 自动生成，字段包含：
     - `generated_at`（UTC 时间戳）、`sources`（固定为 `assets/user_imports/`）。
     - `audio` 与 `images`：以分类键（如 `bgm`、`characters`）列出相对于 `assets/build/` 的路径。
     - `notes`：强调仅记录文本路径。
   - `assets/preview_index.json`：由 `scripts/preview_user_assets.py` 构建的扁平数组，便于前端一次性列出所有音频/图像资源。
3. **命令与日志**：
   - `make user-import`：执行复制模式导入，并把详细日志写入 `logs/user_imports.log`。
   - `make user-import-move`：以移动模式整理素材，适合迁移后清理源目录。
   - `make user-import-rules`：强制使用 `assets/mapping/import_rules.json` 覆盖默认映射。
   - `make user-preview`：基于最新的 `index.json` 重建 `preview_index.json`，同时在终端输出统计。

## 素材自动识别与安全改名

- **原则**：严格遵守“只读头部、仅移动文件”的策略，任何脚本都不会重新编码 PNG/OGG 等二进制内容。
- **命名规范**：统一采用 `kebab-case` 并附加分类前缀，例如：
  - `images/characters/char-actor-set-1.png`
  - `images/tiles/tile-gate-2--large--single.png`（`!` → `--large`，`$` → `--single`）
  - `images/effects/fx-fire-3.png`
  - `images/ui/ui-iconset.png`
  - `audio/bgm/bgm-battle-3.ogg`
  - `audio/se/se-attack-2.ogg`
  - `audio/voice/voice-female-1.ogg`
- **脚本说明**：
  - `scripts/analyze_assets.py`：只读扫描 `assets/user_imports/` 与 `assets/build/`，解析 PNG 宽高、音频容器后生成改名方案（`assets/rename/rename_plan.json`）与冲突列表（`assets/rename/conflicts.json`）。
  - `scripts/apply_renames.py`：根据改名方案执行干跑或真实改名，自动更新 `assets/build/index.json`、`assets/preview_index.json` 及 `assets/metadata/*.json` 的路径引用，并输出回滚日志 `assets/rename/revert_log.json`。
  - `scripts/utils_png_probe.py` / `scripts/utils_audio_probe.py`：只读解析 PNG 与 OGG/MP3/WAV 头部信息，帮助判断分类与尺寸。
- **前端兼容**：`frontend/miniworld/src/core/AssetPathResolver.ts` 读取最新的 `index.json` 与构建映射，为 Phaser Loader 提供统一 URL，旧引用也能通过索引匹配到新路径。
- **执行流程**：
  1. `make assets-analyze` —— 生成改名计划与冲突提示。
  2. `make assets-rename-dry` —— 干跑模式确认将要移动的文件。
  3. `make assets-rename-apply` —— 实际改名并同步索引/元数据。
  4. `make assets-rename-revert` —— 若需回滚，按日志恢复原始路径。
- **常见问题**：
  - *命名冲突*：`assets/rename/conflicts.json` 会记录目标已存在或计划重复，可手工调整计划后再执行。
  - *权限不足*：确保仓库目录可写，或使用管理员权限运行命令。
  - *路径过长*：可在改名前修改命名模板，避免超过系统限制。

4. **MiniWorld 前端读取方式**：
   - `frontend/miniworld/src/core/Loader.ts` 会尝试获取 `assets/preview_index.json`，逐条向 Phaser Loader 注册音频与图像资源。
   - 如果索引中的路径在构建资源映射中缺失，Loader 会自动回退到项目内置的占位纹理或音频标识，避免引发加载崩溃。
5. **维护建议**：
   - 若新增分类，可通过自定义规则映射至新的 build 子目录；脚本会在索引中自动创建对应的键。
   - 在提交前运行 `make user-import && make user-preview`，再执行 `pytest tests/test_import_and_preview.py -q` 确认文本管线稳定。
   - 所有素材的版权与来源需记录在 `assets/licenses/ASSETS_LICENSES.md`，确保团队与外部发行的合规性。

---

## 调试热键（建议实现）
- F1：调试叠加层（FPS、内存、世界状态）
- F2：碰撞体/路径可视化
- F5：加速时间（WorldClock ×10，再按恢复）
- F6：切换天气（晴→雨→暴雨→雪→晴）
- F7/F8：生成 NPC/怪物（附近）
- F9：无敌模式
- `（反引号）：调试控制台（如：time set 7:00, weather set rain）

---

## 系统模块（职责与依赖）
- **WorldClock**：统一管理小时/天/季节；事件 `OnNewDay`、`OnSeasonChange`；驱动昼夜光照。
- **WeatherSystem**：按季节概率生成天气；通知作物/NPC/刷新系统。
- **TileMapSystem**：加载/渲染 TileMap；寻路网格；建造落位。
- **CropSystem**：播种→生长分期→成熟/枯萎；与天气/季节/掉落交互。
- **SpawnSystem**：动物/怪物刷新；按区域/时段/天气；上限和冷却。
- **CombatSystem**：近战/受击/生命/死亡；联动 LootSystem。
- **LootSystem**：掉落表（权重/概率/数量区间）。
- **BuildSystem**：建造与升级（校验→占位→耗时→完工）；灾害损伤/维修。
- **NpcSystem**：NPC 日程与性格（外向/勤奋/谨慎）；行为树/GOAP。
- **Dialogue/Relationship**：对话模板（含天气/性格/好感）；关系事件。
- **SaveSystem**：JSON 存档（日期/季节/天气/地图/作物/背包/建筑/NPC）。
- **DebugPanel/Console**：状态面板与命令（改天气、跳天、刷怪）。

---

## 数据驱动（JSON）
放在 `assets/data/`：
- `weather.json`：季节与天气概率、昼夜光照参数。
- `crops.json`：作物阶段、季节、浇水、产出、价格。
- `spawn_and_drops.json`：刷怪配置与掉落表。
- `blueprints.json`：建造蓝图（材料/耗时/完工物/损伤概率）。
- `npcs.json`：NPC 信息、性格、日程、对话模板。
- `items.json`：道具/材料/工具/种子。

---

## 最小可玩目标（MVP）
- [ ] HUD 显示日期/季节/天气/时间；昼夜变化
- [ ] 播种→生长→成熟（雨天自动浇水）
- [ ] 白天动物、夜间怪物的刷新与上限/冷却
- [ ] 近战击杀→按掉落表产物→背包拾取/堆叠
- [ ] 木材→木板→小屋基座→隔天完工；暴风损伤与维修
- [ ] 2 名性格差异 NPC 在相同条件下表现不同
- [ ] JSON 存档/读档一致
- [ ] `./gradlew html:dist` 可运行

---

## 给 Codex 的实现提示
- 按模块推进：`WorldClock` → `WeatherSystem` → `TileMapSystem` → `Player/NPC` → `CropSystem` → `Spawn/Combat/Loot` → `BuildSystem` → `Npc/Dialogue`。
- 固定值全部外置到 `assets/data/*.json`；无素材时用纯色方块+文字占位。
- 模块间用事件或查询接口通信。

---

## 自动下载素材（可选）
提供一个 Gradle 下载脚本：读取 `assets/sources.txt` 中的 **直链 `.zip`**，下载并解压到 `assets/`。

在 **根 `build.gradle`** 里添加：

```gradle
plugins {
    id "de.undercouch.download" version "5.6.0"
}

def assetsRoot = "${project.rootDir}/assets"
def downloadsDir = layout.buildDirectory.dir("asset-downloads")

tasks.register("assetsDownload", de.undercouch.gradle.tasks.download.Download) {
    onlyIf { file("${assetsRoot}/sources.txt").exists() }
    src {
        def lines = file("${assetsRoot}/sources.txt").readLines("UTF-8")
        def urls = lines.collect { it.trim() }
                        .findAll { it && !it.startsWith("#") && it.toLowerCase().endsWith(".zip") }
        if (urls.empty) logger.lifecycle("[assetsDownload] no .zip links found in assets/sources.txt")
        return urls
    }
    dest downloadsDir.get().asFile
    overwrite true
}

tasks.register("assetsUnpack", Copy) {
    dependsOn "assetsDownload"
    from({ fileTree(downloadsDir).matching { include "**/*.zip" }.files.collect { zipTree(it) } })
    into assetsRoot
    doLast { println "[assetsUnpack] unpacked into ${assetsRoot}" }
}

tasks.register("assetsClean") {
    doLast { delete downloadsDir.get().asFile }
}
```

使用：
```bash
./gradlew assetsUnpack
```

**参考资源（落地页，挑选后把直链放入 sources.txt）：**
- Kenney – Pixel UI Pack: https://kenney.nl/assets/pixel-ui-pack
- Kenney – RPG Audio / UI SFX: https://kenney.nl/assets?filter=audio
- OpenGameArt – CC0 Retro / 8-bit Music: https://opengameart.org/
- OpenGameArt – 8-bit SFX Packs: https://opengameart.org/art-search?keys=8-bit+sound+effects
- OpenPixelProject（CC0 Tilesets）: https://openpixelproject.com/
- 0x72 Dungeon/Platformer Tilesets: https://0x72.itch.io/
- DawnLike: https://github.com/DragonDePlatino/DawnLike
- Universal LPC Sprites: https://github.com/jrconway3/Universal-LPC-Spritesheet-Character-Generator
- Tuxemon Monsters: https://github.com/Tuxemon/Tuxemon
- Kenney – Pixel Food/Farming: https://kenney.nl/assets?filter=pixel

---

## GitHub Pages（网页发布）
在 `.github/workflows/pages.yml` 中加入：

```yaml
name: Deploy Web Demo
on:
  push:
    branches: [ "main" ]
  workflow_dispatch: {}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { submodules: true }
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: "17"
      - name: Build HTML
        run: ./gradlew html:dist
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: html/build/dist
  deploy:
    needs: build
    permissions:
      pages: write
      id-token: write
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

在仓库 Settings → Pages 中启用 GitHub Pages 的“GitHub Actions”部署方式。

---

## 许可证与致谢
- 代码：MIT
- 素材：默认占位；当你引入第三方包，请在此列出 **名称/作者/链接/许可**（如 CC0/CC-BY）。

---

## 像素地图与普通角色（开源库接入）
基于 Phaser 3 与 Tiled 的轻量原型，帮助验证像素瓦片地图与“普通角色”控制流程：
- **引擎/渲染**：Phaser 3（浏览器端 2D 游戏框架，支持瓦片地图与 Arcade 物理）。
- **地图编辑**：Tiled（开源瓦片编辑器，导出 JSON/CSV）。
- **素材来源**：优先使用 Kenney 与 itch.io 的 CC0 资源；如暂未下载，则自动使用程序化占位瓦片与圆头角色。

### 快速体验
1. `make assets` —— 初始化 CC0 素材目录（默认仅生成占位提示，可通过 `--dest` 指定实际下载位置）。
2. `make assets-verify` —— 校验 `assets/mapping/*.json` 与本地素材的对应关系。
3. `make web-run` —— 启动静态服务器，浏览器打开 [http://localhost:8080/](http://localhost:8080/) 体验 Phaser 原型。

### 素材获取与许可说明
- `assets/external_catalog.json` 列出推荐的 CC0 源（Kenney、itch.io）。
- `scripts/fetch_assets.py` 会在本地生成占位目录与 `.placeholder` 提示，真实素材需开发者自行下载放入 `assets/build/`。
- `assets/licenses/ASSETS_LICENSES.md` 会由脚本更新当前素材许可，初始为“未下载素材”。
- 若后续选择 CC-BY 或 CC-BY-SA 素材，请在 `ASSETS_LICENSES.md` 中补充署名、链接与共享条款。

### 占位回退机制
- 前端加载不到 `assets/build/**` 的 PNG 时，会自动绘制纯色瓦片，并创建“圆头+身体”的普通角色占位纹理。
- 地图数据来自 `frontend/phaser/maps/demo_map.json`，含草地/道路/水面与水域碰撞层。
- 方向键控制角色移动，Arcade 物理保证水面不可穿越。

### 与 miniWorld 后端的对接计划
- 当前地图基于本地 `demo_map`，后续可改为从 `/world/chunk` 接口拼装瓦片数据。
- 瓦片/角色绑定计划通过 `/assets/tilesets` 与 `/assets/personas` 接口动态下发。
- 角色未来可替换为 AI 生成的多视角像素人或 3D 模型渲染帧，需扩展绑定 JSON 结构与加载逻辑。

## 前端 PIXI 骨架

- 该骨架完全独立于 RPG Maker/Phaser，实现了使用 PIXI v7 的轻量级三场景流程（Boot → Title → Map）。
- 地图/角色/图块加载优先级：
  1. `assets/build/tiles/tilesheet.png`、`assets/build/characters/player.png`、`assets/build/characters/player.anim.json` 与 `frontend/pixi/maps/user_map.json`。
  2. 若缺失则退回到程序化占位素材与 `frontend/pixi/maps/demo_map.json`。
- 快速体验步骤：
  1. `make map-demo`（或运行 `make user-import && make user-verify` 将用户素材导入到 `assets/build/**`）。
  2. `make web-pixi`，浏览器打开 <http://localhost:8081/>。
  3. 标题页按 Enter 进入地图，方向键移动角色，`R` 键重置出生点。
- 自定义素材放入 `assets/user_imports/**` 后，运行导入与校验脚本即可自动覆盖前端使用的 `assets/build/**`，前端会优先读取新素材。
- 后续规划：将地图数据切换为后端 `/world/chunk` 实时加载、扩展 UI（任务/对话/背包）并接入 WebSocket 同步。
