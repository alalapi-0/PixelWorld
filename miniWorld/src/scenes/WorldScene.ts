import Phaser from 'phaser'; // 引入Phaser框架
import { KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT, KEY_INTERACT, KEY_SAVE, KEY_LOAD } from '../config/keys'; // 引入按键常量
import { genDemoMap, isWalkable, layerOf } from '../world/TileRules'; // 引入地图工具
import { TileCell, GridPos } from '../world/Types'; // 引入类型定义
import { getNodeAt, removeNodeAt } from '../world/Nodes'; // 引入资源节点接口
import { Inventory } from '../systems/Inventory'; // 引入背包系统
import { save, load, buildState, applyState } from '../systems/SaveLoad'; // 引入存档系统
import { LabelManager } from '../ui/LabelManager'; // 引入提示管理器
import { PopupManager } from '../ui/PopupManager'; // 引入飘字管理器
// 分隔注释 // 保持行有注释
const TILE_SIZE = 32; // 定义瓦片像素大小
// 分隔注释 // 保持行有注释
export default class WorldScene extends Phaser.Scene { // 定义世界场景
  private mapData: TileCell[][] = []; // 保存地图数据
  private tileSprites: Phaser.GameObjects.Image[][] = []; // 保存瓦片精灵引用
  private playerContainer!: Phaser.GameObjects.Container; // 保存玩家容器
  private playerSprite!: Phaser.GameObjects.Sprite; // 保存玩家精灵
  private inventory: Inventory = new Inventory(); // 初始化背包
  private labelManager!: LabelManager; // 提示管理器引用
  private popupManager!: PopupManager; // 飘字管理器引用
  private cursors!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; }; // 方向按键引用
  private interactKey!: Phaser.Input.Keyboard.Key; // 交互按键引用
  private saveKey!: Phaser.Input.Keyboard.Key; // 保存按键引用
  private loadKey!: Phaser.Input.Keyboard.Key; // 读取按键引用
  private hudSourceText!: Phaser.GameObjects.Text; // 素材来源文本
  private hudControlsText!: Phaser.GameObjects.Text; // 操作提示文本
  private playerSpeed = 80; // 玩家移动速度
  // 分隔注释 // 保持行有注释
  public constructor() { // 构造函数
    super('WorldScene'); // 调用父类构造并设定场景键名
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public create(): void { // 场景创建时调用
    this.mapData = genDemoMap(10, 10); // 生成演示地图
    this.renderMap(); // 渲染瓦片
    this.createPlayer(); // 创建玩家实体
    this.labelManager = new LabelManager(this); // 初始化提示管理器
    this.popupManager = new PopupManager(this); // 初始化飘字管理器
    this.setupInput(); // 配置输入
    this.createHUD(); // 创建界面
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private renderMap(): void { // 渲染地图方法
    this.tileSprites.forEach((row) => row.forEach((sprite) => sprite.destroy())); // 清理旧瓦片
    this.tileSprites = []; // 重置数组
    this.mapData.forEach((row, y) => { // 遍历行
      const spriteRow: Phaser.GameObjects.Image[] = []; // 初始化行精灵数组
      row.forEach((cell, x) => { // 遍历列
        const textureKey = `tile_${cell.type}`; // 计算纹理键
        const image = this.add.image(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, textureKey); // 创建瓦片图像
        image.setOrigin(0.5, 0.5); // 设置锚点
        image.setDepth(layerOf(cell) === 'overpass' ? 200 + y : y); // 根据层位设置深度
        spriteRow.push(image); // 保存引用
      }); // 列遍历结束
      this.tileSprites.push(spriteRow); // 将行加入数组
    }); // 行遍历结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private createPlayer(): void { // 创建玩家实体
    const startGrid: GridPos = { x: 1, y: 5 }; // 定义初始网格
    const worldX = startGrid.x * TILE_SIZE + TILE_SIZE / 2; // 计算像素X
    const worldY = startGrid.y * TILE_SIZE + TILE_SIZE / 2; // 计算像素Y
    this.playerContainer = this.add.container(worldX, worldY); // 创建容器
    this.playerSprite = this.add.sprite(0, 0, 'player_idle_0'); // 创建精灵
    this.playerSprite.setOrigin(0.5, 1); // 设置锚点
    this.playerSprite.play('player_walk'); // 播放行走动画
    this.playerContainer.add(this.playerSprite); // 将精灵加入容器
    this.updatePlayerDepth(); // 根据位置更新深度
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private setupInput(): void { // 配置按键
    this.cursors = this.input.keyboard.addKeys({ up: KEY_UP, down: KEY_DOWN, left: KEY_LEFT, right: KEY_RIGHT }) as { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; }; // 创建方向键映射
    this.interactKey = this.input.keyboard.addKey(KEY_INTERACT); // 创建交互键
    this.saveKey = this.input.keyboard.addKey(KEY_SAVE); // 创建保存键
    this.loadKey = this.input.keyboard.addKey(KEY_LOAD); // 创建读取键
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private createHUD(): void { // 创建界面元素
    const source = this.registry.get('assetSource') as string | undefined; // 读取素材来源
    this.hudSourceText = this.add.text(8, 8, `素材来源：${source ?? '占位纹理'}`, { fontFamily: 'sans-serif', fontSize: '12px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.66)', padding: { x: 4, y: 2 } }); // 创建左上角文本
    this.hudSourceText.setDepth(1200); // 设置渲染深度
    this.hudControlsText = this.add.text(312, 312, 'Z 采集 / S 保存 / L 读取', { fontFamily: 'sans-serif', fontSize: '12px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.66)', padding: { x: 4, y: 2 }, align: 'right' }); // 创建右下角提示
    this.hudControlsText.setOrigin(1, 1); // 设置锚点
    this.hudControlsText.setDepth(1200); // 设置深度
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public update(_: number, delta: number): void { // 每帧更新
    this.handleMovement(delta); // 更新移动
    this.handleInteractionInput(); // 处理采集按键
    this.handleSaveLoadInput(); // 处理存读按键
    this.updateResourceHint(); // 更新提示
    this.popupManager.update(delta); // 更新飘字动画
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private handleMovement(delta: number): void { // 处理玩家移动
    const horizontal = (this.cursors.right.isDown ? 1 : 0) - (this.cursors.left.isDown ? 1 : 0); // 计算水平输入
    const vertical = (this.cursors.down.isDown ? 1 : 0) - (this.cursors.up.isDown ? 1 : 0); // 计算垂直输入
    const direction = new Phaser.Math.Vector2(horizontal, vertical); // 构造方向向量
    if (direction.lengthSq() > 0) { // 如果有输入
      direction.normalize(); // 归一化向量
      if (!this.playerSprite.anims.isPlaying) { // 如果动画未播放
        this.playerSprite.play('player_walk'); // 播放动画
      } // 条件结束
    } else { // 没有输入
      if (this.playerSprite.anims.isPlaying) { // 如果动画播放中
        this.playerSprite.anims.stop(); // 停止动画
        this.playerSprite.setTexture('player_idle_0'); // 切换到静止帧
      } // 条件结束
    } // 输入判断结束
    const deltaSeconds = delta / 1000; // 转换为秒
    let newX = this.playerContainer.x; // 初始化新X
    let newY = this.playerContainer.y; // 初始化新Y
    if (direction.x !== 0) { // 如果存在水平移动
      const candidateX = newX + direction.x * this.playerSpeed * deltaSeconds; // 计算目标X
      const tileX = Math.floor(candidateX / TILE_SIZE); // 计算目标网格X
      const tileY = Math.floor(newY / TILE_SIZE); // 当前网格Y
      if (this.canMoveTo(tileX, tileY)) { // 判断是否可走
        newX = candidateX; // 更新位置
      } // 条件结束
    } // 水平结束
    if (direction.y !== 0) { // 如果存在垂直移动
      const candidateY = newY + direction.y * this.playerSpeed * deltaSeconds; // 计算目标Y
      const tileX = Math.floor(newX / TILE_SIZE); // 当前网格X
      const tileY = Math.floor(candidateY / TILE_SIZE); // 目标网格Y
      if (this.canMoveTo(tileX, tileY)) { // 判断是否可走
        newY = candidateY; // 更新位置
      } // 条件结束
    } // 垂直结束
    const mapWidth = this.mapData[0]?.length ?? 0; // 地图宽度
    const mapHeight = this.mapData.length; // 地图高度
    const minX = TILE_SIZE / 2; // 最小X
    const maxX = mapWidth * TILE_SIZE - TILE_SIZE / 2; // 最大X
    const minY = TILE_SIZE / 2; // 最小Y
    const maxY = mapHeight * TILE_SIZE - TILE_SIZE / 2; // 最大Y
    this.playerContainer.x = Phaser.Math.Clamp(newX, minX, maxX); // 应用X位置
    this.playerContainer.y = Phaser.Math.Clamp(newY, minY, maxY); // 应用Y位置
    this.updatePlayerDepth(); // 更新深度
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private canMoveTo(tileX: number, tileY: number): boolean { // 判断是否可移动到目标网格
    if (tileY < 0 || tileY >= this.mapData.length) { // 检查纵向越界
      return false; // 返回不可行
    } // 条件结束
    if (tileX < 0 || tileX >= this.mapData[0].length) { // 检查横向越界
      return false; // 返回不可行
    } // 条件结束
    return isWalkable(this.mapData[tileY][tileX]); // 返回通行结果
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private updatePlayerDepth(): void { // 根据所在瓦片更新深度
    const grid = this.getPlayerGrid(); // 获取玩家所在格子
    const cell = this.mapData[grid.y]?.[grid.x]; // 获取单元格
    if (cell) { // 如果存在
      const baseDepth = layerOf(cell) === 'overpass' ? 600 : 400; // 根据层位确定深度基准
      this.playerContainer.setDepth(baseDepth + grid.y); // 设置深度
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private getPlayerGrid(): GridPos { // 计算玩家当前网格坐标
    return { x: Math.floor(this.playerContainer.x / TILE_SIZE), y: Math.floor(this.playerContainer.y / TILE_SIZE) }; // 返回坐标
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private handleInteractionInput(): void { // 处理交互输入
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) { // 如果按下交互键
      this.tryCollectNode(); // 执行采集
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private tryCollectNode(): void { // 尝试采集资源节点
    const grid = this.getPlayerGrid(); // 获取玩家位置
    const node = getNodeAt(grid); // 查询资源节点
    if (!node) { // 如果没有节点
      return; // 直接返回
    } // 条件结束
    this.inventory.add(node.loot.id, node.loot.name, node.loot.count); // 将物品加入背包
    removeNodeAt(grid); // 移除节点
    this.mapData[grid.y][grid.x] = { type: 'GRASS', layerTag: 'ground' }; // 将格子恢复为草地
    this.updateTileTexture(grid.x, grid.y); // 更新瓦片显示
    this.labelManager.hideAll(); // 隐藏提示
    this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE / 2, `+${node.loot.count} ${node.loot.name}`, node.type === 'TREE' ? '#88ff88' : node.type === 'ROCK' ? '#ccccff' : '#ff99ff'); // 显示飘字
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private updateTileTexture(x: number, y: number): void { // 更新单个瓦片纹理
    const cell = this.mapData[y]?.[x]; // 获取单元格
    const sprite = this.tileSprites[y]?.[x]; // 获取对应精灵
    if (cell && sprite) { // 如果存在
      sprite.setTexture(`tile_${cell.type}`); // 更新纹理
      sprite.setDepth(layerOf(cell) === 'overpass' ? 200 + y : y); // 更新深度
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private updateResourceHint(): void { // 更新资源提示
    const grid = this.getPlayerGrid(); // 获取玩家位置
    const node = getNodeAt(grid); // 查找节点
    if (node) { // 如果存在
      this.labelManager.showHintAt(this.playerContainer.x, this.playerContainer.y - this.playerSprite.displayHeight, '按 Z 采集'); // 显示提示
    } else { // 否则
      this.labelManager.hideAll(); // 隐藏提示
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private handleSaveLoadInput(): void { // 处理存读输入
    if (Phaser.Input.Keyboard.JustDown(this.saveKey)) { // 检测保存键
      void this.performSave(); // 执行保存
    } // 条件结束
    if (Phaser.Input.Keyboard.JustDown(this.loadKey)) { // 检测读取键
      void this.performLoad(); // 执行读取
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private async performSave(): Promise<void> { // 执行保存逻辑
    const state = buildState({ map: this.mapData }, { x: this.playerContainer.x, y: this.playerContainer.y }, this.inventory); // 构建状态
    await save('slot1', state); // 保存到固定存档位
    this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE, '保存成功', '#66ccff'); // 提示保存成功
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private async performLoad(): Promise<void> { // 执行读取逻辑
    const data = await load('slot1'); // 读取存档
    if (!data) { // 如果没有存档
      this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE, '无存档', '#ffcc66'); // 提示无存档
      return; // 结束函数
    } // 条件结束
    applyState(data as ReturnType<typeof buildState>, { setMapData: (map) => this.setMapData(map) }, { setPosition: (x, y) => this.setPlayerPosition(x, y) }, this.inventory); // 应用状态
    this.renderMap(); // 重新渲染地图
    this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE, '读取成功', '#66ffcc'); // 提示读取成功
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public setMapData(map: TileCell[][]): void { // 外部接口用于更新地图
    this.mapData = map.map((row) => row.map((cell) => ({ ...cell }))); // 深拷贝赋值
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public setPlayerPosition(x: number, y: number): void { // 外部接口用于移动玩家
    this.playerContainer.setPosition(x, y); // 设置位置
    this.updatePlayerDepth(); // 更新深度
  } // 方法结束
} // 类结束
