export interface LevelReward { // 定义升级奖励接口
  hpMax?: number; // 生命上限奖励
  staminaMax?: number; // 体力上限奖励
  carryCap?: number; // 负重上限奖励
} // 接口结束
// 分隔注释 // 保持行有注释
export interface StatsSnapshot { // 定义存档快照接口
  level: number; // 等级数值
  xp: number; // 当前经验
  hp: number; // 当前生命
  hpMax: number; // 生命上限
  stamina: number; // 当前体力
  staminaMax: number; // 体力上限
  carryCap: number; // 负重容量
  weatherStaminaMultiplier: number; // 天气体力上限系数
} // 接口结束
// 分隔注释 // 保持行有注释
export interface StatsConfig { // 定义初始配置接口
  level?: number; // 初始等级
  xp?: number; // 初始经验
  hpMax?: number; // 初始生命上限
  staminaMax?: number; // 初始体力上限
  carryCap?: number; // 初始负重容量
} // 接口结束
// 分隔注释 // 保持行有注释
type ChangeListener = () => void; // 定义属性变更监听类型
// 分隔注释 // 保持行有注释
export class Stats { // 定义角色属性类
  private level: number; // 当前等级
  private xp: number; // 当前经验
  private hp: number; // 当前生命
  private hpMax: number; // 当前生命上限
  private stamina: number; // 当前体力
  private staminaMax: number; // 基础体力上限
  private carryCap: number; // 当前负重容量
  private weatherStaminaMultiplier = 1; // 天气体力上限系数
  private listeners: ChangeListener[] = []; // 属性变更监听列表
  public constructor(config?: StatsConfig) { // 构造函数
    this.level = config?.level ?? 1; // 初始化等级
    this.xp = config?.xp ?? 0; // 初始化经验
    this.hpMax = config?.hpMax ?? 40; // 初始化生命上限
    this.hp = this.hpMax; // 初始生命等于上限
    this.staminaMax = config?.staminaMax ?? 40; // 初始化体力上限
    this.stamina = this.staminaMax; // 初始体力等于上限
    this.carryCap = config?.carryCap ?? 40; // 初始化负重
  } // 构造结束
  // 分隔注释 // 保持行有注释
  private emit(): void { // 触发属性变更事件
    this.listeners.forEach((listener) => listener()); // 通知所有监听者
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public onChange(listener: ChangeListener): void { // 注册属性变更回调
    this.listeners.push(listener); // 将回调加入列表
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getLevel(): number { // 获取等级
    return this.level; // 返回等级值
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public setLevel(level: number): void { // 设置等级
    if (level === this.level) { // 如果没有变化
      return; // 不做处理
    } // 条件结束
    this.level = level; // 更新等级
    this.emit(); // 通知变更
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getXP(): number { // 获取经验值
    return this.xp; // 返回经验
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public setXP(xp: number): void { // 设置经验值
    this.xp = Math.max(0, xp); // 防止负数
    this.emit(); // 通知变更
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public gainXP(delta: number): void { // 累加经验值
    if (delta <= 0) { // 如果增量不为正
      return; // 不做处理
    } // 条件结束
    this.xp += delta; // 增加经验
    this.emit(); // 通知变更
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getHP(): number { // 获取生命值
    return this.hp; // 返回生命
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getHPMax(): number { // 获取生命上限
    return this.hpMax; // 返回生命上限
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public heal(amount: number): void { // 恢复生命
    if (amount <= 0) { // 如果数值不为正
      return; // 不处理
    } // 条件结束
    this.hp = Math.min(this.hp + amount, this.hpMax); // 增加生命并封顶
    this.emit(); // 通知变更
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public takeDamage(amount: number): void { // 承受伤害
    if (amount <= 0) { // 如果数值不为正
      return; // 不处理
    } // 条件结束
    this.hp = Math.max(0, this.hp - amount); // 减少生命并不低于0
    this.emit(); // 通知变更
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getStamina(): number { // 获取体力值
    return this.stamina; // 返回体力
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getBaseStaminaMax(): number { // 获取基础体力上限
    return this.staminaMax; // 返回数值
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getEffectiveStaminaMax(): number { // 获取天气修正后的体力上限
    return Math.max(1, Math.floor(this.staminaMax * this.weatherStaminaMultiplier)); // 计算并保证至少为1
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getStaminaRatio(): number { // 获取体力百分比
    return this.stamina / this.getEffectiveStaminaMax(); // 返回当前体力除以上限
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public spendStamina(cost: number): boolean { // 尝试消耗体力
    if (cost <= 0) { // 如果成本不为正
      return true; // 视为成功
    } // 条件结束
    if (this.stamina < cost) { // 体力不足
      return false; // 消耗失败
    } // 条件结束
    this.stamina -= cost; // 扣除体力
    this.emit(); // 通知变更
    return true; // 返回成功
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public gainStamina(amount: number): void { // 恢复体力
    if (amount <= 0) { // 如果数值不为正
      return; // 不处理
    } // 条件结束
    this.stamina = Math.min(this.stamina + amount, this.getEffectiveStaminaMax()); // 增加体力并封顶
    this.emit(); // 通知变更
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public setWeatherStaminaMultiplier(multiplier: number): void { // 设置天气体力上限系数
    this.weatherStaminaMultiplier = Math.max(0.1, multiplier); // 防止过低
    const effectiveMax = this.getEffectiveStaminaMax(); // 重新计算上限
    if (this.stamina > effectiveMax) { // 如果当前体力超过上限
      this.stamina = effectiveMax; // 将体力压至上限
    } // 条件结束
    this.emit(); // 通知变更
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public applyLevelReward(reward: LevelReward): void { // 应用升级奖励
    if (reward.hpMax) { // 如果有生命奖励
      this.hpMax += reward.hpMax; // 增加生命上限
      this.hp += reward.hpMax; // 同时恢复生命
    } // 条件结束
    if (reward.staminaMax) { // 如果有体力奖励
      this.staminaMax += reward.staminaMax; // 增加体力上限
      this.stamina += reward.staminaMax; // 同时恢复体力
    } // 条件结束
    if (reward.carryCap) { // 如果有负重奖励
      this.carryCap += reward.carryCap; // 增加负重
    } // 条件结束
    this.hp = Math.min(this.hp, this.hpMax); // 生命不超过上限
    this.stamina = Math.min(this.stamina, this.getEffectiveStaminaMax()); // 体力不超过上限
    this.emit(); // 通知变更
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getCarryCap(): number { // 获取负重容量
    return this.carryCap; // 返回负重
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public serialize(): StatsSnapshot { // 序列化当前属性
    return { level: this.level, xp: this.xp, hp: this.hp, hpMax: this.hpMax, stamina: this.stamina, staminaMax: this.staminaMax, carryCap: this.carryCap, weatherStaminaMultiplier: this.weatherStaminaMultiplier }; // 返回快照对象
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public restore(snapshot: StatsSnapshot): void { // 从快照恢复
    this.level = snapshot.level; // 恢复等级
    this.xp = snapshot.xp; // 恢复经验
    this.hpMax = snapshot.hpMax; // 恢复生命上限
    this.hp = Math.min(snapshot.hp, snapshot.hpMax); // 恢复生命并防止超出
    this.staminaMax = snapshot.staminaMax; // 恢复体力上限
    this.weatherStaminaMultiplier = snapshot.weatherStaminaMultiplier; // 恢复天气系数
    this.stamina = Math.min(snapshot.stamina, this.getEffectiveStaminaMax()); // 恢复体力并防止超出
    this.carryCap = snapshot.carryCap; // 恢复负重
    this.emit(); // 通知变更
  } // 方法结束
} // 类结束
