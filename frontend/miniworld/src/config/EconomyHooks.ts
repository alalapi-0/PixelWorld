// 定义经济调整输入参数类型
export interface EconomyContext { // 描述影响价格的上下文
  season: string; // 当前季节
  weather: string; // 当前天气
  festivalId?: string | null; // 当前节日 ID
} // 结束接口
// 定义商品上下文类型
export interface ItemEconomyInfo { // 描述商品的基础属性
  basePrice: number; // 基础价格
  discountTag?: string; // 节日折扣标签
  category?: string; // 商品分类
} // 结束接口
// 计算价格系数
export function calculatePriceMultiplier(context: EconomyContext): number { // 导出价格系数函数
  let multiplier = 1; // 初始倍率
  if (context.season === "winter") { // 冬季调价
    multiplier += 0.1; // 冬季涨价百分之十
  } // 结束条件
  if (context.weather === "rain") { // 雨天调价
    multiplier -= 0.05; // 雨天小幅降价
  } // 结束条件
  if (context.festivalId === "harvest_fest") { // 丰收节期间
    multiplier -= 0.1; // 给予折扣
  } // 结束条件
  return Math.max(0.5, multiplier); // 防止倍率过低
} // 结束函数
// 计算单个商品的最终价格
export function getFinalPrice(context: EconomyContext, item: ItemEconomyInfo): number { // 导出最终价格函数
  const baseMultiplier = calculatePriceMultiplier(context); // 计算基础倍率
  let price = item.basePrice * baseMultiplier; // 套用基础倍率
  if (context.festivalId === "harvest_fest" && item.discountTag === "harvest") { // 若是丰收节折扣商品
    price *= 0.8; // 再次折扣
  } // 结束条件
  if (item.category === "crop" && context.festivalId === "harvest_fest") { // 节日农作物奖励
    price *= 1.1; // 提升农作物售价
  } // 结束条件
  return Math.round(price); // 返回四舍五入的整数价格
} // 结束函数
