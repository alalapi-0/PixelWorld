import restPointsData from '../../assets/config/rest_points.json'; // 引入休息点配置
import { BALANCE_CONFIG } from '../config/Balance'; // 引入平衡配置
import type { TimeState } from '../systems/TimeSystem'; // 引入时间状态类型
import { Stats } from './Stats'; // 引入角色属性
// 分隔注释 // 保持行有注释
export type RestLocationType = 'bed' | 'camp'; // 定义休息类型
// 分隔注释 // 保持行有注释
export type SleepTarget = 'dawn' | 'noon' | 'dusk' | 'nextMorning'; // 定义睡眠目标
// 分隔注释 // 保持行有注释
interface RestPoint { x: number; y: number; type: RestLocationType; } // 定义休息点结构
// 分隔注释 // 保持行有注释
export interface RestResult { // 定义休息结果接口
  minutesPassed: number; // 推进的分钟数
  newTime: TimeState; // 推进后的时间
  staminaBefore: number; // 原体力
  staminaAfter: number; // 恢复后体力
} // 接口结束
// 分隔注释 // 保持行有注释
export interface TimeAdapter { // 定义时间适配器接口
  getState(): TimeState; // 获取当前时间
  applyState(state: TimeState): void; // 应用新的时间
} // 接口结束
// 分隔注释 // 保持行有注释
const HOURS_PER_DAY = 24; // 每天小时数
const MINUTES_PER_DAY = HOURS_PER_DAY * 60; // 每天分钟数
const DAYS_PER_SEASON = 30; // 每季天数
const WEEK_LENGTH = 7; // 每周天数
const SEASONS: Array<TimeState['season']> = ['spring', 'summer', 'autumn', 'winter']; // 季节顺序
// 分隔注释 // 保持行有注释
function cloneState(state: TimeState): TimeState { // 克隆时间状态
  return { minute: state.minute, hour: state.hour, day: state.day, weekDay: state.weekDay, season: state.season, year: state.year }; // 返回浅拷贝
} // 函数结束
// 分隔注释 // 保持行有注释
function advanceMinutes(state: TimeState, minutes: number): TimeState { // 根据分钟推进时间
  let remaining = minutes; // 剩余分钟
  let result = cloneState(state); // 初始化结果
  while (remaining > 0) { // 循环推进
    result.minute += 1; // 分钟加一
    remaining -= 1; // 消耗一分钟
    if (result.minute >= 60) { // 检查超出
      result.minute = 0; // 重置分钟
      result.hour += 1; // 小时加一
      if (result.hour >= HOURS_PER_DAY) { // 检查日更替
        result.hour = 0; // 重置小时
        result.day += 1; // 天数加一
        result.weekDay = (result.weekDay + 1) % WEEK_LENGTH; // 星期推进
        if (result.day > DAYS_PER_SEASON) { // 检查季节切换
          result.day = 1; // 重置天数
          const index = SEASONS.indexOf(result.season); // 找到当前季节索引
          const nextIndex = (index + 1) % SEASONS.length; // 计算下一季索引
          if (nextIndex === 0) { // 如果回到春季
            result.year += 1; // 年份加一
          } // 条件结束
          result.season = SEASONS[nextIndex]; // 切换季节
        } // 条件结束
      } // 条件结束
    } // 条件结束
  } // 循环结束
  return result; // 返回结果
} // 函数结束
// 分隔注释 // 保持行有注释
const TARGET_MINUTES: Record<SleepTarget, number> = { dawn: 6 * 60, noon: 12 * 60, dusk: 18 * 60, nextMorning: 6 * 60 }; // 定义各睡眠目标分钟
// 分隔注释 // 保持行有注释
const restPoints: RestPoint[] = [ // 构造休息点列表
  ...restPointsData.beds.map((point: { x: number; y: number }) => ({ ...point, type: 'bed' as RestLocationType })), // 处理床位
  ...restPointsData.camps.map((point: { x: number; y: number }) => ({ ...point, type: 'camp' as RestLocationType })), // 处理营地
]; // 数组结束
// 分隔注释 // 保持行有注释
export class RestSystem { // 定义休息系统类
  private stats: Stats; // 属性引用
  private time: TimeAdapter; // 时间适配器
  public constructor(stats: Stats, time: TimeAdapter) { // 构造函数
    this.stats = stats; // 保存属性
    this.time = time; // 保存时间适配器
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public findRestPoint(x: number, y: number): RestLocationType | undefined { // 查找坐标对应的休息点类型
    return restPoints.find((point) => point.x === x && point.y === y)?.type; // 返回匹配类型
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getOptionsAt(x: number, y: number): SleepTarget[] { // 获取指定坐标可用选项
    return this.findRestPoint(x, y) ? ['dawn', 'noon', 'dusk', 'nextMorning'] : []; // 有休息点则返回全部选项
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private computeMinutesToTarget(target: SleepTarget, currentMinutes: number): number { // 计算需要前进的分钟数
    const targetMinutes = TARGET_MINUTES[target]; // 获取目标分钟
    if (target === 'nextMorning') { // 如果是次日早晨
      const delta = ((targetMinutes - currentMinutes) % MINUTES_PER_DAY + MINUTES_PER_DAY) % MINUTES_PER_DAY; // 计算与下一次早晨的差值
      return delta + MINUTES_PER_DAY; // 强制跨越一天
    } // 条件结束
    let delta = targetMinutes - currentMinutes; // 计算差值
    if (delta <= 0) { // 如果已经过了目标时间
      delta += MINUTES_PER_DAY; // 推进到次日
    } // 条件结束
    return delta; // 返回结果
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private applyRecovery(type: RestLocationType): { before: number; after: number } { // 应用体力恢复
    const before = this.stats.getStamina(); // 记录休息前体力
    const effectiveMax = this.stats.getEffectiveStaminaMax(); // 计算当前体力上限
    const missing = Math.max(0, effectiveMax - before); // 计算缺口
    const fraction = BALANCE_CONFIG.rest.recoverFraction[type]; // 读取比例恢复
    const flat = BALANCE_CONFIG.rest.recoverFlat[type]; // 读取固定恢复
    const recovered = Math.round(missing * fraction + flat); // 计算恢复量
    this.stats.gainStamina(recovered); // 应用恢复
    return { before, after: this.stats.getStamina() }; // 返回恢复前后
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public sleep(target: SleepTarget, location: RestLocationType): RestResult { // 执行休息逻辑
    const state = this.time.getState(); // 读取当前时间
    const currentMinutes = state.hour * 60 + state.minute; // 计算当前分钟
    const advance = this.computeMinutesToTarget(target, currentMinutes); // 计算推进分钟
    const newState = advanceMinutes(state, advance); // 推进时间
    this.time.applyState(newState); // 应用新时间
    const recovery = this.applyRecovery(location); // 恢复体力
    return { minutesPassed: advance, newTime: newState, staminaBefore: recovery.before, staminaAfter: recovery.after }; // 返回结果
  } // 方法结束
} // 类结束
