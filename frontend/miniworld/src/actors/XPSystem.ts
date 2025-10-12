import leveling from '../../assets/config/leveling.json'; // 引入经验曲线配置
import { Stats, LevelReward } from './Stats'; // 引入属性系统
// 分隔注释 // 保持行有注释
export interface LevelingConfig { // 定义经验配置接口
  maxLevel: number; // 最大等级
  xpForLevel: number[]; // 各等级所需总经验
  rewards: { onLevelUp: LevelReward }; // 升级奖励
  xpSources: Record<string, number>; // 经验来源映射
} // 接口结束
// 分隔注释 // 保持行有注释
export type LevelUpListener = (level: number) => void; // 定义升级监听函数类型
// 分隔注释 // 保持行有注释
export interface XPAdditionResult { // 定义增加经验的结果接口
  gained: number; // 获得的经验值
  newLevel: number; // 最终等级
  leveledUp: boolean; // 是否发生升级
} // 接口结束
// 分隔注释 // 保持行有注释
export class XPSystem { // 定义经验系统类
  private stats: Stats; // 属性引用
  private config: LevelingConfig; // 经验配置
  private listeners: LevelUpListener[] = []; // 升级监听列表
  public constructor(stats: Stats, config: LevelingConfig = leveling) { // 构造函数
    this.stats = stats; // 保存属性引用
    this.config = config; // 保存配置
    this.validateCurve(); // 构造时校验经验曲线
  } // 构造结束
  // 分隔注释 // 保持行有注释
  private validateCurve(): void { // 校验经验数组
    if (this.config.xpForLevel.length <= this.config.maxLevel) { // 判断数组长度
      throw new Error('经验数组长度不足以覆盖最大等级'); // 抛出错误
    } // 条件结束
    for (let i = 1; i <= this.config.maxLevel; i += 1) { // 遍历每个等级
      if (this.config.xpForLevel[i] < this.config.xpForLevel[i - 1]) { // 如果不是递增
        throw new Error(`等级${i}的经验阈值小于前一等级`); // 抛出错误
      } // 条件结束
    } // 循环结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public onLevelUp(listener: LevelUpListener): void { // 注册升级监听
    this.listeners.push(listener); // 添加监听
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private emitLevelUp(level: number): void { // 触发升级事件
    this.listeners.forEach((listener) => listener(level)); // 通知所有监听者
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getMaxLevel(): number { // 获取最大等级
    return this.config.maxLevel; // 返回配置值
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getXpForLevel(level: number): number { // 获取指定等级所需经验
    if (level >= this.config.xpForLevel.length) { // 如果超出数组
      return this.config.xpForLevel[this.config.xpForLevel.length - 1]; // 返回末尾值
    } // 条件结束
    return this.config.xpForLevel[level]; // 返回对应值
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getXpProgress(): { current: number; needed: number; level: number } { // 获取当前经验进度
    const level = this.stats.getLevel(); // 读取当前等级
    const xp = this.stats.getXP(); // 读取当前经验
    const base = this.getXpForLevel(level); // 当前等级基准经验
    const next = this.getXpForLevel(Math.min(level + 1, this.getMaxLevel())); // 下一等级经验
    const needed = Math.max(1, next - base); // 计算所需增量
    return { current: xp - base, needed, level }; // 返回结构
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getSourceXP(sourceId: string): number | undefined { // 查询经验来源数值
    return this.config.xpSources[sourceId]; // 返回配置中的经验值
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public addXP(sourceId: string, amount?: number): XPAdditionResult { // 增加经验主流程
    const baseAmount = amount ?? this.getSourceXP(sourceId) ?? 0; // 计算经验增量
    if (baseAmount <= 0) { // 如果增量不为正
      return { gained: 0, newLevel: this.stats.getLevel(), leveledUp: false }; // 返回无变化
    } // 条件结束
    this.stats.gainXP(baseAmount); // 调用属性累加经验
    let leveledUp = false; // 标记升级
    while (this.stats.getLevel() < this.getMaxLevel()) { // 当未达到最大等级
      const nextLevel = this.stats.getLevel() + 1; // 计算下一等级
      const requirement = this.getXpForLevel(nextLevel); // 获取对应阈值
      if (this.stats.getXP() < requirement) { // 如果经验不足
        break; // 停止循环
      } // 条件结束
      this.stats.setLevel(nextLevel); // 提升等级
      this.stats.applyLevelReward(this.config.rewards.onLevelUp); // 应用奖励
      this.emitLevelUp(nextLevel); // 发出事件
      leveledUp = true; // 标记成功
    } // 循环结束
    const maxXp = this.getXpForLevel(this.getMaxLevel()); // 读取最大等级经验
    if (this.stats.getXP() > maxXp) { // 如果经验超过最大
      this.stats.setXP(maxXp); // 将经验锁定在最大
    } // 条件结束
    return { gained: baseAmount, newLevel: this.stats.getLevel(), leveledUp }; // 返回结果
  } // 方法结束
} // 类结束
