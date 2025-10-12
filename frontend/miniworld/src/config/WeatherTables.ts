import rules from '../../assets/config/weather_rules.json'; // 引入天气规则JSON
// 分隔注释 // 保持行有注释
export type WeatherState = (typeof rules.states)[number]; // 根据JSON推导天气状态类型
// 分隔注释 // 保持行有注释
export interface WeatherRules { // 定义天气规则接口
  states: WeatherState[]; // 可用天气列表
  weightsBySeason: Record<string, Record<WeatherState, number>>; // 按季节划分的权重
  durationMinRange: [number, number]; // 持续时间下限区间
  durationMaxRange: [number, number]; // 持续时间上限区间
  chainBoost: Record<string, number>; // 天气连锁加成表
} // 接口结束
// 分隔注释 // 保持行有注释
export const WEATHER_RULES: WeatherRules = rules; // 导出常量供系统使用
// 分隔注释 // 保持行有注释
export function getSeasonWeights(season: string): Record<WeatherState, number> { // 获取指定季节权重表
  const weights = WEATHER_RULES.weightsBySeason[season]; // 读取对应权重
  if (!weights) { // 如果没有定义
    return WEATHER_RULES.states.reduce((acc, state) => { acc[state] = 1 / WEATHER_RULES.states.length; return acc; }, {} as Record<WeatherState, number>); // 返回平均权重
  } // 条件结束
  return weights; // 正常返回定义值
} // 函数结束
