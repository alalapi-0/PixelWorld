// 全局常量：瓦片尺寸设定为32像素。
const TILE_SIZE = 32; // 设定瓦片尺寸
// 全局常量：按照脚本生成顺序定义地形索引映射。
const TILE_INDEX = { // 定义名称到索引的映射
  GRASS: 0, // 草地索引
  ROAD: 1, // 道路索引
  TILE_FLOOR: 2, // 瓷砖地板索引
  WATER: 3, // 水面索引
  LAKE: 4, // 湖泊索引
  WALL: 5, // 墙体索引
  TREE: 6, // 树木索引
  HOUSE: 7, // 房屋索引
  ROCK: 8, // 岩石索引
  LAVA: 9 // 岩浆索引
}; // 映射定义结束
// 不可通行瓦片集合（转换为Tiled使用的gid值）。
const BLOCKED_GIDS = [4, 5, 6, 7, 8, 9, 10]; // 需阻挡的瓦片编号（索引+1）
// 计算玩家移动速度常量。
const PLAYER_SPEED = 140; // 玩家基础速度

// 工具函数：向根节点写入消息提示用户生成资源。
function showAssetMissingMessage(message) { // 定义缺失资源提示函数
  const root = document.getElementById("app-root"); // 获取主容器
  if (root) { // 确认容器存在
    root.innerHTML = `<p>${message}</p>`; // 替换容器内容为提示文本
  } // 条件结束
} // 函数结束

// 自定义场景类，负责加载资源与处理交互。
class MiniWorldScene extends Phaser.Scene { // 定义MiniWorldScene类
  constructor() { // 构造函数
    super({ key: "MiniWorldScene" }); // 调用父类构造并传递键名
    this.failedAssets = []; // 初始化加载失败列表
    this.player = null; // 初始化玩家引用
    this.cursors = null; // 初始化方向键引用
    this.resetKey = null; // 初始化重置键引用
    this.spawnPoint = { x: TILE_SIZE * 2, y: TILE_SIZE * 2 }; // 初始化出生点
    this.tileLayer = null; // 初始化瓦片层引用
  } // 构造函数结束

  preload() { // Phaser预加载阶段
    this.failedAssets = []; // 清空失败列表
    this.load.on("loaderror", (file) => { // 监听加载错误事件
      this.failedAssets.push(file.src || file.key); // 将失败资源记录到数组
    }); // 事件绑定结束
    this.load.tilemapTiledJSON("demoMap", "maps/demo_map.json"); // 加载Tiled地图JSON
    this.load.image("worldTiles", "assets/build/tiles/tilesheet.png"); // 加载瓦片图集
    this.load.spritesheet("playerSprite", "assets/build/characters/player.png", { frameWidth: TILE_SIZE, frameHeight: TILE_SIZE }); // 加载玩家精灵
  } // preload结束

  create() { // Phaser创建阶段
    if (this.failedAssets.length > 0 || !this.cache.tilemap.exists("demoMap") || !this.textures.exists("worldTiles")) { // 判断资源是否缺失
      showAssetMissingMessage("请先运行 make assets 生成素材与地图。"); // 输出提示
      return; // 中断创建流程
    } // 条件结束
    const map = this.make.tilemap({ key: "demoMap" }); // 根据缓存创建地图对象
    const tileset = map.addTilesetImage("world_tiles", "worldTiles", TILE_SIZE, TILE_SIZE, 0, 0, 1); // 将瓦片集与纹理绑定
    this.tileLayer = map.createLayer("Ground", tileset, 0, 0); // 创建地面层
    this.tileLayer.setOrigin(0, 0); // 设置瓦片层原点到左上角
    this.tileLayer.setCollision(BLOCKED_GIDS); // 设置不可通行瓦片碰撞
    const spawnTile = this.findRoadTile(); // 查找道路出生点
    if (spawnTile) { // 如果找到道路瓦片
      this.spawnPoint = { // 更新出生点坐标
        x: spawnTile.getCenterX(), // 设置X坐标
        y: spawnTile.getCenterY() // 设置Y坐标
      }; // 对象结束
    } // 条件结束
    this.player = this.physics.add.sprite(this.spawnPoint.x, this.spawnPoint.y, "playerSprite", 0); // 创建玩家精灵
    this.player.setCollideWorldBounds(true); // 限制玩家在地图内
    this.player.body.setSize(TILE_SIZE * 0.6, TILE_SIZE * 0.8); // 调整碰撞箱尺寸
    this.player.body.setOffset(TILE_SIZE * 0.2, TILE_SIZE * 0.2); // 调整碰撞箱偏移
    this.anims.create({ // 创建玩家走路动画
      key: "walk", // 动画键名
      frames: this.anims.generateFrameNumbers("playerSprite", { start: 0, end: 3 }), // 指定帧范围
      frameRate: 8, // 帧率
      repeat: -1 // 循环播放
    }); // 动画定义结束
    this.physics.add.collider(this.player, this.tileLayer); // 添加玩家与瓦片层碰撞
    this.cursors = this.input.keyboard.createCursorKeys(); // 创建方向键输入
    this.resetKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R); // 注册重置键
    this.cameras.main.startFollow(this.player); // 相机跟随玩家
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels); // 限制相机边界
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels); // 设置物理世界边界
  } // create结束

  update() { // 游戏逐帧更新
    if (!this.player || !this.cursors) { // 如果玩家或输入未准备好
      return; // 提前返回
    } // 条件结束
    let velocityX = 0; // 初始化水平速度
    let velocityY = 0; // 初始化垂直速度
    if (this.cursors.left.isDown) { // 按下左键
      velocityX -= 1; // 速度左移
    } // 条件结束
    if (this.cursors.right.isDown) { // 按下右键
      velocityX += 1; // 速度右移
    } // 条件结束
    if (this.cursors.up.isDown) { // 按下上键
      velocityY -= 1; // 速度上移
    } // 条件结束
    if (this.cursors.down.isDown) { // 按下下键
      velocityY += 1; // 速度下移
    } // 条件结束
    if (velocityX !== 0 && velocityY !== 0) { // 处理对角移动
      const factor = Math.SQRT1_2; // 计算对角归一化因子
      velocityX *= factor; // 调整水平速度
      velocityY *= factor; // 调整垂直速度
    } // 条件结束
    this.player.setVelocity(velocityX * PLAYER_SPEED, velocityY * PLAYER_SPEED); // 应用速度到玩家
    if (velocityX !== 0 || velocityY !== 0) { // 若玩家在移动
      this.player.anims.play("walk", true); // 播放走路动画
    } else { // 否则保持静止
      this.player.anims.stop(); // 停止动画
      this.player.setFrame(0); // 重置为第一帧
    } // 条件结束
    if (Phaser.Input.Keyboard.JustDown(this.resetKey)) { // 检测重置按键
      this.resetPlayerPosition(); // 调用重置函数
    } // 条件结束
  } // update结束

  resetPlayerPosition() { // 定义重置玩家位置的函数
    if (!this.player) { // 如果玩家不存在
      return; // 不执行重置
    } // 条件结束
    this.player.setVelocity(0, 0); // 停止移动
    this.player.setPosition(this.spawnPoint.x, this.spawnPoint.y); // 移动回出生点
  } // 函数结束

  findRoadTile() { // 定义查找道路瓦片的方法
    if (!this.tileLayer) { // 如果瓦片层尚未创建
      return null; // 返回空
    } // 条件结束
    const roadGid = TILE_INDEX.ROAD + 1; // 计算道路瓦片gid
    return this.tileLayer.findTile((tile) => tile.index === roadGid); // 在当前层查找道路瓦片
  } // 方法结束
} // 类定义结束

// 在脚本加载后立即检查Phaser是否存在并创建游戏实例。
if (typeof window.Phaser === "undefined") { // 判断全局是否已加载Phaser
  showAssetMissingMessage("未加载 Phaser 库，请检查网络或CDN。"); // 提示缺少Phaser
} else { // 若Phaser存在
  const root = document.getElementById("app-root"); // 获取根节点
  if (root) { // 确认存在
    root.innerHTML = ""; // 清空占位文本以放置Canvas
  } // 结束
  const config = { // 定义游戏配置
    type: Phaser.AUTO, // 自动选择渲染器
    parent: "app-root", // 将Canvas插入到根节点
    width: TILE_SIZE * 20, // 默认宽度20格
    height: TILE_SIZE * 15, // 默认高度15格
    backgroundColor: "#101020", // 设置深色背景
    pixelArt: true, // 启用像素渲染
    physics: { // 物理引擎配置
      default: "arcade", // 使用Arcade物理
      arcade: { debug: false } // 关闭调试信息
    }, // 物理配置结束
    scene: MiniWorldScene // 指定场景类
  }; // 配置结束
  // eslint-disable-next-line no-new
  new Phaser.Game(config); // 启动游戏实例
} // Phaser存在判断结束
