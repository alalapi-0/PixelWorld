import localforage, { LocalForage } from 'localforage'; // 引入localforage用于存储
import Phaser from 'phaser'; // 引入Phaser框架
import sampleData from './achievements.sample.json'; // 引入示例成就表
// 分隔注释 // 保持行有注释
export type AchievementCondition = { type: 'collect'; itemId: string; count: number } | { type: 'event'; key: string }; // 定义触发条件类型
export interface AchievementDefinition { id: string; name: string; desc: string; cond: AchievementCondition; icon?: string; } // 定义成就结构
interface AchievementFile { list: AchievementDefinition[]; } // 定义JSON结构
export interface AchievementSave { unlocked: string[]; collect: Record<string, number>; } // 定义存储结构
export type AchievementUnlockCallback = (definition: AchievementDefinition) => void; // 定义解锁回调类型
// 分隔注释 // 保持行有注释
const STORAGE_KEY = 'miniworld:achievements'; // 定义本地存储键
let storage: LocalForage = localforage; // 默认使用localforage
// 分隔注释 // 保持行有注释
export function __setAchievementStorage(custom: LocalForage): void { // 提供测试自定义存储
  storage = custom; // 替换存储实例
} // 函数结束
// 分隔注释 // 保持行有注释
async function loadExternal(): Promise<AchievementFile | null> { // 尝试读取外部定义
  if (typeof fetch !== 'function') { // 如果环境不支持fetch
    return null; // 返回空
  } // 条件结束
  try { // 捕获异常
    const response = await fetch('achievements/achievements.sample.json', { cache: 'no-cache' }); // 请求外部文件
    if (!response.ok) { // 如果失败
      return null; // 返回空
    } // 条件结束
    const data = (await response.json()) as AchievementFile; // 解析JSON
    return data; // 返回数据
  } catch (error) { // 捕获异常
    console.warn('[AchievementManager] 外部成就读取失败', error); // 输出警告
    return null; // 返回空
  } // 异常结束
} // 函数结束
// 分隔注释 // 保持行有注释
function cloneDefinitions(defs: AchievementDefinition[]): AchievementDefinition[] { // 克隆定义数组
  return defs.map((def) => ({ ...def, cond: { ...def.cond } })); // 返回拷贝
} // 函数结束
// 分隔注释 // 保持行有注释
export class AchievementManager { // 定义成就管理器
  private definitions: Map<string, AchievementDefinition> = new Map(); // 存储成就定义
  private unlocked: Set<string> = new Set(); // 存储已解锁ID
  private collectProgress: Map<string, number> = new Map(); // 存储收集进度
  private callback?: AchievementUnlockCallback; // 保存弹窗回调
  // 分隔注释 // 保持行有注释
  public constructor(callback?: AchievementUnlockCallback) { // 构造函数
    this.callback = callback; // 保存回调
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public setCallback(callback: AchievementUnlockCallback | undefined): void { // 更新回调
    this.callback = callback; // 保存回调
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public async loadDefs(_scene: Phaser.Scene): Promise<void> { // 加载成就定义
    const external = await loadExternal(); // 尝试外部加载
    const source = external ?? (sampleData as AchievementFile); // 决定数据源
    this.definitions.clear(); // 清空旧定义
    cloneDefinitions(source.list).forEach((def) => { // 遍历定义
      this.definitions.set(def.id, def); // 写入Map
    }); // 遍历结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public unlock(id: string): void { // 解锁指定成就
    if (!this.definitions.has(id)) { // 如果不存在定义
      return; // 不处理
    } // 条件结束
    if (this.unlocked.has(id)) { // 如果已解锁
      return; // 不重复
    } // 条件结束
    this.unlocked.add(id); // 加入已解锁集合
    const def = this.definitions.get(id)!; // 读取定义
    if (this.callback) { // 如果设置回调
      this.callback(def); // 触发回调
    } // 条件结束
    void this.save(); // 异步持久化
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public isUnlocked(id: string): boolean { // 查询是否解锁
    return this.unlocked.has(id); // 返回结果
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public onEvent(key: string, _payload?: unknown): void { // 处理事件触发
    this.definitions.forEach((def) => { // 遍历定义
      if (def.cond.type === 'event' && def.cond.key === key) { // 匹配事件条件
        this.unlock(def.id); // 解锁成就
      } // 条件结束
    }); // 遍历结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public onCollect(itemId: string, delta: number): void { // 处理采集累计
    if (delta <= 0) { // 如果数量不正
      return; // 不处理
    } // 条件结束
    const current = this.collectProgress.get(itemId) ?? 0; // 读取当前进度
    const next = current + delta; // 计算新进度
    this.collectProgress.set(itemId, next); // 保存进度
    this.definitions.forEach((def) => { // 遍历定义
      if (def.cond.type === 'collect' && def.cond.itemId === itemId && next >= def.cond.count) { // 判断条件
        this.unlock(def.id); // 解锁成就
      } // 条件结束
    }); // 遍历结束
    void this.save(); // 持久化进度
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public async save(): Promise<void> { // 将状态写入存储
    const data: AchievementSave = { unlocked: Array.from(this.unlocked.values()), collect: Object.fromEntries(this.collectProgress) }; // 构造数据
    await storage.setItem(STORAGE_KEY, data); // 写入存储
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public async load(): Promise<void> { // 从存储读取状态
    const data = (await storage.getItem(STORAGE_KEY)) as AchievementSave | null; // 读取存储
    if (!data) { // 如果没有数据
      return; // 直接返回
    } // 条件结束
    this.unlocked = new Set(data.unlocked); // 恢复解锁集合
    this.collectProgress = new Map(Object.entries(data.collect).map(([key, value]) => [key, Number(value)])); // 恢复进度
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public all(): { id: string; name: string; desc: string; unlocked: boolean }[] { // 返回成就列表
    const result: { id: string; name: string; desc: string; unlocked: boolean }[] = []; // 初始化数组
    this.definitions.forEach((def) => { // 遍历定义
      result.push({ id: def.id, name: def.name, desc: def.desc, unlocked: this.unlocked.has(def.id) }); // 推入条目
    }); // 遍历结束
    return result.sort((a, b) => a.id.localeCompare(b.id)); // 排序后返回
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public exportState(): AchievementSave { // 导出状态供存档
    return { unlocked: Array.from(this.unlocked), collect: Object.fromEntries(this.collectProgress) as Record<string, number> }; // 返回复制
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public importState(state: AchievementSave | undefined): void { // 从存档导入状态
    if (!state) { // 如果状态缺失
      return; // 不处理
    } // 条件结束
    this.unlocked = new Set(state.unlocked); // 恢复解锁
    this.collectProgress = new Map(Object.entries(state.collect).map(([key, value]) => [key, Number(value)])); // 恢复进度
  } // 方法结束
} // 类结束
