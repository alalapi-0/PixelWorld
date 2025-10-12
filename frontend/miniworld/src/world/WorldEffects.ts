import { Stats } from '../actors/Stats'; // 引入属性系统
import { BALANCE_CONFIG, getBuildCostMultiplier, getMovementMultiplier, getStaminaCostForBuild, getStaminaMaxMultiplier } from '../config/Balance'; // 引入平衡配置工具
import type { WeatherState } from '../time/WeatherSystem'; // 引入天气类型
// 分隔注释 // 保持行有注释
export class WorldEffects { // 定义世界效果调节器
  private stats: Stats; // 属性引用
  private weather: WeatherState = 'clear'; // 当前天气
  public constructor(stats: Stats) { // 构造函数
    this.stats = stats; // 保存属性引用
    this.applyWeather('clear'); // 初始化天气
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public applyWeather(state: WeatherState): void { // 应用天气变化
    this.weather = state; // 更新当前天气
    const multiplier = getStaminaMaxMultiplier(state); // 读取体力上限乘数
    this.stats.setWeatherStaminaMultiplier(multiplier); // 应用到属性
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getWeather(): WeatherState { // 获取当前天气
    return this.weather; // 返回天气
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public computeMoveSpeed(baseSpeed: number): number { // 计算移动速度
    const ratio = this.stats.getStaminaRatio(); // 获取体力比例
    const weatherMultiplier = getMovementMultiplier(this.weather, ratio); // 计算天气系数
    return Math.round(baseSpeed * weatherMultiplier); // 返回调整后的速度
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public spendForMovement(tiles: number): boolean { // 按移动距离消耗体力
    const cost = tiles * BALANCE_CONFIG.staminaCost.movePerTile; // 计算体力成本
    return this.stats.spendStamina(cost); // 扣除体力并返回结果
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getBuildStaminaCost(kind: keyof typeof BALANCE_CONFIG.staminaCost.build): number { // 获取建造体力成本
    const base = getStaminaCostForBuild(kind); // 基础成本
    const ratio = this.stats.getStaminaRatio(); // 体力比例
    const multiplier = getBuildCostMultiplier(this.weather, ratio); // 天气与体力系数
    return Math.round(base * multiplier); // 返回最终成本
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public tryBuild(kind: keyof typeof BALANCE_CONFIG.staminaCost.build): boolean { // 尝试执行建造
    const cost = this.getBuildStaminaCost(kind); // 计算成本
    return this.stats.spendStamina(cost); // 扣除体力并返回成功与否
  } // 方法结束
} // 类结束
