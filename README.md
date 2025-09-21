# PixelWorld — 2D Rules-First Sandbox (Java 17 + LibGDX 1.13, LWJGL3 + HTML)

一个像素风 2D 沙盒/生活模拟原型，设计理念是 **“世界规则优先”**：时间、季节、天气、植物、动物、怪物、BOSS、建造、掉落与 NPC（含性格/关系网）在没有玩家的情况下也能自洽运转。
项目由 **gdx-liftoff** 生成，多模块结构：**core**（跨端逻辑）、**lwjgl3**（桌面端）、**html**（网页端，GWT）。所有素材默认放在**仓库根目录的 `assets/`**。

---

## 目录结构

```
project-root/
├─ assets/                 # 统一资源目录（图片/音频/JSON 等）
│  ├─ data/                # 规则数据（weather/crops/loot/npcs/...）
│  ├─ ui/  sprites/  tilesets/  sfx/  music/  ...
│  └─ sources.txt          # （可选）素材直链 .zip 列表，供自动下载任务使用
├─ core/
│  └─ src/main/java/...    # 平台无关的游戏逻辑（系统/实体/数据）
├─ lwjgl3/
│  └─ src/main/java/...    # 桌面入口（Lwjgl3Launcher）
├─ html/
│  ├─ src/main/java/...    # HTML5 启动器（GWT）
│  └─ webapp/              # index.html 等网页壳
├─ build.gradle            # 根构建脚本（含素材下载任务）
├─ settings.gradle
├─ gradle.properties
├─ gradlew / gradlew.bat
└─ .github/workflows/pages.yml   # GitHub Pages 自动部署（可选）
```

> Liftoff 默认把资源挂在根 `assets/`；桌面与 HTML 构建都会捆绑该目录。

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
