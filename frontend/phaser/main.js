// 默认配置，提供瓦片尺寸和玩家速度等基础参数。
const DEFAULT_CONFIG = { tileSize: 32, usePlaceholdersWhenMissing: true, playerSpeed: 160 }; // 设置默认配置值
// 默认瓦片绑定，确保在缺少外部JSON时仍可渲染。
const DEFAULT_TILE_BINDINGS = { tile_size: 32, bindings: { GRASS: { atlas: "assets/build/placeholder.png", id: 0 }, ROAD: { atlas: "assets/build/placeholder.png", id: 1 }, WATER: { atlas: "assets/build/placeholder.png", id: 2 } } }; // 定义占位瓦片绑定
// 默认角色绑定，缺少外部文件时使用占位精灵。
const DEFAULT_PERSONA_BINDINGS = { default_player: { sprite: "assets/build/placeholder_player.png" } }; // 定义占位角色绑定
// 占位颜色映射，用于程序化着色瓦片。
const PLACEHOLDER_TILE_COLORS = { 1: 0x4caf50, 2: 0x9e9e9e, 3: 0x1e88e5 }; // 定义草地、道路、水面的颜色

// 异步加载JSON工具函数，失败时返回null。
async function loadJSON(path) { // 定义通用JSON加载函数
  try { // 尝试执行网络请求
    const response = await fetch(path); // 使用fetch获取资源
    if (!response.ok) { // 如果返回状态非200
      console.warn(`无法加载 ${path}，状态码：${response.status}`); // 打印警告信息
      return null; // 返回空以触发占位逻辑
    } // 结束
    return await response.json(); // 成功解析JSON并返回
  } catch (error) { // 捕获异常
    console.warn(`请求 ${path} 时发生异常：`, error); // 输出错误信息
    return null; // 返回空值
  } // 结束
} // 结束

// 合并多个配置对象，后者覆盖前者。
function mergeConfig(...configs) { // 定义配置合并函数
  return Object.assign({}, ...configs); // 使用Object.assign合并配置
} // 结束

// 将一维CSV数组转换为二维矩阵。
function csvToMatrix(data, width) { // 定义CSV转矩阵函数
  const matrix = []; // 初始化矩阵数组
  for (let i = 0; i < data.length; i += width) { // 每行宽度进行切片
    matrix.push(data.slice(i, i + width)); // 将片段推入矩阵
  } // 结束
  return matrix; // 返回最终矩阵
} // 结束

// 构建数字值到逻辑瓦片名称的映射。
function buildTileLookup(bindings) { // 定义数值映射函数
  const keys = Object.keys(bindings); // 获取绑定键名列表
  const lookup = {}; // 初始化映射对象
  keys.forEach((key, index) => { // 遍历每个键名
    lookup[index + 1] = key; // 假设从1开始对应
  }); // 结束
  return lookup; // 返回映射
} // 结束

// 根据逻辑瓦片名称获取实际帧ID。
function resolveTileFrame(bindings, tileName) { // 定义帧解析函数
  const info = bindings[tileName]; // 获取绑定信息
  if (!info) { // 若无信息
    return 0; // 返回默认帧0
  } // 结束
  return info.id || 0; // 返回配置中的帧ID
} // 结束

// 创建占位瓦片图形并绘制到场景。
function drawPlaceholderTile(scene, x, y, size, type) { // 定义占位瓦片绘制函数
  const color = PLACEHOLDER_TILE_COLORS[type] || 0x555555; // 根据类型选择颜色
  const graphics = scene.add.graphics(); // 新建图形对象
  graphics.fillStyle(color, 1); // 设置填充颜色
  graphics.fillRect(x, y, size, size); // 绘制填充矩形
  graphics.lineStyle(1, 0x000000, 0.2); // 设置描边颜色与透明度
  graphics.strokeRect(x, y, size, size); // 绘制描边增强网格感
  return graphics; // 返回图形对象
} // 结束

// 创建占位角色纹理用于物理精灵。
function ensurePlaceholderPlayerTexture(scene, key, size) { // 定义占位角色纹理生成函数
  if (scene.textures.exists(key)) { // 若纹理已存在
    return; // 直接返回避免重复生成
  } // 结束
  const canvasTexture = scene.textures.createCanvas(key, size, size); // 创建画布纹理
  const context = canvasTexture.getContext(); // 获取画布上下文
  context.fillStyle = "#f1c40f"; // 设置头部颜色
  context.beginPath(); // 开始绘制路径
  context.arc(size / 2, size / 2.5, size / 3, 0, Math.PI * 2); // 绘制圆形头部
  context.fill(); // 填充头部
  context.fillStyle = "#2c3e50"; // 设置身体颜色
  context.fillRect(size / 2 - size / 6, size / 2, size / 3, size / 2.5); // 绘制身体矩形
  context.fillStyle = "#ecf0f1"; // 设置眼睛颜色
  context.fillRect(size / 2 - size / 8, size / 2.2, size / 12, size / 12); // 绘制左眼
  context.fillRect(size / 2 + size / 12, size / 2.2, size / 12, size / 12); // 绘制右眼
  canvasTexture.refresh(); // 刷新纹理使其生效
} // 结束

// 创建占位瓦片纹理供碰撞使用。
function ensureCollisionTexture(scene, key) { // 定义碰撞纹理生成函数
  if (scene.textures.exists(key)) { // 若已有纹理
    return; // 直接返回
  } // 结束
  scene.textures.generate(key, { data: ["1"], pixelWidth: 1, pixelHeight: 1, palette: { 1: "#ffffff" } }); // 生成1像素白纹理
} // 结束

// Phaser场景类，封装加载、创建与更新逻辑。
class MiniWorldScene extends Phaser.Scene { // 声明自定义场景类
  constructor() { // 构造函数
    super({ key: "MiniWorldScene" }); // 调用父类构造设置场景键名
    this.bootData = null; // 初始化启动数据
    this.hasTilesetImage = false; // 标记是否加载到真实图集
    this.loadedAtlasKeys = {}; // 记录图集路径到Phaser键名的映射
    this.hasPlayerSprite = false; // 标记是否加载到真实角色精灵
    this.player = null; // 玩家对象引用
    this.cursors = null; // 键盘输入引用
    this.collisionGroup = null; // 碰撞组引用
  } // 结束

  preload() { // Phaser预加载阶段
    this.bootData = window.__PIXELWORLD_BOOT; // 读取全局启动数据
    const tileBindings = this.bootData.tileBindings || DEFAULT_TILE_BINDINGS; // 获取瓦片绑定
    const personas = this.bootData.personaBindings || DEFAULT_PERSONA_BINDINGS; // 获取角色绑定
    const atlasInfos = Object.values(tileBindings.bindings || {}); // 收集绑定信息
    const uniqueAtlases = Array.from(new Set(atlasInfos.map((info) => info.atlas))); // 去重图集路径
    const tileSize = tileBindings.tile_size || this.bootData.config.tileSize; // 计算瓦片尺寸

    uniqueAtlases.forEach((atlasPath, index) => { // 遍历每个图集路径
      if (!atlasPath) { // 若路径为空
        return; // 跳过加载
      } // 结束
      const key = `tilesheet_${index}`; // 为每个图集生成唯一键名
      this.loadedAtlasKeys[atlasPath] = key; // 记录映射关系
      this.load.spritesheet(key, atlasPath, { frameWidth: tileSize, frameHeight: tileSize }); // 加载图集为精灵表
    }); // 结束

    const defaultPlayer = personas.default_player || {}; // 获取默认玩家绑定
    if (defaultPlayer.sprite) { // 若存在精灵路径
      this.load.spritesheet("playerSprite", defaultPlayer.sprite, { frameWidth: tileSize, frameHeight: tileSize }); // 加载角色精灵
    } // 结束

    this.load.on("loaderror", (file) => { // 监听加载错误事件
      console.warn(`资源加载失败：${file.src}`); // 输出失败信息
    }); // 结束

    this.load.on("filecomplete", (key, type) => { // 监听文件完成事件
      if (type === "spritesheet" && key.startsWith("tilesheet_")) { // 判断是否为瓦片图集
        this.hasTilesetImage = true; // 标记成功加载图集
      } // 结束
      if (key === "playerSprite") { // 判断是否为玩家精灵
        this.hasPlayerSprite = true; // 标记成功加载角色
      } // 结束
    }); // 结束
  } // 结束

  create() { // Phaser创建阶段
    const config = this.bootData.config; // 读取配置
    const mapData = this.bootData.mapData; // 读取地图数据
    const tileBindings = this.bootData.tileBindings || DEFAULT_TILE_BINDINGS; // 读取瓦片绑定
    const lookup = buildTileLookup(tileBindings.bindings || {}); // 构造瓦片索引映射
    const tileSize = config.tileSize; // 获取瓦片尺寸
    ensureCollisionTexture(this, "collisionTile"); // 确保碰撞纹理存在

    const groundLayerData = mapData.layers.find((layer) => layer.name === "Ground"); // 查找地面层
    const collisionLayerData = mapData.layers.find((layer) => layer.name === "Collision"); // 查找碰撞层
    const groundMatrix = csvToMatrix(groundLayerData.data, mapData.width); // 转换地面矩阵
    const collisionMatrix = csvToMatrix(collisionLayerData.data, mapData.width); // 转换碰撞矩阵

    const worldWidth = mapData.width * tileSize; // 计算世界宽度
    const worldHeight = mapData.height * tileSize; // 计算世界高度

    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight); // 设置相机边界
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight); // 设置物理世界边界

    this.collisionGroup = this.physics.add.staticGroup(); // 创建静态碰撞组

    for (let y = 0; y < groundMatrix.length; y += 1) { // 遍历每一行
      for (let x = 0; x < groundMatrix[y].length; x += 1) { // 遍历每一列
        const tileValue = groundMatrix[y][x]; // 当前瓦片值
        const tileName = lookup[tileValue] || "GRASS"; // 映射到逻辑名称
        const bindingInfo = tileBindings.bindings[tileName]; // 获取绑定信息
        const worldX = x * tileSize; // 计算世界坐标X
        const worldY = y * tileSize; // 计算世界坐标Y

        if (this.hasTilesetImage && bindingInfo) { // 若加载到真实图集
          const atlasKey = this.loadedAtlasKeys[bindingInfo.atlas] || Object.values(this.loadedAtlasKeys)[0]; // 取对应键名
          const frame = resolveTileFrame(tileBindings.bindings, tileName); // 获取帧索引
          const image = this.add.image(worldX + tileSize / 2, worldY + tileSize / 2, atlasKey, frame); // 添加瓦片图像
          image.setDisplaySize(tileSize, tileSize); // 保证显示尺寸正确
        } else { // 否则使用占位绘制
          drawPlaceholderTile(this, worldX, worldY, tileSize, tileValue); // 绘制占位瓦片
        } // 结束

        const collisionValue = collisionMatrix[y][x]; // 获取碰撞层值
        if (collisionValue > 0) { // 若为不可通行瓦片
          const collider = this.collisionGroup.create(worldX + tileSize / 2, worldY + tileSize / 2, "collisionTile"); // 创建静态碰撞体
          collider.setDisplaySize(tileSize, tileSize); // 设置显示尺寸
          collider.setVisible(false); // 隐藏碰撞占位
          collider.body.updateFromGameObject(); // 同步物理体尺寸
        } // 结束
      } // 结束
    } // 结束

    if (this.hasPlayerSprite) { // 若存在真实角色精灵
      this.player = this.physics.add.sprite(tileSize * 2, tileSize * 2, "playerSprite", 0); // 创建玩家精灵
      this.player.setCollideWorldBounds(true); // 限制玩家在世界内
      this.player.setScale(tileSize / this.player.width); // 根据瓦片尺寸缩放
    } else { // 否则使用程序化占位
      ensurePlaceholderPlayerTexture(this, "placeholderPlayer", tileSize); // 创建占位纹理
      this.player = this.physics.add.sprite(tileSize * 2, tileSize * 2, "placeholderPlayer"); // 创建占位玩家
      this.player.setCollideWorldBounds(true); // 限制玩家范围
    } // 结束

    this.physics.add.collider(this.player, this.collisionGroup); // 添加玩家与障碍碰撞

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1); // 相机跟随玩家

    this.cursors = this.input.keyboard.createCursorKeys(); // 创建方向键输入
  } // 结束

  update() { // 每帧更新逻辑
    if (!this.player || !this.cursors) { // 若尚未初始化
      return; // 直接返回
    } // 结束
    const speed = this.bootData.config.playerSpeed; // 获取玩家速度
    const body = this.player.body; // 获取物理刚体
    body.setVelocity(0, 0); // 每帧重置速度

    if (this.cursors.left.isDown) { // 检测左键
      body.setVelocityX(-speed); // 向左移动
    } else if (this.cursors.right.isDown) { // 检测右键
      body.setVelocityX(speed); // 向右移动
    } // 结束

    if (this.cursors.up.isDown) { // 检测上键
      body.setVelocityY(-speed); // 向上移动
    } else if (this.cursors.down.isDown) { // 检测下键
      body.setVelocityY(speed); // 向下移动
    } // 结束

    body.velocity.normalize().scale(speed); // 归一化速度保持对角速度一致
  } // 结束
} // 结束

// 启动流程：加载配置与资源映射后初始化Phaser游戏。
async function bootstrap() { // 定义启动函数
  const exampleConfig = await loadJSON("config.example.json"); // 尝试加载示例配置
  const userConfig = await loadJSON("config.json"); // 尝试加载用户配置
  const finalConfig = mergeConfig(DEFAULT_CONFIG, exampleConfig || {}, userConfig || {}); // 合并配置

  const mapData = (await loadJSON("maps/demo_map.json")) || { // 加载地图数据
    width: 10, // 默认宽度
    height: 10, // 默认高度
    layers: [ // 默认层数据
      { name: "Ground", data: new Array(100).fill(1) }, // 默认地面层
      { name: "Collision", data: new Array(100).fill(0) } // 默认碰撞层
    ] // 层结束
  }; // 地图结束
  mapData.tilewidth = mapData.tilewidth || finalConfig.tileSize; // 设置瓦片宽度
  mapData.tileheight = mapData.tileheight || finalConfig.tileSize; // 设置瓦片高度

  const tileBindings = (await loadJSON("../../assets/mapping/tileset_binding.json")) || DEFAULT_TILE_BINDINGS; // 加载瓦片绑定
  const personaBindings = (await loadJSON("../../assets/mapping/personas_binding.json")) || DEFAULT_PERSONA_BINDINGS; // 加载角色绑定

  window.__PIXELWORLD_BOOT = { config: finalConfig, mapData, tileBindings, personaBindings }; // 将数据写入全局供场景使用

  const gameWidth = mapData.width * finalConfig.tileSize; // 计算画布宽度
  const gameHeight = mapData.height * finalConfig.tileSize; // 计算画布高度

  const gameConfig = { // 构建Phaser游戏配置
    type: Phaser.AUTO, // 自动选择渲染器
    width: gameWidth, // 设置画布宽度
    height: gameHeight, // 设置画布高度
    backgroundColor: "#0d0d14", // 设置背景色
    parent: "app-root", // 指定挂载节点
    pixelArt: true, // 启用像素渲染模式
    physics: { default: "arcade", arcade: { gravity: { y: 0 }, debug: false } }, // 配置Arcade物理
    scene: MiniWorldScene // 指定场景类
  }; // 配置结束

  document.getElementById("app-root").innerHTML = ""; // 清空占位文本
  new Phaser.Game(gameConfig); // 启动Phaser游戏
} // 结束

bootstrap(); // 调用启动函数初始化应用
