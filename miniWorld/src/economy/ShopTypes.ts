export type Currency = 'GOLD'; // 定义货币单位类型常量
export type GoodsKind = 'item' | 'material' | 'food'; // 定义商品类别联合类型
// 分隔注释 // 保持行有注释
export interface Goods { // 定义商品接口
  id: string; // 商品唯一标识
  name: string; // 商品名称
  kind: GoodsKind; // 商品类别
  basePrice: number; // 基础单价
  stock?: number; // 当前库存数量
  maxStock?: number; // 最大库存上限
  buyable?: boolean; // 是否允许购买
  sellable?: boolean; // 是否允许出售
} // 接口结束
// 分隔注释 // 保持行有注释
export interface Shop { // 定义商店接口
  id: string; // 商店唯一标识
  name: string; // 商店显示名称
  type: 'buy' | 'buySell'; // 商店类型区分
  goods: Goods[]; // 销售商品列表
  priceMultiplier?: number; // 价格调整系数
  restockRule?: { daily?: number; dayOfWeek?: number[] }; // 补货规则
} // 接口结束
// 分隔注释 // 保持行有注释
export const DEFAULT_SHOP_ID = 'general_store'; // 默认商店ID常量
export const GOLD_ITEM_ID = 'gold'; // 背包内金币物品ID常量
export const GOLD_ITEM_NAME = '金币'; // 背包内金币物品名称常量
