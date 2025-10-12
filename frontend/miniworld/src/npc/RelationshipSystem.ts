// 定义段位规则接口
export interface RelationshipLevel { // 描述等级名称与最低值
  name: string; // 等级名称
  min: number; // 进入等级的最低好感
} // 结束接口
// 定义解锁事件配置
export interface UnlockRule { // 描述在指定阈值触发的事件
  at: number; // 触发阈值
  event: string; // 事件标识
} // 结束接口
// 定义规则表结构
export interface RelationshipRules { // 综合所有规则
  levels: RelationshipLevel[]; // 等级数组
  dailyCap: number; // 每日上限
  decayPerDay: number; // 每日衰减
  unlockEvents: Record<string, UnlockRule[]>; // 解锁事件表
} // 结束接口
// 定义 NPC 好感存档结构
export interface NPCRelationshipState { // 保存 NPC 的好感数据
  affinity: number; // 当前好感值
  dailyGain: number; // 当日已获得
  lastDayKey: string; // 上次计入的日期键
  unlocks: string[]; // 已触发事件
} // 结束接口
// 定义事件回调
export type UnlockCallback = (npcId: string, eventId: string) => void; // 触发时回调
// 定义好感系统主体
export class RelationshipSystem { // 管理好感逻辑
  private rules: RelationshipRules; // 存储规则
  private state: Record<string, NPCRelationshipState>; // NPC 状态
  private currentDayKey = ""; // 当前日期键
  private unlockListeners: UnlockCallback[] = []; // 解锁监听列表
  constructor(rules: RelationshipRules, initialState?: Record<string, NPCRelationshipState>) { // 构造函数
    this.rules = rules; // 保存规则
    this.state = initialState ? { ...initialState } : {}; // 初始化状态
  } // 结束构造
  setCurrentDay(dayKey: string): void { // 设置当前日期键
    this.currentDayKey = dayKey; // 保存日期键
    Object.values(this.state).forEach(entry => { // 遍历所有 NPC
      if (entry.lastDayKey !== dayKey) { // 如果日期不同
        entry.dailyGain = Math.max(0, entry.dailyGain - this.rules.decayPerDay); // 按规则衰减当日增量
        entry.lastDayKey = dayKey; // 更新日期
      } // 结束条件
    }); // 结束遍历
  } // 结束方法
  onUnlock(callback: UnlockCallback): void { // 注册解锁监听
    this.unlockListeners.push(callback); // 添加监听函数
  } // 结束方法
  getState(npcId: string): NPCRelationshipState { // 获取 NPC 状态
    if (!this.state[npcId]) { // 若不存在
      this.state[npcId] = { affinity: 0, dailyGain: 0, lastDayKey: this.currentDayKey, unlocks: [] }; // 初始化状态
    } // 结束条件
    return this.state[npcId]; // 返回状态引用
  } // 结束方法
  addAffinity(npcId: string, delta: number, reason: string): number { // 增加好感
    const entry = this.getState(npcId); // 获取状态
    if (entry.lastDayKey !== this.currentDayKey) { // 若日期不一致
      entry.dailyGain = 0; // 重置当日增量
      entry.lastDayKey = this.currentDayKey; // 更新日期
    } // 结束条件
    const capLeft = Math.max(0, this.rules.dailyCap - entry.dailyGain); // 计算剩余上限
    const applied = Math.max(-999, Math.min(capLeft, delta)); // 限制增量
    entry.affinity += applied; // 增加好感
    entry.dailyGain += Math.max(0, applied); // 增加当日增量
    this.checkUnlocks(npcId, entry); // 检查解锁
    return applied; // 返回实际增量
  } // 结束方法
  getLevel(npcId: string): RelationshipLevel { // 获取当前等级
    const affinity = this.getState(npcId).affinity; // 获取好感
    const sorted = [...this.rules.levels].sort((a, b) => b.min - a.min); // 按最小值降序排序
    return sorted.find(level => affinity >= level.min) || sorted[sorted.length - 1]; // 找到满足条件的等级
  } // 结束方法
  private checkUnlocks(npcId: string, entry: NPCRelationshipState): void { // 检查解锁事件
    const rules = this.rules.unlockEvents[npcId] || []; // 获取 NPC 解锁规则
    rules.forEach(rule => { // 遍历规则
      if (entry.affinity >= rule.at && !entry.unlocks.includes(rule.event)) { // 满足阈值且未解锁
        entry.unlocks.push(rule.event); // 记录解锁
        this.unlockListeners.forEach(cb => cb(npcId, rule.event)); // 触发监听
      } // 结束条件
    }); // 结束遍历
  } // 结束方法
  getLevels(): RelationshipLevel[] { // 获取全部等级
    return [...this.rules.levels]; // 返回等级数组副本
  } // 结束方法
  exportState(): Record<string, NPCRelationshipState> { // 导出存档
    return JSON.parse(JSON.stringify(this.state)); // 深拷贝避免引用问题
  } // 结束方法
} // 结束类
