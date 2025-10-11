import Phaser from 'phaser'; // 引入Phaser框架
import { KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT, KEY_INTERACT, KEY_SAVE, KEY_LOAD, KEY_GLOSSARY, KEY_ACHIEVEMENT, KEY_SHOP, KEY_SPEED_TOGGLE, KEY_JOURNAL, KEY_BUILD_MODE, KEY_BUILD_APPROVE, KEY_BUILD_REJECT, KEY_RESOURCE_BROWSER } from '../config/keys'; // 引入按键常量
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
import { Blueprints } from '../build/Blueprints'; // 引入蓝图管理器
import { BuildMenu } from '../build/BuildMenu'; // 引入建造菜单
import { Builder } from '../build/Builder'; // 引入建造执行器
import { UndoStack } from '../build/UndoStack'; // 引入撤销栈
import { canPlace } from '../build/BuildRules'; // 引入建造规则
import { Permissions } from '../build/Permissions'; // 引入权限系统
import { AgentAPI } from '../build/AgentAPI'; // 引入代理申请队列
import type { BuildSubsystemSave, MapDiffEntry } from '../systems/SaveLoad'; // 引入建造存档结构
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
  private resourceBrowserKey!: Phaser.Input.Keyboard.Key; // 资源浏览器快捷键
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
  private blueprints: Blueprints = new Blueprints(); // 蓝图管理器实例
  private buildMenu!: BuildMenu; // 建造菜单引用
  private undoStack: UndoStack = new UndoStack(); // 撤销栈实例
  private builder!: Builder; // 建造执行器引用
  private permissions: Permissions = new Permissions(); // 权限系统实例
  private agentAPI: AgentAPI = new AgentAPI(); // 代理申请队列实例
  private buildCursor?: Phaser.GameObjects.Rectangle; // 建造光标高亮
  private buildHover?: { x: number; y: number }; // 当前悬停格子
  private buildPointerHandler?: (pointer: Phaser.Input.Pointer) => void; // 建造模式指针按下处理
  private buildMoveHandler?: (pointer: Phaser.Input.Pointer) => void; // 建造模式指针移动处理
  private buildToggleKey!: Phaser.Input.Keyboard.Key; // 建造模式切换键
  private approveKey!: Phaser.Input.Keyboard.Key; // 审批通过键
  private rejectKey!: Phaser.Input.Keyboard.Key; // 审批拒绝键
  private agentTimer?: Phaser.Time.TimerEvent; // 代理申请定时器
  private pendingBuildState?: BuildSubsystemSave; // 待恢复的建造存档
  private baseMapSnapshot: TileCell[][] = []; // 基准地图快照
  // 分隔注释 // 保持行有注释
  public constructor() { // 构造函数
    super('WorldScene'); // 调用父类构造并设定场景键名
    this.shopStore = new ShopStore(); // 创建商店仓库
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public create(): void { // 场景创建时调用
    this.mapData = genDemoMap(10, 10); // 生成演示地图
    this.baseMapSnapshot = this.mapData.map((row) => row.map((cell) => ({ ...cell }))); // 保存基准地图
    if (this.pendingBuildState?.mapDiff) { // 如果存在地图差异
      this.applyMapDiff(this.pendingBuildState.mapDiff); // 应用差异
    } // 条件结束
    this.renderMap(); // 渲染瓦片
    this.createPlayer(); // 创建玩家实体
    this.labelManager = new LabelManager(this); // 初始化提示管理器
    this.popupManager = new PopupManager(this); // 初始化飘字管理器
    this.achievementManager = new AchievementManager((def) => { // 初始化成就管理器并配置回调
      this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE, `达成：${def.name}`, '#ffdd66'); // 弹出提示
    }); // 回调结束
    void this.initAchievements(); // 异步加载成就数据
    this.setupBuildSystems(); // 初始化建造系统
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
  private setupBuildSystems(): void { // 初始化建造系统
    this.buildMenu = new BuildMenu(this, this.blueprints, this.inventory); // 创建建造菜单
    this.buildCursor = this.add.rectangle(0, 0, TILE_SIZE, TILE_SIZE, 0x88ccff, 0.3); // 创建建造高亮
    this.buildCursor.setOrigin(0, 0); // 设置矩形原点
    this.buildCursor.setDepth(1100); // 提升高亮深度
    this.buildCursor.setVisible(false); // 默认隐藏高亮
    this.rebuildSystemsFromState(this.pendingBuildState); // 根据存档恢复建造系统
    this.pendingBuildState = undefined; // 清除待恢复数据
    void this.blueprints.load(this).then(() => { // 异步加载蓝图数据
      if (this.buildMenu) { // 确认菜单存在
        this.buildMenu.refresh(); // 刷新显示材料状态
        this.updateBuildHud(); // 同步HUD显示
      } // 条件结束
    }); // Promise结束
    this.scheduleAgentRequests(); // 启动代理申请定时任务
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private rebuildSystemsFromState(state: BuildSubsystemSave | undefined): void { // 根据存档重建建造子系统
    const permissionSave = state?.permissions ?? this.permissions.toJSON(); // 读取权限存档
    this.permissions = Permissions.fromJSON(permissionSave); // 恢复权限角色
    const undoSave = state?.undo ?? this.undoStack.toJSON(); // 读取撤销存档
    this.undoStack = UndoStack.fromJSON(undoSave); // 恢复撤销栈
    const agentSave = state?.agent ?? this.agentAPI.toJSON(); // 读取代理存档
    this.agentAPI = AgentAPI.fromJSON(agentSave); // 恢复代理队列
    this.builder = new Builder(this.mapData, this.inventory, this.undoStack); // 使用当前地图创建建造执行器
    this.buildMenu?.refresh(); // 刷新菜单材料状态
    this.updatePermissionHud(); // 更新权限HUD
    this.updateAgentHud(); // 更新审批HUD
    this.updateBuildHud(); // 更新建造HUD
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private applyMapDiff(diff: MapDiffEntry[]): void { // 应用地图差异
    diff.forEach((entry) => { // 遍历差异
      if (this.mapData[entry.y]?.[entry.x]) { // 如果坐标有效
        this.mapData[entry.y][entry.x] = { type: entry.tile, layerTag: entry.layerTag ?? 'ground' }; // 更新单元格
      } // 条件结束
    }); // 遍历结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private scheduleAgentRequests(): void { // 安排代理申请生成
    this.agentTimer?.remove(); // 移除旧定时器
    this.agentTimer = this.time.addEvent({ delay: 30000, loop: true, callback: () => this.spawnAgentRequest() }); // 创建新定时器
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private spawnAgentRequest(): void { // 生成模拟的代理申请
    const width = this.mapData[0]?.length ?? 0; // 读取地图宽度
    const height = this.mapData.length; // 读取地图高度
    if (width === 0 || height === 0) { // 如果地图无效
      return; // 直接返回
    } // 条件结束
    const x = Phaser.Math.Between(0, Math.max(0, width - 1)); // 随机选择列
    const baseRow = Phaser.Math.Clamp(5 + Phaser.Math.Between(-1, 1), 0, height - 1); // 在道路附近选择行
    this.agentAPI.submit({ x, y: baseRow, blueprintId: 'tree', reason: '道路绿化建议' }); // 创建树木种植申请
    this.updateAgentHud(); // 更新HUD待审批数量
    if (this.buildMenu?.isActive()) { // 如果处于建造模式
      this.buildMenu.setStatus('收到新的建造申请'); // 在菜单提示
    } // 条件结束
    this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE, '收到建造申请', '#66ccff'); // 显示通知
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
      this.updateBuildHud(); // 初始化建造HUD
      this.updatePermissionHud(); // 初始化权限HUD
      this.updateAgentHud(); // 初始化审批HUD
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
    this.resourceBrowserKey = this.input.keyboard.addKey(KEY_RESOURCE_BROWSER); // 创建资源浏览器键
    this.resourceBrowserKey.on('down', () => { // 监听资源浏览器键按下
      this.openResourceBrowser(); // 打开资源浏览器
    }); // 监听结束
    this.buildToggleKey = this.input.keyboard.addKey(KEY_BUILD_MODE); // 创建建造模式键
    this.buildToggleKey.on('down', () => { // 监听建造模式键按下
      this.toggleBuildMode(); // 切换建造模式
    }); // 监听结束
    this.approveKey = this.input.keyboard.addKey(KEY_BUILD_APPROVE); // 创建审批通过键
    this.approveKey.on('down', () => { // 监听通过键
      this.handleAgentDecision(true); // 执行通过处理
    }); // 监听结束
    this.rejectKey = this.input.keyboard.addKey(KEY_BUILD_REJECT); // 创建审批拒绝键
    this.rejectKey.on('down', () => { // 监听拒绝键
      this.handleAgentDecision(false); // 执行拒绝处理
    }); // 监听结束
    this.input.keyboard.on('keydown', (event: KeyboardEvent) => { // 监听任意按键
      if (this.shiftPressed && event.key !== 'Shift') { // 如果Shift按下且按了其他键
        this.shiftSuppressed = true; // 标记为修饰键
      } // 条件结束
    }); // 监听结束
    this.input.keyboard.on('keydown-Z', (event: KeyboardEvent) => { // 监听撤销组合键
      if (event.ctrlKey) { // 如果按下Ctrl
        event.preventDefault(); // 阻止浏览器默认行为
        this.performUndo(); // 执行撤销
      } // 条件结束
    }); // 监听结束
    this.input.keyboard.on('keydown-Y', (event: KeyboardEvent) => { // 监听重做组合键
      if (event.ctrlKey) { // 如果按下Ctrl
        event.preventDefault(); // 阻止默认行为
        this.performRedo(); // 执行重做
      } // 条件结束
    }); // 监听结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private createHUD(): void { // 创建界面元素
    const source = this.registry.get('assetSource') as string | undefined; // 读取素材来源
    this.hudSourceText = this.add.text(8, 8, `素材来源：${source ?? '占位纹理'}`, { fontFamily: 'sans-serif', fontSize: '12px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.66)', padding: { x: 4, y: 2 } }); // 创建左上角文本
    this.hudSourceText.setDepth(1200); // 设置渲染深度
    this.hudControlsText = this.add.text(312, 312, 'Z 采集 / U 建造 / Ctrl+Z 撤销 / Ctrl+Y 重做 / Y 审批 / N 拒绝 / E 商店 / J 日志 / Shift 倍速 / A 自动 / S 保存或跳过 / L 读取 / G 图鉴 / H 成就 / R 资源浏览器', { fontFamily: 'sans-serif', fontSize: '12px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.66)', padding: { x: 4, y: 2 }, align: 'right' }); // 创建右下角提示
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
    const buildActive = this.buildMenu?.isActive() ?? false; // 判断是否处于建造模式
    if (buildActive) { // 如果正在建造
      this.updateBuildPreview(); // 更新建造高亮
      if (Phaser.Input.Keyboard.JustDown(this.interactKey) && this.buildHover) { // 检查确认建造键
        this.tryPlaceAt(this.buildHover.x, this.buildHover.y); // 执行键盘放置
      } // 条件结束
    } // 条件结束
    if (!shopOpened && !journalOpened && !buildActive) { // 如果无界面干扰且不在建造模式
      this.handleMovement(delta); // 更新移动
      this.handleInteractionInput(); // 处理采集按键
      this.updateResourceHint(); // 更新提示
    } else if (!buildActive) { // 如果非建造但界面占用
      this.labelManager.hideAll(); // 隐藏提示
    } else { // 当建造模式激活
      this.labelManager.hideAll(); // 隐藏其它提示
    } // 条件结束
    if (!journalOpened && !buildActive) { // 如果任务日志未打开且非建造
      this.handleShopInteraction(); // 处理商店交互
    } // 条件结束
    this.handleSaveLoadInput(); // 处理存读按键
    this.updateDialogue(delta); // 更新对话状态
    this.popupManager.update(delta); // 更新飘字动画
    this.questTracker?.update(); // 更新任务追踪提示
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private handleMovement(delta: number): void { // 处理玩家移动
    if (this.buildMenu?.isActive()) { // 如果处于建造模式
      return; // 阻止移动
    } // 条件结束
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
    if (this.buildMenu?.isActive()) { // 如果在建造模式
      return; // 禁止采集操作
    } // 条件结束
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
    if (this.buildMenu?.isActive()) { // 如果正在建造
      this.labelManager.hideAll(); // 隐藏提示
      return; // 直接返回
    } // 条件结束
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
    if (this.buildMenu?.isActive()) { // 如果处于建造模式
      return; // 暂停商店交互
    } // 条件结束
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
    const buildExtras = { permissions: this.permissions.toJSON(), mapDiff: this.computeMapDiff(), undo: this.undoStack.toJSON(), agent: this.agentAPI.toJSON() }; // 构建建造额外数据
    const extras = { achievements: this.achievementManager.exportState(), uiSettings: this.collectUISaveSettings(), time: this.timeSystem.serialize(), shops: this.shopStore.toJSON(), quests: questSnapshot, build: buildExtras }; // 构建额外数据
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
    applyState(data, { setMapData: (map) => this.setMapData(map) }, { setPosition: (x, y) => this.setPlayerPosition(x, y) }, this.inventory, { applyAchievements: (payload) => this.applyAchievementState(payload), applyUISettings: (settings) => this.queueUISettings(settings), applyTime: (timeState) => this.queueTimeState(timeState), applyShops: (shops) => this.queueShopState(shops), applyQuests: (quests) => this.queueQuestState(quests), applyBuild: (buildState) => this.queueBuildState(buildState) }); // 应用状态
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private setMapData(map: TileCell[][]): void { // 设置地图数据
    if (this.pendingBuildState?.mapDiff) { // 如果存档包含差异
      const width = map[0]?.length ?? 0; // 读取宽度
      const height = map.length; // 读取高度
      const base = genDemoMap(width, height); // 生成基准地图
      this.baseMapSnapshot = base.map((row) => row.map((cell) => ({ ...cell }))); // 保存基准快照
      this.mapData = base.map((row) => row.map((cell) => ({ ...cell }))); // 克隆基准地图
      this.applyMapDiff(this.pendingBuildState.mapDiff); // 应用差异
    } else { // 否则直接使用存档地图
      this.mapData = map.map((row) => row.map((cell) => ({ ...cell }))); // 拷贝地图
      this.baseMapSnapshot = this.mapData.map((row) => row.map((cell) => ({ ...cell }))); // 同步基准快照
    } // 条件结束
    this.renderMap(); // 重新渲染
    this.rebuildSystemsFromState(this.pendingBuildState); // 根据最新数据重建系统
    this.pendingBuildState = undefined; // 清除待恢复状态
    this.scheduleAgentRequests(); // 重启代理计时器
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
  private queueBuildState(state: BuildSubsystemSave | undefined): void { // 缓存或应用建造状态
    if (this.buildMenu?.isActive()) { // 如果当前在建造模式
      this.exitBuildMode(); // 先退出建造模式
    } // 条件结束
    this.pendingBuildState = state ?? undefined; // 记录待恢复的建造存档
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private toggleBuildMode(): void { // 切换建造模式
    if (!this.buildMenu) { // 如果菜单尚未准备
      return; // 直接返回
    } // 条件结束
    if (this.buildMenu.isActive()) { // 如果已经在建造模式
      this.exitBuildMode(); // 退出模式
      return; // 结束处理
    } // 条件结束
    if (!this.permissions.canBuild()) { // 如果没有建造权限
      this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE, '无权建造', '#ff6666'); // 弹出提示
      return; // 阻止进入
    } // 条件结束
    if (this.blueprints.all().length === 0) { // 如果没有蓝图
      this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE, '蓝图数据缺失', '#ff6666'); // 提示缺失
      return; // 阻止进入
    } // 条件结束
    this.enterBuildMode(); // 进入建造模式
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private enterBuildMode(): void { // 进入建造模式
    this.buildMenu.enter(); // 打开建造菜单
    this.updateBuildHud(); // 更新HUD
    this.buildCursor?.setVisible(false); // 隐藏高亮等待移动
    this.buildPointerHandler = (pointer) => this.onBuildPointerDown(pointer); // 定义指针按下处理
    this.input.on('pointerdown', this.buildPointerHandler); // 注册按下事件
    this.buildMoveHandler = (pointer) => { this.buildHover = this.pointerToGrid(pointer) ?? undefined; }; // 定义指针移动处理
    this.input.on('pointermove', this.buildMoveHandler); // 注册移动事件
    this.labelManager.hideAll(); // 隐藏其他提示
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private exitBuildMode(): void { // 退出建造模式
    this.buildMenu.exit(); // 关闭建造菜单
    this.buildHover = undefined; // 清空悬停格
    if (this.buildCursor) { // 如果有高亮
      this.buildCursor.setVisible(false); // 隐藏高亮
    } // 条件结束
    if (this.buildPointerHandler) { // 如果存在按下处理器
      this.input.off('pointerdown', this.buildPointerHandler); // 移除监听
      this.buildPointerHandler = undefined; // 清空引用
    } // 条件结束
    if (this.buildMoveHandler) { // 如果存在移动处理器
      this.input.off('pointermove', this.buildMoveHandler); // 移除监听
      this.buildMoveHandler = undefined; // 清空引用
    } // 条件结束
    this.buildMenu.setStatus(''); // 清空状态提示
    this.updateBuildHud(); // 更新HUD
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private onBuildPointerDown(pointer: Phaser.Input.Pointer): void { // 处理建造模式下的指针按下
    if (!this.buildMenu.isActive()) { // 如果菜单未激活
      return; // 直接返回
    } // 条件结束
    const grid = this.pointerToGrid(pointer); // 计算网格坐标
    if (!grid) { // 如果不在地图范围
      return; // 直接返回
    } // 条件结束
    if (pointer.rightButtonDown()) { // 如果按下右键
      this.tryRemoveAt(grid.x, grid.y); // 执行拆除
    } else { // 否则视为放置
      this.tryPlaceAt(grid.x, grid.y); // 执行放置
    } // 分支结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private pointerToGrid(pointer: Phaser.Input.Pointer): { x: number; y: number } | null { // 将指针转换为网格
    const x = Math.floor(pointer.worldX / TILE_SIZE); // 计算列索引
    const y = Math.floor(pointer.worldY / TILE_SIZE); // 计算行索引
    return this.isInsideMap(x, y) ? { x, y } : null; // 返回坐标或空
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private isInsideMap(x: number, y: number): boolean { // 判断坐标是否在地图内
    return y >= 0 && y < this.mapData.length && x >= 0 && x < (this.mapData[0]?.length ?? 0); // 返回范围判断
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private updateBuildPreview(): void { // 更新建造高亮
    if (!this.buildMenu?.isActive() || !this.buildCursor) { // 如果不在建造模式或缺少高亮
      return; // 直接返回
    } // 条件结束
    const pointer = this.input.activePointer; // 获取当前指针
    const grid = this.pointerToGrid(pointer); // 计算网格
    if (!grid) { // 如果指针不在地图上
      this.buildCursor.setVisible(false); // 隐藏高亮
      this.buildHover = undefined; // 清空悬停
      return; // 结束处理
    } // 条件结束
    this.buildHover = grid; // 记录悬停格
    this.buildCursor.setVisible(true); // 显示高亮
    this.buildCursor.setPosition(grid.x * TILE_SIZE, grid.y * TILE_SIZE); // 设置位置
    const cell = this.mapData[grid.y][grid.x]; // 读取当前单元
    const neighbors = this.collectNeighbors(grid.x, grid.y); // 计算邻居
    const blueprint = this.buildMenu.currentBlueprint(); // 当前蓝图
    const rulePass = canPlace(blueprint, cell, neighbors); // 判断规则
    const costEnough = blueprint.cost.every((item) => this.inventory.has(item.id, item.count)); // 判断材料
    const color = rulePass ? (costEnough ? 0x55ff55 : 0xffaa33) : 0xff5555; // 根据状态选择颜色
    this.buildCursor.setFillStyle(color, 0.3); // 应用颜色
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private collectNeighbors(x: number, y: number): TileCell[] { // 收集四向邻居
    const fallback: TileCell = { type: 'GRASS', layerTag: 'ground' }; // 默认邻居
    const up = this.mapData[y - 1]?.[x] ?? fallback; // 上方单元
    const right = this.mapData[y]?.[x + 1] ?? fallback; // 右方单元
    const down = this.mapData[y + 1]?.[x] ?? fallback; // 下方单元
    const left = this.mapData[y]?.[x - 1] ?? fallback; // 左方单元
    return [up, right, down, left]; // 返回数组
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private tryPlaceAt(x: number, y: number): void { // 尝试放置建造
    const cell = this.mapData[y]?.[x]; // 读取目标格
    if (!cell) { // 如果格子不存在
      if (this.buildMenu.isActive()) { // 如果在建造模式
        this.buildMenu.setStatus('目标超出范围'); // 提示越界
      } // 条件结束
      return; // 结束处理
    } // 条件结束
    const blueprint = this.buildMenu.currentBlueprint(); // 获取当前蓝图
    const neighbors = this.collectNeighbors(x, y); // 计算邻居
    if (!canPlace(blueprint, cell, neighbors)) { // 如果规则不允许
      this.buildMenu.setStatus('该位置禁止放置'); // 显示提示
      return; // 阻止放置
    } // 条件结束
    if (!blueprint.cost.every((item) => this.inventory.has(item.id, item.count))) { // 如果材料不足
      this.buildMenu.setStatus('材料不足'); // 提示材料不足
      return; // 阻止放置
    } // 条件结束
    const success = this.builder.place(x, y, blueprint, neighbors); // 执行放置
    if (!success) { // 如果放置失败
      this.buildMenu.setStatus('放置失败'); // 显示失败提示
      return; // 结束处理
    } // 条件结束
    this.updateTileTexture(x, y); // 更新瓦片显示
    this.buildMenu.refresh(); // 刷新菜单
    this.updateBuildHud(); // 更新HUD
    this.popupManager.popup(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, `建造：${blueprint.name}`, '#66ff99'); // 显示提示
    this.buildMenu.setStatus(''); // 清空状态
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private tryRemoveAt(x: number, y: number): void { // 尝试拆除结构
    const success = this.builder.remove(x, y); // 执行拆除
    if (!success) { // 如果拆除失败
      if (this.buildMenu.isActive()) { // 如果在建造模式
        this.buildMenu.setStatus('该格无法拆除'); // 显示提示
      } // 条件结束
      return; // 结束处理
    } // 条件结束
    this.updateTileTexture(x, y); // 更新瓦片显示
    this.buildMenu.refresh(); // 刷新菜单
    this.updateBuildHud(); // 更新HUD
    this.popupManager.popup(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, '已拆除', '#ffaa66'); // 显示提示
    this.buildMenu.setStatus(''); // 清空状态
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private performUndo(): void { // 执行撤销操作
    const op = this.undoStack.undo(); // 从撤销栈取出操作
    if (!op) { // 如果没有操作
      if (this.buildMenu?.isActive()) { // 如果处于建造模式
        this.buildMenu.setStatus('没有可撤销操作'); // 提示无操作
      } // 条件结束
      return; // 结束处理
    } // 条件结束
    this.builder.applyUndo(op); // 让建造执行器还原状态
    this.updateTileTexture(op.x, op.y); // 更新瓦片显示
    this.buildMenu?.refresh(); // 刷新菜单
    this.updateBuildHud(); // 更新HUD
    if (this.buildMenu?.isActive()) { // 如果处于建造模式
      this.buildMenu.setStatus(''); // 清空提示
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private performRedo(): void { // 执行重做操作
    const op = this.undoStack.redo(); // 从重做栈取出操作
    if (!op) { // 如果没有操作
      if (this.buildMenu?.isActive()) { // 如果处于建造模式
        this.buildMenu.setStatus('没有可重做操作'); // 提示无操作
      } // 条件结束
      return; // 结束处理
    } // 条件结束
    if (op.kind === 'place' && !op.cost.every((item) => this.inventory.has(item.id, item.count))) { // 如果材料不足以重做
      void this.undoStack.undo(); // 将操作放回重做栈
      if (this.buildMenu?.isActive()) { // 如果处于建造模式
        this.buildMenu.setStatus('材料不足，无法重做'); // 显示提示
      } // 条件结束
      return; // 结束处理
    } // 条件结束
    this.builder.applyRedo(op); // 执行重做
    this.updateTileTexture(op.x, op.y); // 更新瓦片显示
    this.buildMenu?.refresh(); // 刷新菜单
    this.updateBuildHud(); // 更新HUD
    if (this.buildMenu?.isActive()) { // 如果处于建造模式
      this.buildMenu.setStatus(''); // 清空提示
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private handleAgentDecision(approve: boolean): void { // 处理代理审批
    if (!this.permissions.canApprove()) { // 如果没有审批权限
      this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE, '无权审批', '#ff6666'); // 显示提示
      return; // 阻止处理
    } // 条件结束
    const pending = this.agentAPI.nextPending(); // 读取待审批申请
    if (!pending) { // 如果没有待审批
      this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE, '暂无申请', '#ccccff'); // 显示提示
      return; // 结束处理
    } // 条件结束
    if (!approve) { // 如果选择拒绝
      this.agentAPI.reject(pending.id); // 标记拒绝
      this.updateAgentHud(); // 更新HUD
      this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE, '已拒绝申请', '#ff9966'); // 显示提示
      return; // 结束处理
    } // 条件结束
    const blueprint = this.blueprints.get(pending.blueprintId); // 获取蓝图
    if (!blueprint) { // 如果蓝图缺失
      this.agentAPI.reject(pending.id); // 标记拒绝
      this.updateAgentHud(); // 更新HUD
      this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE, '蓝图不存在', '#ff6666'); // 提示错误
      return; // 结束处理
    } // 条件结束
    const cell = this.mapData[pending.y]?.[pending.x]; // 读取目标格
    if (!cell) { // 如果超出范围
      this.agentAPI.reject(pending.id); // 标记拒绝
      this.updateAgentHud(); // 更新HUD
      this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE, '目标超出范围', '#ff6666'); // 提示错误
      return; // 结束处理
    } // 条件结束
    const neighbors = this.collectNeighbors(pending.x, pending.y); // 计算邻居
    if (!canPlace(blueprint, cell, neighbors)) { // 如果规则不通过
      this.agentAPI.reject(pending.id); // 标记拒绝
      this.updateAgentHud(); // 更新HUD
      this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE, '地点不符合要求', '#ff6666'); // 提示错误
      return; // 结束处理
    } // 条件结束
    if (!blueprint.cost.every((item) => this.inventory.has(item.id, item.count))) { // 如果材料不足
      this.agentAPI.reject(pending.id); // 标记拒绝
      this.updateAgentHud(); // 更新HUD
      this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE, '材料不足，审批失败', '#ff6666'); // 提示错误
      return; // 结束处理
    } // 条件结束
    this.agentAPI.approve(pending.id); // 标记通过
    const success = this.builder.place(pending.x, pending.y, blueprint, neighbors); // 执行建造
    if (success) { // 如果成功
      this.agentAPI.markExecuted(pending.id); // 标记已执行
      this.updateTileTexture(pending.x, pending.y); // 更新瓦片
      this.buildMenu?.refresh(); // 刷新菜单
      this.updateBuildHud(); // 更新HUD
      this.popupManager.popup(pending.x * TILE_SIZE + TILE_SIZE / 2, pending.y * TILE_SIZE + TILE_SIZE / 2, `已建造：${blueprint.name}`, '#66ff99'); // 提示完成
    } else { // 如果建造失败
      this.agentAPI.reject(pending.id); // 将状态改为拒绝
      this.popupManager.popup(this.playerContainer.x, this.playerContainer.y - TILE_SIZE, '执行失败', '#ff6666'); // 提示失败
    } // 分支结束
    this.updateAgentHud(); // 更新审批HUD
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private updateBuildHud(): void { // 更新建造HUD信息
    if (!this.hudScene) { // 如果HUD未初始化
      return; // 直接返回
    } // 条件结束
    const active = this.buildMenu?.isActive() ?? false; // 当前建造状态
    let name = '无蓝图'; // 默认蓝图名称
    const list = this.blueprints.all(); // 获取蓝图列表
    if (list.length > 0) { // 如果存在蓝图
      try { // 捕获可能的异常
        name = this.buildMenu.currentBlueprint().name; // 读取当前蓝图名称
      } catch { // 捕获异常
        name = list[0].name; // 回退到第一条蓝图
      } // 条件结束
    } // 条件结束
    this.hudScene.updateBuildStatus(active, name); // 更新HUD显示
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private updatePermissionHud(): void { // 更新权限显示
    this.hudScene?.updatePermissionRole(this.permissions.getRole()); // 将角色写入HUD
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private updateAgentHud(): void { // 更新审批队列HUD
    const pending = this.agentAPI.list().filter((req) => req.state === 'pending').length; // 统计待审批数量
    this.hudScene?.updateAgentQueue(pending); // 更新HUD
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private computeMapDiff(): MapDiffEntry[] { // 计算地图差异
    const diff: MapDiffEntry[] = []; // 初始化差异数组
    for (let y = 0; y < this.mapData.length; y += 1) { // 遍历行
      for (let x = 0; x < (this.mapData[y]?.length ?? 0); x += 1) { // 遍历列
        const current = this.mapData[y][x]; // 当前单元
        const base = this.baseMapSnapshot[y]?.[x]; // 基准单元
        if (!base || base.type !== current.type || base.layerTag !== current.layerTag) { // 如果不同
          diff.push({ x, y, tile: current.type, layerTag: current.layerTag }); // 记录差异
        } // 条件结束
      } // 列遍历结束
    } // 行遍历结束
    return diff; // 返回差异数组
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
  private openResourceBrowser(): void { // 打开资源浏览器
    this.scene.pause(); // 暂停世界
    this.scene.launch('ResourceBrowserScene'); // 启动资源浏览器
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private openAchievementScene(): void { // 打开成就场景
    this.scene.pause(); // 暂停世界
    this.scene.launch('AchievementScene', { manager: this.achievementManager }); // 启动成就场景
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private pendingAchievementState?: AchievementSave; // 缓存成就状态
} // 类结束
