import type Phaser from 'phaser'; // 引入Phaser类型声明
import { Stats } from '../actors/Stats'; // 引入角色属性类以生成默认值
import type { StatsSnapshot } from '../actors/Stats'; // 引入属性快照类型
import type { WeatherSnapshot } from '../time/WeatherSystem'; // 引入天气快照类型
import type { TimeState } from '../systems/TimeSystem'; // 引入时间状态类型
import type { NPCRelationshipState } from '../npc/RelationshipSystem'; // 引入好感状态类型
import type { FieldState } from '../farming/CropSystem'; // 引入田地状态类型
import type { FestivalState } from '../festival/FestivalManager'; // 引入节日存档类型
// 分隔注释 // 保持行有注释
export interface CharacterDefinition { // 定义角色配置接口
  id: string; // 角色唯一ID
  name: string; // 角色名称
  avatar: string; // 角色头像资源键
  startPos: { x: number; y: number }; // 角色出生位置
  inventory: Record<string, number>; // 初始背包
} // 接口结束
// 分隔注释 // 保持行有注释
export interface SaveData { // 定义存档数据接口
  player: { id: string; pos: { x: number; y: number }; inventory: Record<string, number>; stats?: StatsSnapshot }; // 玩家部分
  world: { changes: Array<{ x: number; y: number; tile: string }>; weather?: WeatherSnapshot; time?: TimeState }; // 世界部分
  timestamp: number; // 存档时间戳
  npcs?: Record<string, NPCRelationshipState>; // NPC 好感数据
  farming?: { fields: FieldState[] }; // 农田状态
  festival?: FestivalState; // 节日状态
} // 接口结束
// 分隔注释 // 保持行有注释
const CHARACTER_PATH = 'assets/ui/characters.json'; // 角色配置路径
const SAVE_PREFIX = 'player_'; // 存档前缀
const LOCAL_STORAGE_KEY = 'pixelworld_current_save'; // 当前存档键
const LOCAL_SLOT_KEY = 'pixelworld_current_slot'; // 当前槽位键
const DEFAULT_STATS: StatsSnapshot = new Stats().serialize(); // 生成默认属性快照
const DEFAULT_WEATHER: WeatherSnapshot = { state: 'clear', remainHours: 6 }; // 默认天气
const DEFAULT_TIME: TimeState = { minute: 0, hour: 6, day: 1, weekDay: 0, season: 'spring', year: 1 }; // 默认时间
// 分隔注释 // 保持行有注释
export class SaveManager { // 定义存档管理器类
  private static cachedCharacters?: CharacterDefinition[]; // 缓存角色列表
  private static cachedSave?: SaveData; // 缓存当前存档
  // 分隔注释 // 保持行有注释
  public static async loadCharacters(loader?: Phaser.Loader.LoaderPlugin): Promise<CharacterDefinition[]> { // 加载角色配置
    if (this.cachedCharacters) { // 如果已有缓存
      return this.cachedCharacters; // 直接返回
    } // 条件结束
    if (loader) { // 如果提供加载器
      loader.setPath(''); // 重置路径
      loader.json('character_defs', CHARACTER_PATH); // 请求JSON
      await new Promise<void>((resolve) => loader.once(Phaser.Loader.Events.COMPLETE, () => resolve())); // 等待完成
      const data = loader.scene.cache.json.get('character_defs') as CharacterDefinition[]; // 从缓存读取
      this.cachedCharacters = data; // 缓存结果
      return data; // 返回数据
    } // 条件结束
    const response = await fetch(CHARACTER_PATH); // 使用fetch加载
    const data = (await response.json()) as CharacterDefinition[]; // 解析JSON
    this.cachedCharacters = data; // 缓存结果
    return data; // 返回数据
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private static ensureWorldSection(save: SaveData): void { // 确保存档世界部分存在
    if (!save.world.weather) { // 如果缺少天气
      save.world.weather = { ...DEFAULT_WEATHER }; // 填充默认天气
    } // 条件结束
    if (!save.world.time) { // 如果缺少时间
      save.world.time = { ...DEFAULT_TIME }; // 填充默认时间
    } // 条件结束
    if (!save.player.stats) { // 如果缺少属性
      save.player.stats = { ...DEFAULT_STATS }; // 填充默认属性
    } // 条件结束
  } // 方法结束
  private static ensureExtendedSections(save: SaveData): void { // 确保新增子系统字段存在
    if (!save.npcs) { // 若缺少好感数据
      save.npcs = {}; // 初始化为空
    } // 条件结束
    if (!save.farming) { // 若缺少农田数据
      save.farming = { fields: [] }; // 初始化空田地
    } // 条件结束
    if (!save.festival) { // 若缺少节日数据
      save.festival = { claimedRewards: [] }; // 初始化节日状态
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public static async createNewSave(characterId: string): Promise<SaveData> { // 创建新存档
    const characters = await this.loadCharacters(); // 加载角色配置
    const target = characters.find((c) => c.id === characterId); // 查找角色
    if (!target) { // 如果不存在
      throw new Error(`未找到角色 ${characterId}`); // 抛出错误
    } // 条件结束
    const save: SaveData = { // 构造存档对象
      player: { id: target.id, pos: { ...target.startPos }, inventory: { ...target.inventory }, stats: { ...DEFAULT_STATS } }, // 初始化玩家
      world: { changes: [], weather: { ...DEFAULT_WEATHER }, time: { ...DEFAULT_TIME } }, // 初始化世界
      npcs: {}, // 初始化好感数据
      farming: { fields: [] }, // 初始化农田数据
      festival: { claimedRewards: [] }, // 初始化节日数据
      timestamp: Date.now(), // 记录时间戳
    }; // 对象结束
    this.ensureExtendedSections(save); // 补齐新增系统
    this.cachedSave = save; // 缓存存档
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(save)); // 写入存储
    localStorage.setItem(LOCAL_SLOT_KEY, `${SAVE_PREFIX}${target.id}`); // 记录槽位
    return save; // 返回结果
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public static loadLatestSave(): SaveData | undefined { // 读取最近存档
    if (this.cachedSave) { // 如果已有缓存
      return this.cachedSave; // 返回缓存
    } // 条件结束
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY); // 读取本地存储
    if (stored) { // 如果存在数据
      try { // 尝试解析
        const parsed = JSON.parse(stored) as SaveData; // 解析JSON
        this.cachedSave = parsed; // 缓存结果
        this.ensureWorldSection(parsed); // 确保补齐字段
        this.ensureExtendedSections(parsed); // 补齐新增系统
        return parsed; // 返回存档
      } catch (error) { // 捕获错误
        console.error('解析本地存档失败', error); // 输出错误
      } // 条件结束
    } // 条件结束
    return undefined; // 返回空
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public static updatePlayerPosition(x: number, y: number): void { // 更新玩家位置
    const save = this.loadLatestSave(); // 读取存档
    if (!save) { // 如果没有存档
      return; // 直接返回
    } // 条件结束
    save.player.pos.x = x; // 更新X坐标
    save.player.pos.y = y; // 更新Y坐标
    save.timestamp = Date.now(); // 更新时间戳
    this.persist(); // 持久化
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public static updateInventory(inventory: Record<string, number>): void { // 更新背包
    const save = this.loadLatestSave(); // 读取存档
    if (!save) { // 没有存档
      return; // 返回
    } // 条件结束
    save.player.inventory = { ...inventory }; // 覆盖背包
    save.timestamp = Date.now(); // 更新时间戳
    this.persist(); // 持久化
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public static updateStats(stats: StatsSnapshot): void { // 更新角色属性
    const save = this.loadLatestSave(); // 读取存档
    if (!save) { // 如果没有存档
      return; // 返回
    } // 条件结束
    save.player.stats = { ...stats }; // 覆盖属性
    save.timestamp = Date.now(); // 更新时间戳
    this.persist(); // 持久化
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public static updateWeather(weather: WeatherSnapshot): void { // 更新天气
    const save = this.loadLatestSave(); // 读取存档
    if (!save) { // 无存档
      return; // 返回
    } // 条件结束
    this.ensureWorldSection(save); // 确保字段存在
    save.world.weather = { ...weather }; // 覆盖天气
    save.timestamp = Date.now(); // 更新时间戳
    this.persist(); // 持久化
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public static updateTime(state: TimeState): void { // 更新时间
    const save = this.loadLatestSave(); // 读取存档
    if (!save) { // 无存档
      return; // 返回
    } // 条件结束
    this.ensureWorldSection(save); // 确保存档完整
    save.world.time = { ...state }; // 覆盖时间
    save.timestamp = Date.now(); // 更新时间戳
    this.persist(); // 持久化
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public static appendWorldChange(change: { x: number; y: number; tile: string }): void { // 追加世界修改
    const save = this.loadLatestSave(); // 读取存档
    if (!save) { // 无存档
      return; // 返回
    } // 条件结束
    save.world.changes.push(change); // 推入数组
    save.timestamp = Date.now(); // 更新时间戳
    this.persist(); // 持久化
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public static getStats(): StatsSnapshot | undefined { // 获取存档属性
    const save = this.loadLatestSave(); // 读取存档
    return save?.player.stats; // 返回属性或未定义
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public static getWeather(): WeatherSnapshot | undefined { // 获取存档天气
    const save = this.loadLatestSave(); // 读取存档
    return save?.world.weather; // 返回天气或未定义
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public static getTime(): TimeState | undefined { // 获取存档时间
    const save = this.loadLatestSave(); // 读取存档
    return save?.world.time; // 返回时间或未定义
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public static updateNPCRelationships(data: Record<string, NPCRelationshipState>): void { // 更新 NPC 好感存档
    const save = this.loadLatestSave(); // 读取存档
    if (!save) { // 若无存档
      return; // 直接返回
    } // 条件结束
    this.ensureExtendedSections(save); // 补齐子系统
    const snapshot: Record<string, NPCRelationshipState> = {}; // 创建快照
    Object.entries(data).forEach(([id, state]) => { // 遍历好感数据
      snapshot[id] = { ...state, unlocks: [...state.unlocks] }; // 拷贝数据
    }); // 结束遍历
    save.npcs = snapshot; // 写入存档
    save.timestamp = Date.now(); // 更新时间戳
    this.persist(); // 持久化
  } // 方法结束
  public static updateFarmingFields(fields: FieldState[]): void { // 更新农田存档
    const save = this.loadLatestSave(); // 读取存档
    if (!save) { // 若无存档
      return; // 返回
    } // 条件结束
    this.ensureExtendedSections(save); // 补齐子系统
    save.farming = { fields: fields.map(field => ({ ...field })) }; // 拷贝田地
    save.timestamp = Date.now(); // 更新时间戳
    this.persist(); // 持久化
  } // 方法结束
  public static updateFestivalState(state: FestivalState): void { // 更新节日存档
    const save = this.loadLatestSave(); // 读取存档
    if (!save) { // 若无存档
      return; // 返回
    } // 条件结束
    this.ensureExtendedSections(save); // 补齐子系统
    save.festival = { ...state, claimedRewards: [...state.claimedRewards] }; // 拷贝节日数据
    save.timestamp = Date.now(); // 更新时间戳
    this.persist(); // 持久化
  } // 方法结束
  public static getNPCRelationships(): Record<string, NPCRelationshipState> | undefined { // 读取好感存档
    const save = this.loadLatestSave(); // 读取存档
    return save?.npcs; // 返回好感数据
  } // 方法结束
  public static getFarmingFields(): FieldState[] | undefined { // 读取田地存档
    const save = this.loadLatestSave(); // 读取存档
    return save?.farming?.fields; // 返回田地
  } // 方法结束
  public static getFestivalState(): FestivalState | undefined { // 读取节日存档
    const save = this.loadLatestSave(); // 读取存档
    return save?.festival; // 返回节日数据
  } // 方法结束
  public static persist(): void { // 持久化存档
    if (!this.cachedSave) { // 如果没有缓存
      return; // 不执行
    } // 条件结束
    this.ensureWorldSection(this.cachedSave); // 确保存档完整
    this.ensureExtendedSections(this.cachedSave); // 补齐新增系统
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.cachedSave)); // 写入本地存储
  } // 方法结束
} // 类结束
