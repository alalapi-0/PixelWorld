import Phaser from 'phaser'; // 引入Phaser框架
import { KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT, KEY_INTERACT, KEY_SAVE, KEY_LOAD, KEY_GLOSSARY, KEY_ACHIEVEMENT, KEY_SHOP, KEY_SPEED_TOGGLE, KEY_JOURNAL } from '../config/keys'; // 引入按键常量
import { genDemoMap, isWalkable, layerOf } from '../world/TileRules'; // 引入地图工具
import { TileCell, GridPos } from '../world/Types'; // 引入类型定义
import { getNodeAt, removeNodeAt } from '../world/Nodes'; // 引入资源节点接口
import { Inventory } from '../systems/Inventory'; // 引入背包系统
import { save, load, buildState, applyState, UISaveSettings, GameSaveState } from '../systems/SaveLoad'; // 引入存档系统
import { LabelManager } from '../ui/LabelManager'; // 引入提示管理器
import { PopupManager } from '../ui/PopupManager'; // 引入飘字管理器
import { renderTextToTexture } from '../ui/TextTexture'; // 引入文字纹理工具
import { ShopStore } from '../economy/ShopStore'; // 引入商店仓库
import { ShopService } from '../economy/ShopService'; // 引入商店服务
import { ShopUI } from '../ui/ShopUI'; // 引入商店界面
import { DEFAULT_SHOP_ID, GOLD_ITEM_ID, GOLD_ITEM_NAME } from '../economy/ShopTypes'; // 引入商店与金币常量
import { TimeSystem, TimeState } from '../systems/TimeSystem'; // 引入时间系统
import { TimeScaleBoost } from '../systems/TimeScaleBoost'; // 引入快进系统
import UIScene from './UIScene'; // 引入UI场景
import { AutoTextController } from '../ui/AutoTextController'; // 引入自动文本控制器
import { UIVisibilityManager } from '../ui/UIVisibilityManager'; // 引入UI显隐管理器
import { AchievementManager, AchievementSave } from '../ui/achievements/AchievementManager'; // 引入成就管理器
import { QuestStore } from '../quest/QuestStore'; // 引入任务存储
import { QuestTriggers } from '../quest/QuestTriggers'; // 引入任务触发器
import { QuestTracker } from '../quest/QuestTracker'; // 引入任务追踪器
import { QuestJournal } from '../ui/QuestJournal'; // 引入任务日志界面
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
  private achievementManager!: AchievementManager; // 成就管理器引用
  private autoController?: AutoTextController; // 自动文本控制器引用
  private uiVisibility?: UIVisibilityManager; // UI显隐管理器引用
  private pendingUISettings?: UISaveSettings; // 待应用的UI设置
  private cursors!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; }; // 方向按键引用
  private interactKey!: Phaser.Input.Keyboard.Key; // 交互按键引用
  private saveKey!: Phaser.Input.Keyboard.Key; // 保存按键引用
  private loadKey!: Phaser.Input.Keyboard.Key; // 读取按键引用
  private glossaryKey!: Phaser.Input.Keyboard.Key; // 图鉴按键引用
  private achievementKey!: Phaser.Input.Keyboard.Key; // 成就按键引用
  private hudSourceText!: Phaser.GameObjects.Text; // 素材来源文本
  private hudControlsText!: Phaser.GameObjects.Text; // 操作提示文本
  private shopStore: ShopStore; // 商店数据仓库
  private shopService!: ShopService; // 商店服务
  private shopUI?: ShopUI; // 商店界面
  private timeSystem!: TimeSystem; // 时间系统
  private timeScaleBoost!: TimeScaleBoost; // 快进控制
  private shopKey!: Phaser.Input.Keyboard.Key; // 商店交互键
  private speedKey!: Phaser.Input.Keyboard.Key; // 快进切换键
  private hudScene?: UIScene; // UI场景引用
  private pendingTimeState?: ReturnType<TimeSystem['serialize']>; // 待恢复时间数据
  private pendingShopState?: ReturnType<ShopStore['toJSON']>; // 待恢复商店数据
  private shopNpc?: Phaser.GameObjects.Rectangle; // 商店NPC占位
  private shopNpcPosition: Phaser.Math.Vector2 = new Phaser.Math.Vector2(5 * TILE_SIZE, 4 * TILE_SIZE); // 商店NPC位置
  private questStore: QuestStore = new QuestStore(); // 任务存储实例
  private questTriggers?: QuestTriggers; // 任务触发器引用
  private questTracker?: QuestTracker; // 任务追踪器引用
  private questJournal?: QuestJournal; // 任务日志界面引用
  private journalKey!: Phaser.Input.Keyboard.Key; // 任务日志按键引用
  private pendingQuestState?: ReturnType<QuestStore['toJSON']>; // 待恢复的任务状态
  private npcPositions: Record<string, { x: number; y: number }> = {}; // NPC位置映射
  private rewardedQuests: Set<string> = new Set(); // 已发放奖励的任务集合
  private questReady = false; // 任务系统是否初始化完成
  private shiftPressed = false; // 是否按住Shift
  private shiftSuppressed = false; // Shift是否已作为修饰键使用
  private playerSpeed = 80; // 玩家移动速度
  private dialogueLines: string[] = ['这棵树看起来很结实。', '按 Z 采集木头并体验对话提示。', '按 A 自动播放，按 S 跳过当前段落。']; // 对话脚本
  private dialogueIndex = 0; // 当前对话索引
  private dialogueActive = false; // 是否处于对话状态
  private dialogueElapsed = 0; // 当前段落耗时
  private dialogueSprite?: Phaser.GameObjects.Image; // 对话精灵引用
  private dialogueTextureKey?: string; // 对话纹理键
  private dialogueTriggered = false; // 是否已经触发过对话
  // 分隔注释 // 保持行有注释
  public constructor() { // 构造函数
    super('WorldScene'); // 调用父类构造并设定场景键名
    this.shopStore = new ShopStore(); // 创建商店仓库
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public create(): void { // 场景创建时调用
    this.mapData = genDemoMap(10, 10); // 生成演示地图
    this.renderMap(); // 渲染瓦片
    this.createPlayer(); // 创建玩家实体
    this.labelManager = new LabelManager(this); // 初始化提示管理器
    this.popupManager = new PopupManager(this); // 初始化飘字管理器
    this.achievementManager = new AchievementManager((def) => { // 初始化成就管理器并配置回调
      this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE, `达成：${def.name}`, '#ffdd66'); // 弹出提示
    }); // 回调结束
    void this.initAchievements(); // 异步加载成就数据
    this.setupInput(); // 配置输入
    this.setupEconomyAndTime(); // 初始化经济与时间
    this.launchUIScene(); // 启动UI场景
    this.createHUD(); // 创建界面
    void this.initQuests(); // 初始化任务系统
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private async initAchievements(): Promise<void> { // 初始化成就数据
    await this.achievementManager.loadDefs(this); // 加载成就定义
    await this.achievementManager.load(); // 载入持久化状态
    if (this.pendingAchievementState) { // 如果有待应用的状态
      this.achievementManager.importState(this.pendingAchievementState); // 应用状态
      this.pendingAchievementState = undefined; // 清除缓存
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private async initQuests(): Promise<void> { // 初始化任务系统
    await this.questStore.loadDefs(this); // 加载任务定义
    if (this.pendingQuestState) { // 如果存在待恢复的进度
      const defs = this.questStore.listAll(); // 拷贝任务定义
      this.questStore = QuestStore.fromJSON(this.pendingQuestState, defs); // 使用存档恢复任务状态
      this.pendingQuestState = undefined; // 清除缓存
    } // 条件结束
    this.questStore.startIfNeeded(); // 自动启动需要的任务
    this.setupQuestRuntime(); // 构建运行时组件
    this.questReady = true; // 标记任务系统已准备
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private setupQuestRuntime(): void { // 构建任务运行期组件
    this.rewardedQuests = new Set(this.questStore.listVisible().filter((entry) => entry.prog.status === 'completed').map((entry) => entry.def.id)); // 记录已完成任务
    this.questTriggers = new QuestTriggers(this.questStore, (questId, completed) => this.onQuestUpdated(questId, completed)); // 创建触发器
    this.questTracker?.destroy(); // 销毁旧追踪器
    this.questTracker = new QuestTracker(this, this.questStore); // 创建新追踪器
    this.questTracker.setPlayer(() => this.getPlayerGrid()); // 提供玩家位置
    this.questTracker.setNpcLocator((npcId) => this.npcPositions[npcId]); // 提供NPC位置
    if (this.questJournal) { // 如果已有日志界面
      if (this.questJournal.isOpen()) { // 如果界面正在打开
        this.questJournal.close(); // 先关闭界面
      } // 条件结束
      this.questJournal.destroy(); // 销毁旧容器
    } // 条件结束
    this.questJournal = new QuestJournal(this, this.questStore); // 创建新的日志界面
    this.questJournal.setVisible(false); // 默认保持隐藏
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private onQuestUpdated(questId: string, completed: boolean): void { // 处理任务更新
    if (completed) { // 如果任务完成
      if (this.rewardedQuests.has(questId)) { // 如果已经发放奖励
        this.questJournal?.refresh(); // 刷新界面并返回
        return; // 避免重复处理
      } // 条件结束
      const definition = this.questStore.getDefinition(questId); // 读取任务定义
      if (!definition) { // 如果定义缺失
        return; // 无法处理
      } // 条件结束
      this.rewardedQuests.add(questId); // 记录已奖励
      const rewards = definition.rewards; // 读取奖励
      if (rewards?.gold) { // 如果有金币奖励
        this.inventory.add(GOLD_ITEM_ID, GOLD_ITEM_NAME, rewards.gold); // 增加金币
      } // 条件结束
      rewards?.items?.forEach((item) => { // 遍历物品奖励
        this.inventory.add(item.id, item.name, item.count); // 添加物品
      }); // 遍历结束
      if (rewards?.achievement) { // 如果包含成就
        this.achievementManager.unlock(rewards.achievement); // 解锁成就
      } // 条件结束
      this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE, `任务完成：${definition.title}`, '#ffdd66'); // 显示完成提示
    } // 条件结束
    this.questJournal?.refresh(); // 刷新任务日志
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private queueQuestState(state: ReturnType<QuestStore['toJSON']> | undefined): void { // 缓存或应用任务状态
    if (!state) { // 如果没有状态
      return; // 直接返回
    } // 条件结束
    if (!this.questReady) { // 如果任务系统尚未初始化
      this.pendingQuestState = state; // 缓存等待
      return; // 结束处理
    } // 条件结束
    const defs = this.questStore.listAll(); // 复制当前任务定义
    this.questStore = QuestStore.fromJSON(state, defs); // 使用存档恢复
    this.questStore.startIfNeeded(); // 重新自动接取
    this.setupQuestRuntime(); // 重建运行期组件
    this.questReady = true; // 保持就绪标记
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private setupEconomyAndTime(): void { // 初始化经济与时间系统
    if (this.pendingShopState) { // 如果有待恢复商店数据
      this.shopStore = ShopStore.fromJSON(this.pendingShopState); // 使用存档恢复商店
      this.pendingShopState = undefined; // 清除缓存
    } else { // 否则
      this.shopStore.initDefaultShops(); // 初始化默认商店
    } // 条件结束
    this.shopService = new ShopService(this.shopStore, this.inventory, this.popupManager); // 创建商店服务
    const defaultShop = this.shopStore.getShop(DEFAULT_SHOP_ID); // 获取默认商店
    if (defaultShop) { // 如果存在默认商店
      this.shopUI?.destroy(); // 销毁旧界面
      this.shopUI = new ShopUI(this, this.shopService, defaultShop); // 创建商店界面
      this.shopUI.close(); // 关闭界面
      this.shopUI.refreshData(); // 刷新界面
    } // 条件结束
    this.createShopNpc(); // 创建NPC占位
    this.timeSystem = new TimeSystem(this); // 创建时间系统
    if (this.pendingTimeState) { // 如果有待恢复时间
      this.timeSystem.restore(this.pendingTimeState); // 恢复时间状态
      this.pendingTimeState = undefined; // 清除缓存
    } // 条件结束
    this.timeSystem.onNewDay((state) => this.onNewDayArrived(state)); // 注册新日回调
    this.timeSystem.onNewSeason((state) => this.onNewSeasonArrived(state)); // 注册新季节回调
    this.timeScaleBoost = new TimeScaleBoost(this); // 创建快进控制
    this.timeSystem.applyTintTo(this); // 应用初始昼夜色调
    this.updateHudTime(); // 更新HUD显示
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private launchUIScene(): void { // 启动UI场景并绑定
    this.scene.launch('UIScene'); // 启动UI场景
    const uiScene = this.scene.get('UIScene') as UIScene; // 获取UI场景实例
    uiScene.events.once('ui-ready', () => { // 监听UI准备事件
      this.hudScene = uiScene; // 保存UI场景引用
      this.autoController = uiScene.getAutoCtrl(); // 获取自动控制器
      this.uiVisibility = uiScene.getUIVisibility(); // 获取显隐管理器
      uiScene.attachTimeScale(this.timeScaleBoost); // 在HUD绘制倍率图标
      this.updateHudTime(); // 初始化时间显示
      if (this.pendingUISettings) { // 如果存在待应用UI设置
        this.applyUISettings(this.pendingUISettings); // 应用设置
        this.pendingUISettings = undefined; // 清空缓存
      } // 条件结束
    }); // 监听结束
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
    this.glossaryKey = this.input.keyboard.addKey(KEY_GLOSSARY); // 创建图鉴键
    this.achievementKey = this.input.keyboard.addKey(KEY_ACHIEVEMENT); // 创建成就键
    this.achievementKey.on('down', (event: KeyboardEvent) => { // 绑定成就键事件
      if (event.shiftKey) { // 如果按下Shift
        return; // 避免与隐藏冲突
      } // 条件结束
      this.openAchievementScene(); // 打开成就界面
    }); // 监听结束
    this.glossaryKey.on('down', () => { // 绑定图鉴键事件
      this.openGlossaryScene(); // 打开图鉴界面
    }); // 监听结束
    this.shopKey = this.input.keyboard.addKey(KEY_SHOP); // 创建商店键
    this.speedKey = this.input.keyboard.addKey(KEY_SPEED_TOGGLE); // 创建倍率键
    this.speedKey.on('down', () => { // 监听Shift按下
      this.shiftPressed = true; // 标记按下状态
      this.shiftSuppressed = false; // 重置修饰标记
    }); // 监听结束
    this.speedKey.on('up', () => { // 监听Shift抬起
      this.shiftPressed = false; // 清除按下状态
      if (!this.shiftSuppressed) { // 如果未被其他键使用
        this.toggleSpeedScale(); // 切换倍率
      } // 条件结束
    }); // 监听结束
    this.journalKey = this.input.keyboard.addKey(KEY_JOURNAL); // 创建任务日志键
    this.journalKey.on('down', () => { // 监听日志键按下
      this.toggleQuestJournal(); // 切换任务日志界面
    }); // 监听结束
    this.input.keyboard.on('keydown', (event: KeyboardEvent) => { // 监听任意按键
      if (this.shiftPressed && event.key !== 'Shift') { // 如果Shift按下且按了其他键
        this.shiftSuppressed = true; // 标记为修饰键
      } // 条件结束
    }); // 监听结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private createHUD(): void { // 创建界面元素
    const source = this.registry.get('assetSource') as string | undefined; // 读取素材来源
    this.hudSourceText = this.add.text(8, 8, `素材来源：${source ?? '占位纹理'}`, { fontFamily: 'sans-serif', fontSize: '12px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.66)', padding: { x: 4, y: 2 } }); // 创建左上角文本
    this.hudSourceText.setDepth(1200); // 设置渲染深度
    this.hudControlsText = this.add.text(312, 312, 'Z 采集 / E 商店 / J 日志 / Shift 倍速 / A 自动 / S 保存或跳过 / L 读取 / G 图鉴 / H 成就', { fontFamily: 'sans-serif', fontSize: '12px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.66)', padding: { x: 4, y: 2 }, align: 'right' }); // 创建右下角提示
    this.hudControlsText.setOrigin(1, 1); // 设置锚点
    this.hudControlsText.setDepth(1200); // 设置深度
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public update(_: number, delta: number): void { // 每帧更新
    const speedScale = this.timeScaleBoost ? this.timeScaleBoost.getScale() : 1; // 获取当前倍率
    if (this.timeSystem) { // 如果时间系统存在
      this.timeSystem.update(delta, speedScale); // 推进时间
      this.timeSystem.applyTintTo(this); // 更新昼夜色调
      this.updateHudTime(); // 刷新HUD
    } // 条件结束
    const shopOpened = this.shopUI?.isOpen() ?? false; // 判断商店是否打开
    const journalOpened = this.questJournal?.isOpen() ?? false; // 判断任务日志是否打开
    if (!shopOpened && !journalOpened) { // 如果商店和日志均未打开
      this.handleMovement(delta); // 更新移动
      this.handleInteractionInput(); // 处理采集按键
      this.updateResourceHint(); // 更新提示
    } else { // 否则
      this.labelManager.hideAll(); // 隐藏提示
    } // 条件结束
    if (!journalOpened) { // 如果任务日志未打开
      this.handleShopInteraction(); // 处理商店交互
    } // 条件结束
    this.handleSaveLoadInput(); // 处理存读按键
    this.updateDialogue(delta); // 更新对话状态
    this.popupManager.update(delta); // 更新飘字动画
    this.questTracker?.update(); // 更新任务追踪提示
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private handleMovement(delta: number): void { // 处理玩家移动
    if (this.shopUI?.isOpen()) { // 如果商店打开
      return; // 直接阻止移动
    } // 条件结束
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
    const grid = this.getPlayerGrid(); // 读取玩家网格
    this.questTriggers?.onReach(grid.x, grid.y); // 通知任务触达事件
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
    if (this.shopUI?.isOpen()) { // 如果商店打开
      return; // 阻止采集
    } // 条件结束
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
    this.achievementManager.onCollect(node.loot.id, node.loot.count); // 通知成就系统
    this.questTriggers?.onCollect(node.loot.id, node.loot.count); // 通知任务系统采集事件
    removeNodeAt(grid); // 移除节点
    this.mapData[grid.y][grid.x] = { type: 'GRASS', layerTag: 'ground' }; // 将格子恢复为草地
    this.updateTileTexture(grid.x, grid.y); // 更新瓦片显示
    this.labelManager.hideAll(); // 隐藏提示
    this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE / 2, `+${node.loot.count} ${node.loot.name}`, node.type === 'TREE' ? '#88ff88' : node.type === 'ROCK' ? '#ccccff' : '#ff99ff'); // 显示飘字
    if (!this.dialogueTriggered && node.type === 'TREE') { // 如果第一次采集树木
      this.dialogueTriggered = true; // 标记已触发
      this.startDialogue(); // 开始对话
    } // 条件结束
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
  private updateResourceHint(): void { // 更新交互提示
    if (this.shopUI?.isOpen()) { // 如果商店打开
      this.labelManager.hideAll(); // 隐藏提示
      return; // 直接返回
    } // 条件结束
    if (this.isNearShop()) { // 如果靠近商店
      this.labelManager.showHintAt(this.playerContainer.x, this.playerContainer.y - this.playerSprite.displayHeight, '按 E 打开商店'); // 显示商店提示
      return; // 结束处理
    } // 条件结束
    const grid = this.getPlayerGrid(); // 获取玩家位置
    const node = getNodeAt(grid); // 查找节点
    if (node) { // 如果存在
      this.labelManager.showHintAt(this.playerContainer.x, this.playerContainer.y - this.playerSprite.displayHeight, '按 Z 采集'); // 显示提示
    } else { // 否则
      this.labelManager.hideAll(); // 隐藏提示
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private toggleQuestJournal(): void { // 切换任务日志界面
    if (!this.questJournal) { // 如果日志尚未准备
      return; // 不处理
    } // 条件结束
    if (this.questJournal.isOpen()) { // 如果界面已打开
      this.questJournal.close(); // 关闭界面
    } else { // 否则
      this.shopUI?.close(); // 关闭商店界面避免冲突
      this.questJournal.refresh(); // 打开前刷新内容
      this.questJournal.open(); // 打开任务日志
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private handleShopInteraction(): void { // 处理商店交互
    if (!this.shopUI || !this.shopKey) { // 如果商店未初始化
      return; // 直接返回
    } // 条件结束
    if (this.shopUI.isOpen()) { // 如果界面已打开
      if (Phaser.Input.Keyboard.JustDown(this.shopKey)) { // 如果按下商店键
        this.shopUI.close(); // 关闭商店
      } // 条件结束
      return; // 结束处理
    } // 条件结束
    if (!this.isNearShop()) { // 如果不在商店范围内
      return; // 直接返回
    } // 条件结束
    if (Phaser.Input.Keyboard.JustDown(this.shopKey)) { // 如果按键触发
      this.shopUI.refreshData(); // 刷新显示数据
      this.shopUI.open(); // 打开界面
      this.questTriggers?.onTalk('shopkeeper'); // 通知任务系统对话事件
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private isNearShop(): boolean { // 判断是否靠近商店
    const distance = Phaser.Math.Distance.Between(this.playerContainer.x, this.playerContainer.y, this.shopNpcPosition.x, this.shopNpcPosition.y); // 计算距离
    return distance <= TILE_SIZE * 1.5; // 返回是否在范围内
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private createShopNpc(): void { // 创建商店NPC占位
    this.shopNpc?.destroy(); // 销毁旧精灵
    const npc = this.add.rectangle(this.shopNpcPosition.x, this.shopNpcPosition.y, TILE_SIZE, TILE_SIZE * 1.4, 0xffaa55, 0.85); // 创建矩形
    npc.setOrigin(0.5, 1); // 设置锚点
    npc.setDepth(450); // 设置渲染深度
    this.shopNpc = npc; // 保存引用
    this.npcPositions.shopkeeper = { x: Math.round(this.shopNpcPosition.x / TILE_SIZE), y: Math.round(this.shopNpcPosition.y / TILE_SIZE) }; // 记录商店NPC网格位置
    this.questTracker?.setNpcLocator((npcId) => this.npcPositions[npcId]); // 更新追踪器NPC定位
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private toggleSpeedScale(): void { // 切换时间倍率
    this.timeScaleBoost.toggle(); // 切换倍率
    this.updateHudTime(); // 更新HUD
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private updateHudTime(): void { // 更新HUD时间显示
    if (this.hudScene && this.timeSystem) { // 如果HUD和时间存在
      this.hudScene.updateTimeDisplay(this.timeSystem.getState(), this.timeScaleBoost.getScale()); // 通知UI场景
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private onNewDayArrived(state: TimeState): void { // 处理新的一天
    this.shopStore.restockAll({ day: state.day, weekDay: state.weekDay }); // 执行补货
    this.shopUI?.refreshData(); // 刷新界面数据
    this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE, '新的一天开始', '#ffffff'); // 显示提示
    this.updateHudTime(); // 更新HUD
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private onNewSeasonArrived(state: TimeState): void { // 处理新季节
    const seasonNames: Record<TimeState['season'], string> = { spring: '春季', summer: '夏季', autumn: '秋季', winter: '冬季' }; // 季节名称映射
    const name = seasonNames[state.season]; // 读取名称
    this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE * 1.5, `进入${name}`, '#66ccff'); // 显示提示
    this.updateHudTime(); // 更新HUD
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private handleSaveLoadInput(): void { // 处理存档读取逻辑
    if (Phaser.Input.Keyboard.JustDown(this.saveKey)) { // 当按下S键
      if (this.dialogueActive) { // 如果正在对话
        if (this.autoController?.isSkip()) { // 如果已在跳过模式
          this.autoController.disableSkip(); // 关闭跳过
        } else { // 否则
          this.autoController?.enableSkip(); // 开启跳过
          this.advanceDialogue(); // 立即推进
        } // 条件结束
        return; // 阻止保存
      } // 条件结束
      void this.saveGame(); // 执行保存
    } // 条件结束
    if (Phaser.Input.Keyboard.JustDown(this.loadKey)) { // 当按下读取键
      void this.loadGame(); // 执行读取
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private async saveGame(): Promise<void> { // 保存游戏状态
    const questSnapshot = this.questReady ? this.questStore.toJSON() : undefined; // 读取任务进度快照
    const extras = { achievements: this.achievementManager.exportState(), uiSettings: this.collectUISaveSettings(), time: this.timeSystem.serialize(), shops: this.shopStore.toJSON(), quests: questSnapshot }; // 构建额外数据
    const state = buildState({ map: this.mapData }, { x: this.playerContainer.x, y: this.playerContainer.y }, this.inventory, extras); // 构建状态
    await save('slot', state); // 保存状态
    if (!this.achievementManager.isUnlocked('first_save')) { // 如果成就未解锁
      this.achievementManager.onEvent('save_once'); // 触发成就
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private async loadGame(): Promise<void> { // 读取游戏状态
    const data = (await load('slot')) as GameSaveState | null; // 读取存档
    if (!data) { // 如果没有数据
      return; // 直接返回
    } // 条件结束
    applyState(data, { setMapData: (map) => this.setMapData(map) }, { setPosition: (x, y) => this.setPlayerPosition(x, y) }, this.inventory, { applyAchievements: (payload) => this.applyAchievementState(payload), applyUISettings: (settings) => this.queueUISettings(settings), applyTime: (timeState) => this.queueTimeState(timeState), applyShops: (shops) => this.queueShopState(shops), applyQuests: (quests) => this.queueQuestState(quests) }); // 应用状态
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private setMapData(map: TileCell[][]): void { // 设置地图数据
    this.mapData = map.map((row) => row.map((cell) => ({ ...cell }))); // 拷贝地图
    this.renderMap(); // 重新渲染
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private setPlayerPosition(x: number, y: number): void { // 设置玩家位置
    this.playerContainer.setPosition(x, y); // 更新容器
    this.updatePlayerDepth(); // 更新深度
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private collectUISaveSettings(): UISaveSettings { // 收集UI设置
    const auto = this.autoController?.isAuto() ?? false; // 读取自动状态
    const skip = this.autoController?.isSkip() ?? false; // 读取跳过状态
    const hidden = this.uiVisibility?.isHidden() ?? false; // 读取隐藏状态
    return { auto, skip, hidden }; // 返回结构
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private queueUISettings(settings: UISaveSettings | undefined): void { // 应用或缓存UI设置
    if (!settings) { // 如果没有设置
      return; // 直接返回
    } // 条件结束
    if (this.autoController && this.uiVisibility) { // 如果UI已准备
      this.applyUISettings(settings); // 直接应用
    } else { // 否则
      this.pendingUISettings = settings; // 缓存等待
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private queueTimeState(state: ReturnType<TimeSystem['serialize']> | undefined): void { // 缓存或应用时间状态
    if (!state) { // 如果没有数据
      return; // 直接返回
    } // 条件结束
    if (this.timeSystem) { // 如果时间系统已初始化
      this.timeSystem.restore(state); // 恢复时间
      this.updateHudTime(); // 更新HUD
    } else { // 否则
      this.pendingTimeState = state; // 缓存等待
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private queueShopState(snapshot: ReturnType<ShopStore['toJSON']> | undefined): void { // 缓存或应用商店状态
    if (!snapshot) { // 如果没有数据
      return; // 直接返回
    } // 条件结束
    this.pendingShopState = snapshot; // 缓存数据
    if (this.shopService) { // 如果商店系统已初始化
      this.shopStore = ShopStore.fromJSON(snapshot); // 恢复商店
      this.shopService = new ShopService(this.shopStore, this.inventory, this.popupManager); // 重建服务
      const defaultShop = this.shopStore.getShop(DEFAULT_SHOP_ID); // 获取默认商店
      if (defaultShop) { // 如果存在
        this.shopUI?.destroy(); // 销毁旧界面
        this.shopUI = new ShopUI(this, this.shopService, defaultShop); // 创建新界面
        this.shopUI.close(); // 关闭界面
        this.shopUI.refreshData(); // 刷新数据
      } // 条件结束
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private applyUISettings(settings: UISaveSettings): void { // 实际应用UI设置
    if (this.autoController) { // 如果控制器存在
      if (settings.skip) { // 如果保存为跳过
        this.autoController.enableSkip(); // 启用跳过
      } else if (settings.auto) { // 如果保存为自动
        this.autoController.disableSkip(); // 关闭跳过
        this.autoController.enableAuto(); // 启用自动
      } else { // 否则
        this.autoController.disableSkip(); // 关闭跳过
        this.autoController.disableAuto(); // 关闭自动
      } // 条件结束
    } // 条件结束
    if (this.uiVisibility) { // 如果存在显隐管理器
      if (settings.hidden) { // 如果隐藏
        this.uiVisibility.hideAll(10); // 立刻隐藏
      } else { // 否则
        this.uiVisibility.showAll(10); // 立刻显示
      } // 条件结束
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private applyAchievementState(payload: unknown): void { // 应用成就数据
    const state = payload as AchievementSave | undefined; // 尝试转换
    if (!state) { // 如果没有数据
      return; // 直接返回
    } // 条件结束
    if (this.achievementManager) { // 如果管理器已存在
      this.achievementManager.importState(state); // 应用状态
    } else { // 否则
      this.pendingAchievementState = state; // 缓存等待
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private startDialogue(): void { // 开启示例对话
    this.dialogueActive = true; // 标记状态
    this.dialogueIndex = 0; // 重置索引
    this.dialogueElapsed = 0; // 重置时间
    this.showDialogueLine(); // 显示第一句
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private showDialogueLine(): void { // 展示当前对话行
    const text = this.dialogueLines[this.dialogueIndex]; // 获取文本
    if (!text) { // 如果文本不存在
      this.endDialogue(); // 结束对话
      return; // 直接返回
    } // 条件结束
    if (this.dialogueTextureKey) { // 如果存在旧纹理
      this.textures.remove(this.dialogueTextureKey); // 移除旧纹理
    } // 条件结束
    const key = renderTextToTexture(this, text, { fontSize: 12, color: '#ffffff', padding: 6, maxWidth: 160, align: 'left' }, 'dialogue'); // 生成纹理
    this.dialogueTextureKey = key; // 保存键名
    this.dialogueSprite?.destroy(); // 销毁旧精灵
    this.dialogueSprite = this.add.image(this.playerContainer.x, this.playerContainer.y - TILE_SIZE, key); // 创建新精灵
    this.dialogueSprite.setOrigin(0.5, 1); // 设置锚点
    this.dialogueSprite.setDepth(1300); // 设置深度
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private advanceDialogue(): void { // 推进对话
    this.dialogueIndex += 1; // 递增索引
    this.dialogueElapsed = 0; // 重置时间
    if (this.dialogueIndex >= this.dialogueLines.length) { // 如果超出脚本
      this.endDialogue(); // 结束对话
    } else { // 否则
      this.showDialogueLine(); // 显示下一句
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private endDialogue(): void { // 结束对话
    this.dialogueActive = false; // 更新状态
    this.dialogueElapsed = 0; // 重置时间
    this.dialogueSprite?.destroy(); // 销毁精灵
    this.dialogueSprite = undefined; // 清空引用
    if (this.dialogueTextureKey) { // 如果存在纹理
      this.textures.remove(this.dialogueTextureKey); // 移除纹理
      this.dialogueTextureKey = undefined; // 清空引用
    } // 条件结束
    this.autoController?.disableSkip(); // 对话结束关闭跳过
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private updateDialogue(delta: number): void { // 更新对话逻辑
    if (!this.dialogueActive) { // 如果不在对话中
      return; // 直接返回
    } // 条件结束
    this.dialogueElapsed += delta; // 累计时间
    if (this.autoController && this.dialogueLines[this.dialogueIndex]) { // 如果有控制器与文本
      if (this.autoController.shouldAdvance(this.dialogueElapsed, this.dialogueLines[this.dialogueIndex])) { // 判断是否推进
        this.advanceDialogue(); // 推进对话
      } // 条件结束
    } // 条件结束
    if (this.dialogueSprite) { // 如果有精灵
      this.dialogueSprite.setPosition(this.playerContainer.x, this.playerContainer.y - TILE_SIZE); // 跟随玩家
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private openGlossaryScene(): void { // 打开图鉴场景
    this.scene.pause(); // 暂停世界
    this.scene.launch('GlossaryScene'); // 启动图鉴
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private openAchievementScene(): void { // 打开成就场景
    this.scene.pause(); // 暂停世界
    this.scene.launch('AchievementScene', { manager: this.achievementManager }); // 启动成就场景
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private pendingAchievementState?: AchievementSave; // 缓存成就状态
} // 类结束
