// 定义在地形碰撞中需要阻挡的地形名称列表。
const BLOCKED_TILE_NAMES = [
  "WATER", // 水面不可通行
  "LAKE", // 湖泊不可通行
  "WALL", // 墙体不可通行
  "TREE", // 树木不可通行
  "HOUSE", // 房屋不可通行
  "ROCK", // 岩石不可通行
  "LAVA" // 岩浆不可通行
]; // 数组结束

// 定义资源加载优先级，用户构建目录优先，随后回退到既有生成或占位资源。
const ASSET_PRIORITIES = {
  tiles: [
    "assets/build/tiles/tilesheet.png", // 用户导入后的图集
    "assets/generated/tiles/tilesheet.png" // 旧版生成图集（若存在）
  ], // 瓦片资源优先级结束
  characters: {
    player: [
      "assets/build/characters/player.png", // 用户导入玩家雪碧图
      "assets/generated/characters/player.png" // 旧版生成雪碧图（若存在）
    ], // 玩家雪碧图优先级结束
    anim: [
      "assets/build/characters/player.anim.json", // 用户导入玩家动画配置
      "assets/generated/characters/player.anim.json" // 旧版生成动画配置（若存在）
    ] // 玩家动画配置优先级结束
  }, // 角色资源部分结束
  maps: [
    "maps/user_map.json", // 用户自定义地图
    "maps/demo_map.json" // 默认演示地图
  ], // 地图资源优先级结束
  mapping: [
    "assets/mapping/tileset_binding.json" // 瓦片绑定配置
  ] // 绑定配置列表结束
}; // 常量定义结束

// 将优先级常量暴露到全局，便于测试脚本读取验证。
if (typeof window !== "undefined") { // 检查处于浏览器环境
  window.MINIWORLD_ASSET_PRIORITIES = ASSET_PRIORITIES; // 挂载到全局变量
} // 条件结束

// 定义全局运行时配置对象的占位，稍后在引导阶段填充。
let runtimeConfig = null; // 初始化运行时配置

// 将错误提示写入页面，提醒用户缺失资源或环境。
function showAssetMissingMessage(message) { // 定义提示函数
  const root = document.getElementById("app-root"); // 获取根容器
  if (root) { // 确认容器存在
    root.innerHTML = `<p>${message}</p>`; // 写入提示文本
  } // 条件结束
} // 函数结束

// 检测指定资源路径是否存在，优先使用 HEAD 请求以减少流量。
async function checkAssetAvailability(path) { // 定义资源存在性检测函数
  try { // 捕获网络错误
    const response = await fetch(path, { method: "HEAD" }); // 使用HEAD请求探测
    if (response.ok) { // 如果响应成功
      return true; // 返回存在
    } // 条件结束
  } catch (error) { // 捕获异常
    console.warn("检查资源时出现异常", path, error); // 打印警告
  } // 捕获结束
  try { // 再次尝试使用GET以兼容不支持HEAD的环境
    const response = await fetch(path, { method: "GET" }); // 使用GET请求探测
    return response.ok; // 返回是否成功
  } catch (error) { // 捕获异常
    console.warn("使用GET检查资源失败", path, error); // 输出警告
    return false; // 返回不存在
  } // 捕获结束
} // 函数结束

// 在给定的路径优先级列表中寻找第一个存在的资源。
async function resolveAssetPath(paths) { // 定义路径解析函数
  for (const path of paths) { // 遍历候选路径
    // eslint-disable-next-line no-await-in-loop
    const available = await checkAssetAvailability(path); // 逐个检查资源
    if (available) { // 如果存在
      return path; // 返回该路径
    } // 条件结束
  } // 循环结束
  return null; // 若都不存在则返回空
} // 函数结束

// 依次尝试加载 JSON 文件，成功后返回解析结果与路径。
async function loadJsonFromPriority(paths) { // 定义JSON加载函数
  for (const path of paths) { // 遍历候选
    try { // 捕获请求异常
      // eslint-disable-next-line no-await-in-loop
      const response = await fetch(path); // 直接获取JSON
      if (response.ok) { // 检查状态
        // eslint-disable-next-line no-await-in-loop
        const data = await response.json(); // 解析JSON
        return { data, path }; // 返回数据与路径
      } // 条件结束
    } catch (error) { // 捕获异常
      console.warn("加载JSON失败", path, error); // 输出警告
    } // 捕获结束
  } // 循环结束
  return { data: null, path: null }; // 若都失败返回空结果
} // 函数结束

// 根据绑定数据计算不可通行的瓦片gid列表。
function computeBlockedGids(bindings) { // 定义碰撞gid计算函数
  const gids = []; // 初始化gid数组
  BLOCKED_TILE_NAMES.forEach((name) => { // 遍历不可通行名称
    if (Object.prototype.hasOwnProperty.call(bindings, name)) { // 若绑定存在
      const index = bindings[name]; // 读取索引
      gids.push(index + 1); // 转换为Tiled使用的gid
    } // 条件结束
  }); // 遍历结束
  if (gids.length === 0) { // 若未找到任何阻挡瓦片
    console.warn("未找到阻挡瓦片配置，默认保持空列表"); // 输出警告
  } // 条件结束
  return gids; // 返回gid列表
} // 函数结束

// 基于绑定数据查找指定名称对应的gid。
function gidForName(bindings, name) { // 定义gid查询函数
  if (!Object.prototype.hasOwnProperty.call(bindings, name)) { // 若名称不存在
    return null; // 返回空
  } // 条件结束
  return bindings[name] + 1; // 返回gid值
} // 函数结束

// 自定义场景类，使用运行时配置加载资源与创建地图。
class MiniWorldScene extends Phaser.Scene { // 定义MiniWorldScene类
  constructor() { // 构造函数
    super({ key: "MiniWorldScene" }); // 调用父类构造
    this.failedAssets = []; // 初始化加载失败列表
    this.player = null; // 初始化玩家引用
    this.cursors = null; // 初始化输入引用
    this.resetKey = null; // 初始化重置键引用
    this.spawnPoint = { x: 0, y: 0 }; // 初始化出生点
    this.tileLayer = null; // 初始化瓦片层
  } // 构造函数结束

  preload() { // Phaser预加载阶段
    if (!runtimeConfig) { // 如果运行时配置缺失
      showAssetMissingMessage("运行时配置缺失，请先执行素材导入脚本。"); // 提示用户
      return; // 中断
    } // 条件结束
    this.failedAssets = []; // 清空失败列表
    this.load.on("loaderror", (file) => { // 监听加载错误
      this.failedAssets.push(file.src || file.key); // 记录失败资源
    }); // 事件绑定结束
    this.load.tilemapTiledJSON("activeMap", runtimeConfig.assetPaths.map); // 加载地图JSON
    this.load.image("worldTiles", runtimeConfig.assetPaths.tiles); // 加载瓦片图集
    this.load.spritesheet(
      "playerSprite", // 资源键名
      runtimeConfig.assetPaths.player, // 雪碧图路径
      {
        frameWidth: runtimeConfig.playerAnim.frame_width, // 帧宽
        frameHeight: runtimeConfig.playerAnim.frame_height // 帧高
      }
    ); // 注册雪碧图
  } // preload结束

  create() { // Phaser创建阶段
    if (
      !runtimeConfig || // 缺少配置
      this.failedAssets.length > 0 || // 有加载失败
      !this.cache.tilemap.exists("activeMap") || // 地图未加载
      !this.textures.exists("worldTiles") || // 图集未加载
      !this.textures.exists("playerSprite") // 雪碧图未加载
    ) { // 条件组合
      showAssetMissingMessage("资源加载失败，请确认已执行 make user-import 或 make assets。"); // 提示用户
      return; // 中断
    } // 条件结束
    const map = this.make.tilemap({ key: "activeMap" }); // 创建地图对象
    const tileset = map.addTilesetImage(
      "world_tiles", // tileset名称
      "worldTiles", // 纹理键名
      runtimeConfig.tileSize, // 瓦片宽
      runtimeConfig.tileSize, // 瓦片高
      0, // 边距
      0, // 间距
      1 // firstgid
    ); // tileset绑定结束
    this.tileLayer = map.createLayer("Ground", tileset, 0, 0); // 创建地面层
    this.tileLayer.setOrigin(0, 0); // 设置原点
    this.tileLayer.setCollision(runtimeConfig.blockedGids); // 配置碰撞gid
    const roadGid = gidForName(runtimeConfig.bindings, "ROAD"); // 获取道路gid
    if (roadGid !== null) { // 如果存在道路
      const tile = this.tileLayer.findTile((t) => t.index === roadGid); // 查找道路瓦片
      if (tile) { // 若找到
        this.spawnPoint = { x: tile.getCenterX(), y: tile.getCenterY() }; // 设置出生点
      } // 条件结束
    } // 道路判断结束
    this.player = this.physics.add.sprite(
      this.spawnPoint.x, // X坐标
      this.spawnPoint.y, // Y坐标
      "playerSprite", // 纹理键
      0 // 初始帧
    ); // 创建玩家精灵
    this.player.setCollideWorldBounds(true); // 限制出界
    this.player.body.setSize(
      runtimeConfig.tileSize * 0.6, // 碰撞箱宽
      runtimeConfig.tileSize * 0.8 // 碰撞箱高
    ); // 设置碰撞箱尺寸
    this.player.body.setOffset(
      runtimeConfig.tileSize * 0.2, // 偏移X
      runtimeConfig.tileSize * 0.2 // 偏移Y
    ); // 设置碰撞箱偏移
    this.anims.create({ // 创建走路动画
      key: "walk", // 动画键
      frames: this.anims.generateFrameNumbers("playerSprite", { start: 0, end: runtimeConfig.playerAnim.frames - 1 }), // 生成帧
      frameRate: runtimeConfig.playerAnim.fps, // 帧率
      repeat: -1 // 循环播放
    }); // 动画定义结束
    this.physics.add.collider(this.player, this.tileLayer); // 玩家与地面碰撞
    this.cursors = this.input.keyboard.createCursorKeys(); // 创建方向键输入
    this.resetKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R); // 注册重置键
    this.cameras.main.startFollow(this.player); // 相机跟随
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels); // 设置相机边界
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels); // 设置物理边界
  } // create结束

  update() { // 游戏逐帧更新
    if (!this.player || !this.cursors) { // 若玩家或输入不存在
      return; // 直接返回
    } // 条件结束
    let velocityX = 0; // 初始化水平速度
    let velocityY = 0; // 初始化垂直速度
    if (this.cursors.left.isDown) { // 按下左键
      velocityX -= 1; // 向左移动
    } // 条件结束
    if (this.cursors.right.isDown) { // 按下右键
      velocityX += 1; // 向右移动
    } // 条件结束
    if (this.cursors.up.isDown) { // 按下上键
      velocityY -= 1; // 向上移动
    } // 条件结束
    if (this.cursors.down.isDown) { // 按下下键
      velocityY += 1; // 向下移动
    } // 条件结束
    if (velocityX !== 0 && velocityY !== 0) { // 对角移动情况
      const factor = Math.SQRT1_2; // 计算归一化因子
      velocityX *= factor; // 调整水平速度
      velocityY *= factor; // 调整垂直速度
    } // 条件结束
    const speed = runtimeConfig.playerSpeed; // 读取速度配置
    this.player.setVelocity(velocityX * speed, velocityY * speed); // 应用速度
    if (velocityX !== 0 || velocityY !== 0) { // 若正在移动
      this.player.anims.play("walk", true); // 播放动画
    } else { // 否则
      this.player.anims.stop(); // 停止动画
      this.player.setFrame(0); // 重置帧
    } // 条件结束
    if (Phaser.Input.Keyboard.JustDown(this.resetKey)) { // 检测重置键
      this.resetPlayerPosition(); // 调用重置
    } // 条件结束
  } // update结束

  resetPlayerPosition() { // 定义重置函数
    if (!this.player) { // 若玩家不存在
      return; // 直接返回
    } // 条件结束
    this.player.setVelocity(0, 0); // 停止移动
    this.player.setPosition(this.spawnPoint.x, this.spawnPoint.y); // 返回出生点
  } // 函数结束
} // 类定义结束

// 引导函数：加载配置并启动游戏。
async function bootstrapGame() { // 定义引导函数
  const mappingResult = await loadJsonFromPriority(ASSET_PRIORITIES.mapping); // 加载瓦片绑定
  if (!mappingResult.data) { // 若绑定加载失败
    showAssetMissingMessage("缺少瓦片绑定配置，请检查 assets/mapping/tileset_binding.json。"); // 提示用户
    return; // 中止
  } // 条件结束
  const bindings = mappingResult.data.bindings || {}; // 读取绑定字典
  const tileSize = mappingResult.data.tile_size || 32; // 读取瓦片尺寸
  const tilesPath = await resolveAssetPath(ASSET_PRIORITIES.tiles); // 解析图集路径
  const playerPath = await resolveAssetPath(ASSET_PRIORITIES.characters.player); // 解析玩家图路径
  const playerAnimResult = await loadJsonFromPriority(ASSET_PRIORITIES.characters.anim); // 加载动画配置
  const mapPath = await resolveAssetPath(ASSET_PRIORITIES.maps); // 解析地图路径
  if (!tilesPath || !playerPath || !playerAnimResult.data || !mapPath) { // 判断是否缺失关键资源
    showAssetMissingMessage("缺少用户或默认素材，请执行 make user-import 或 make assets 生成资源。"); // 提示用户
    return; // 中止
  } // 条件结束
  const blockedGids = computeBlockedGids(bindings); // 计算阻挡gid
  runtimeConfig = { // 构造运行时配置
    tileSize, // 瓦片尺寸
    bindings, // 绑定字典
    blockedGids, // 阻挡gid列表
    assetPaths: { // 资源路径集合
      tiles: tilesPath, // 图集路径
      player: playerPath, // 玩家雪碧图路径
      map: mapPath // 地图路径
    }, // 资源路径结束
    playerAnim: playerAnimResult.data, // 玩家动画配置
    playerSpeed: 140 // 玩家移动速度
  }; // 配置构建结束
  if (!window.Phaser) { // 若未加载Phaser
    showAssetMissingMessage("未加载 Phaser 库，请检查网络或CDN。"); // 提示用户
    return; // 中止
  } // 条件结束
  const root = document.getElementById("app-root"); // 获取根节点
  if (root) { // 若存在
    root.innerHTML = ""; // 清空占位内容
  } // 条件结束
  const config = { // 构造Phaser配置
    type: Phaser.AUTO, // 自动选择渲染
    parent: "app-root", // 指定父节点
    width: tileSize * 20, // 默认宽度20格
    height: tileSize * 15, // 默认高度15格
    backgroundColor: "#101020", // 背景色
    pixelArt: true, // 开启像素渲染
    physics: { // 物理配置
      default: "arcade", // 使用Arcade引擎
      arcade: { debug: false } // 关闭调试
    }, // 物理配置结束
    scene: MiniWorldScene // 指定场景类
  }; // 配置结束
  // eslint-disable-next-line no-new
  new Phaser.Game(config); // 启动游戏
} // 函数结束

// 监听DOMContentLoaded事件，确保DOM准备就绪后再启动引导。
document.addEventListener("DOMContentLoaded", () => { // 注册DOMContentLoaded
  bootstrapGame().catch((error) => { // 调用引导函数并捕获异常
    console.error("引导游戏失败", error); // 输出错误
    showAssetMissingMessage("引导失败，请查看控制台日志获取详情。"); // 提示用户
  }); // 捕获结束
}); // 事件绑定结束
