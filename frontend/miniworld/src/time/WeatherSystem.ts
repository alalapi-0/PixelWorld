import { WEATHER_RULES, WeatherState } from '../config/WeatherTables'; // 引入天气规则
// 分隔注释 // 保持行有注释
export interface WeatherSnapshot { // 定义天气快照接口
  state: WeatherState; // 当前天气状态
  remainHours: number; // 剩余小时数
} // 接口结束
// 分隔注释 // 保持行有注释
export type WeatherChangeListener = (snapshot: WeatherSnapshot) => void; // 定义天气变更监听类型
// 分隔注释 // 保持行有注释
function randomRange(min: number, max: number, rng: () => number): number { // 在范围内生成随机整数
  const low = Math.min(min, max); // 获取较小值
  const high = Math.max(min, max); // 获取较大值
  const value = low + Math.floor(rng() * (high - low + 1)); // 计算随机值
  return Math.max(1, value); // 保证至少为1
} // 函数结束
// 分隔注释 // 保持行有注释
export class WeatherSystem { // 定义天气系统类
  private state: WeatherState; // 当前天气
  private remainHours: number; // 剩余小时
  private rng: () => number; // 随机函数
  private listeners: WeatherChangeListener[] = []; // 监听列表
  public constructor(initial: WeatherState = 'clear', remainHours = 6, rng: () => number = Math.random) { // 构造函数
    this.state = initial; // 保存初始天气
    this.remainHours = Math.max(1, remainHours); // 保存剩余小时
    this.rng = rng; // 保存随机函数
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public getSnapshot(): WeatherSnapshot { // 获取当前天气快照
    return { state: this.state, remainHours: this.remainHours }; // 返回结构
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public onChange(listener: WeatherChangeListener): void { // 注册天气变更监听
    this.listeners.push(listener); // 添加监听
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private emit(): void { // 触发天气变化
    const snapshot = this.getSnapshot(); // 获取快照
    this.listeners.forEach((listener) => listener(snapshot)); // 通知监听者
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private pickDuration(): number { // 计算下一段持续时间
    const minCandidate = randomRange(WEATHER_RULES.durationMinRange[0], WEATHER_RULES.durationMinRange[1], this.rng); // 随机选择下限
    const maxCandidate = randomRange(WEATHER_RULES.durationMaxRange[0], WEATHER_RULES.durationMaxRange[1], this.rng); // 随机选择上限
    return randomRange(minCandidate, maxCandidate, this.rng); // 在上下限之间再随机
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private pickNextState(season: string): WeatherState { // 根据季节选择下一段天气
    const weights = { ...WEATHER_RULES.weightsBySeason[season] }; // 复制季节权重
    WEATHER_RULES.states.forEach((state) => { // 遍历所有天气
      if (!(state in weights)) { // 如果缺少键
        weights[state] = 0; // 填充默认值
      } // 条件结束
    }); // 遍历结束
    WEATHER_RULES.states.forEach((candidate) => { // 再次遍历应用连锁加成
      const key = `${this.state}->${candidate}`; // 构造映射键
      if (WEATHER_RULES.chainBoost[key]) { // 如果存在加成
        weights[candidate] += WEATHER_RULES.chainBoost[key]; // 增加权重
      } // 条件结束
    }); // 遍历结束
    let total = 0; // 初始化总和
    WEATHER_RULES.states.forEach((state) => { total += Math.max(0, weights[state]); }); // 累计正权重
    if (total <= 0) { // 如果总权重为零
      return WEATHER_RULES.states[Math.floor(this.rng() * WEATHER_RULES.states.length)] ?? 'clear'; // 回退到平均选择
    } // 条件结束
    let roll = this.rng() * total; // 生成随机滚动值
    for (const candidate of WEATHER_RULES.states) { // 遍历候选
      const weight = Math.max(0, weights[candidate]); // 读取当前权重
      roll -= weight; // 扣除权重
      if (roll <= 0) { // 如果滚动值用尽
        return candidate; // 返回对应天气
      } // 条件结束
    } // 循环结束
    return WEATHER_RULES.states[WEATHER_RULES.states.length - 1] ?? 'clear'; // 兜底返回最后一个
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public advance(hours: number, season: string): WeatherSnapshot { // 推进天气系统
    if (hours <= 0) { // 如果小时不为正
      return this.getSnapshot(); // 直接返回当前状态
    } // 条件结束
    this.remainHours -= hours; // 减少剩余小时
    while (this.remainHours <= 0) { // 当剩余时间耗尽
      this.state = this.pickNextState(season); // 选择下一段天气
      this.remainHours += this.pickDuration(); // 重新生成持续时间
      this.emit(); // 触发通知
    } // 循环结束
    return this.getSnapshot(); // 返回最新快照
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public forceState(state: WeatherState, duration: number): void { // 强制设置天气
    this.state = state; // 更新天气
    this.remainHours = Math.max(1, duration); // 更新剩余时间
    this.emit(); // 通知监听者
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public restore(snapshot: WeatherSnapshot): void { // 从快照恢复
    this.state = snapshot.state; // 恢复天气
    this.remainHours = Math.max(1, snapshot.remainHours); // 恢复剩余时间
  } // 方法结束
} // 类结束
export type { WeatherState }; // 重新导出天气类型
