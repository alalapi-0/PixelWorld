import type { WeatherState } from '../time/WeatherSystem'; // 引入天气状态类型以确保键一致
// 分隔注释 // 保持行有注释
export interface StaminaCostTable { // 定义体力消耗表接口
  movePerTile: number; // 每格移动消耗体力
  build: { house: number; road: number; tree: number }; // 建造不同项目的消耗
  gather: { wood: number; ore: number }; // 采集各类资源的消耗
} // 接口结束
// 分隔注释 // 保持行有注释
export interface RestRecoveryTable { // 定义休息恢复表接口
  recoverFraction: { bed: number; camp: number }; // 按照缺口比例恢复
  recoverFlat: { bed: number; camp: number }; // 额外固定恢复值
} // 接口结束
// 分隔注释 // 保持行有注释
export interface WeatherMultiplierTable { // 定义天气系数表接口
  movement: Record<WeatherState, number>; // 各天气下移动速度乘数
  buildCost: Record<WeatherState, number>; // 各天气下建造体力乘数
  staminaMax: Record<WeatherState, number>; // 各天气下体力上限乘数
} // 接口结束
// 分隔注释 // 保持行有注释
export interface BalanceConfig { // 定义整体平衡配置接口
  staminaCost: StaminaCostTable; // 体力消耗配置
  rest: RestRecoveryTable; // 休息恢复配置
  weather: WeatherMultiplierTable; // 天气系数配置
  lowStamina: { threshold: number; speedMultiplier: number; buildTimeMultiplier: number }; // 低体力惩罚
} // 接口结束
// 分隔注释 // 保持行有注释
export const BALANCE_CONFIG: BalanceConfig = { // 定义平衡配置常量
  staminaCost: { // 体力消耗配置
    movePerTile: 1, // 移动每格消耗1点体力
    build: { house: 18, road: 4, tree: 8 }, // 建造房屋/道路/种树体力成本
    gather: { wood: 2, ore: 4 }, // 采集木材/矿石体力成本
  }, // 子配置结束
  rest: { // 休息恢复配置
    recoverFraction: { bed: 0.85, camp: 0.6 }, // 床恢复85%缺口体力营地60%
    recoverFlat: { bed: 12, camp: 6 }, // 床额外恢复12点营地6点
  }, // 子配置结束
  weather: { // 天气相关系数
    movement: { clear: 1, cloudy: 0.97, rain: 0.9, storm: 0.8, snow: 0.85 }, // 各天气移动速度乘数
    buildCost: { clear: 1, cloudy: 1.05, rain: 1.1, storm: 1.2, snow: 1.15 }, // 各天气建造体力乘数
    staminaMax: { clear: 1, cloudy: 1, rain: 1, storm: 1, snow: 0.9 }, // 雪天体力上限降低10%
  }, // 子配置结束
  lowStamina: { threshold: 0.2, speedMultiplier: 0.7, buildTimeMultiplier: 2 }, // 低体力阈值及惩罚
}; // 常量结束
// 分隔注释 // 保持行有注释
export function getStaminaCostForBuild(kind: keyof StaminaCostTable['build']): number { // 获取建造体力消耗
  return BALANCE_CONFIG.staminaCost.build[kind]; // 返回配置值
} // 函数结束
// 分隔注释 // 保持行有注释
export function getStaminaCostForGather(kind: keyof StaminaCostTable['gather']): number { // 获取采集体力消耗
  return BALANCE_CONFIG.staminaCost.gather[kind]; // 返回配置值
} // 函数结束
// 分隔注释 // 保持行有注释
export function getMovementMultiplier(weather: WeatherState, staminaRatio: number): number { // 计算移动速度乘数
  const base = BALANCE_CONFIG.weather.movement[weather]; // 读取天气基准乘数
  if (staminaRatio <= BALANCE_CONFIG.lowStamina.threshold) { // 判断是否低体力
    return base * BALANCE_CONFIG.lowStamina.speedMultiplier; // 应用额外惩罚
  } // 条件结束
  return base; // 否则直接返回基准
} // 函数结束
// 分隔注释 // 保持行有注释
export function getBuildCostMultiplier(weather: WeatherState, staminaRatio: number): number { // 计算建造体力乘数
  const base = BALANCE_CONFIG.weather.buildCost[weather]; // 读取天气基准乘数
  if (staminaRatio <= BALANCE_CONFIG.lowStamina.threshold) { // 判断是否低体力
    return base * BALANCE_CONFIG.lowStamina.buildTimeMultiplier; // 低体力情况下耗时翻倍
  } // 条件结束
  return base; // 返回基准
} // 函数结束
// 分隔注释 // 保持行有注释
export function getStaminaMaxMultiplier(weather: WeatherState): number { // 获取天气对体力上限影响
  return BALANCE_CONFIG.weather.staminaMax[weather]; // 返回配置值
} // 函数结束
