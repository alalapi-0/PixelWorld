import type Phaser from 'phaser'; // 引入Phaser类型声明

export interface CharacterDefinition { // 定义角色配置接口
  id: string; // 角色唯一ID
  name: string; // 角色显示名称
  avatar: string; // 角色头像资源键
  startPos: { x: number; y: number }; // 角色出生坐标
  inventory: Record<string, number>; // 角色初始背包
} // 接口结束

export interface SaveData { // 定义存档数据接口
  player: { id: string; pos: { x: number; y: number }; inventory: Record<string, number> }; // 玩家部分
  world: { changes: Array<{ x: number; y: number; tile: string }> }; // 世界部分
  timestamp: number; // 存档时间戳
} // 接口结束

const CHARACTER_PATH = 'assets/ui/characters.json'; // 定义角色配置文件路径
const SAVE_PREFIX = 'player_'; // 定义存档文件前缀
const LOCAL_STORAGE_KEY = 'pixelworld_current_save'; // 定义本地存储键名
const LOCAL_SLOT_KEY = 'pixelworld_current_slot'; // 定义当前角色槽位键名

export class SaveManager { // 定义存档管理器类
  private static cachedCharacters?: CharacterDefinition[]; // 缓存角色列表
  private static cachedSave?: SaveData; // 缓存当前存档

  public static async loadCharacters(loader?: Phaser.Loader.LoaderPlugin): Promise<CharacterDefinition[]> { // 加载角色配置方法
    if (this.cachedCharacters) { // 如果已有缓存
      return this.cachedCharacters; // 直接返回缓存
    } // 条件结束
    if (loader) { // 如果提供Phaser加载器
      loader.setPath(''); // 重置加载路径
      loader.json('character_defs', CHARACTER_PATH); // 使用加载器加载JSON
      await new Promise<void>((resolve) => loader.once(Phaser.Loader.Events.COMPLETE, () => resolve())); // 等待加载完成
      const data = loader.scene.cache.json.get('character_defs') as CharacterDefinition[]; // 从缓存读取数据
      this.cachedCharacters = data; // 缓存数据
      return data; // 返回结果
    } // 条件结束
    const response = await fetch(CHARACTER_PATH); // 使用fetch加载JSON
    const data = (await response.json()) as CharacterDefinition[]; // 解析JSON
    this.cachedCharacters = data; // 缓存数据
    return data; // 返回结果
  } // 方法结束

  public static async createNewSave(characterId: string): Promise<SaveData> { // 创建新存档方法
    const characters = await this.loadCharacters(); // 加载角色配置
    const target = characters.find((c) => c.id === characterId); // 查找目标角色
    if (!target) { // 如果角色不存在
      throw new Error(`未找到角色 ${characterId}`); // 抛出错误
    } // 条件结束
    const save: SaveData = { // 构造存档对象
      player: { id: target.id, pos: { ...target.startPos }, inventory: { ...target.inventory } }, // 初始化玩家数据
      world: { changes: [] }, // 初始化世界数据
      timestamp: Date.now(), // 记录时间戳
    }; // 存档对象结束
    this.cachedSave = save; // 缓存新存档
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(save)); // 将存档写入本地存储
    localStorage.setItem(LOCAL_SLOT_KEY, `${SAVE_PREFIX}${target.id}`); // 记录当前槽位名
    return save; // 返回存档
  } // 方法结束

  public static loadLatestSave(): SaveData | undefined { // 加载最近存档方法
    if (this.cachedSave) { // 如果已有缓存
      return this.cachedSave; // 返回缓存
    } // 条件结束
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY); // 读取本地存储
    if (stored) { // 如果存在存档
      try { // 尝试解析
        const parsed = JSON.parse(stored) as SaveData; // 解析JSON
        this.cachedSave = parsed; // 缓存存档
        return parsed; // 返回结果
      } catch (error) { // 捕获解析错误
        console.error('解析本地存档失败', error); // 输出错误
      } // 错误处理结束
    } // 条件结束
    return undefined; // 默认返回未定义
  } // 方法结束

  public static updatePlayerPosition(x: number, y: number): void { // 更新玩家位置方法
    const save = this.loadLatestSave(); // 读取当前存档
    if (!save) { // 如果不存在
      return; // 直接返回
    } // 条件结束
    save.player.pos.x = x; // 更新X坐标
    save.player.pos.y = y; // 更新Y坐标
    save.timestamp = Date.now(); // 更新时间戳
    this.persist(); // 持久化存档
  } // 方法结束

  public static updateInventory(inventory: Record<string, number>): void { // 更新背包数据方法
    const save = this.loadLatestSave(); // 读取当前存档
    if (!save) { // 如果不存在
      return; // 直接返回
    } // 条件结束
    save.player.inventory = { ...inventory }; // 更新背包
    save.timestamp = Date.now(); // 更新时间戳
    this.persist(); // 持久化存档
  } // 方法结束

  public static appendWorldChange(change: { x: number; y: number; tile: string }): void { // 添加世界变更方法
    const save = this.loadLatestSave(); // 读取当前存档
    if (!save) { // 如果不存在
      return; // 直接返回
    } // 条件结束
    save.world.changes.push(change); // 将变更加入数组
    save.timestamp = Date.now(); // 更新时间戳
    this.persist(); // 持久化存档
  } // 方法结束

  public static persist(): void { // 持久化存档方法
    if (!this.cachedSave) { // 如果没有缓存
      return; // 不执行任何操作
    } // 条件结束
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.cachedSave)); // 写入本地存储
  } // 方法结束
} // 类结束
