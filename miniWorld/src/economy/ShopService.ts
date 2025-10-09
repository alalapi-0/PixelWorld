import { Inventory } from '../systems/Inventory'; // 引入背包系统
import { PopupManager } from '../ui/PopupManager'; // 引入飘字管理器
import { ShopStore } from './ShopStore'; // 引入商店仓库
import { Goods, Shop, GOLD_ITEM_ID, GOLD_ITEM_NAME } from './ShopTypes'; // 引入相关类型和常量
// 分隔注释 // 保持行有注释
const SELL_PRICE_RATIO = 0.5; // 定义出售价格比例
// 分隔注释 // 保持行有注释
function getGoods(shop: Shop, goodsId: string): Goods | undefined { // 根据ID检索商品
  return shop.goods.find((item) => item.id === goodsId); // 在数组中查找
} // 函数结束
// 分隔注释 // 保持行有注释
export class ShopService { // 定义商店服务类
  private store: ShopStore; // 保存商店仓库引用
  private inventory: Inventory; // 保存背包引用
  private popup?: PopupManager; // 可选飘字管理器
  // 分隔注释 // 保持行有注释
  public constructor(shopStore: ShopStore, inventory: Inventory, popup?: PopupManager) { // 构造函数
    this.store = shopStore; // 保存仓库
    this.inventory = inventory; // 保存背包
    this.popup = popup; // 保存飘字引用
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public getInventory(): Inventory { // 获取背包实例
    return this.inventory; // 返回背包引用
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getPrice(goods: Goods, multiplier?: number): number { // 计算商品价格
    const price = goods.basePrice * (multiplier ?? 1); // 应用价格系数
    return Math.max(1, Math.round(price)); // 返回向最近整数取整且不低于1的价格
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public canBuy(goods: Goods, count: number, shopMultiplier?: number): boolean { // 判断是否可以购买
    if (goods.buyable === false) { // 检查是否禁止购买
      return false; // 禁止则返回false
    } // 条件结束
    if (goods.stock !== undefined && goods.stock < count) { // 检查库存数量
      return false; // 库存不足
    } // 条件结束
    const totalPrice = this.getPrice(goods, shopMultiplier) * count; // 计算总价
    if (!this.inventory.has(GOLD_ITEM_ID, totalPrice)) { // 检查金币是否足够
      return false; // 金币不足
    } // 条件结束
    return true; // 条件满足可购买
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public canSell(goodsId: string, count: number): boolean { // 判断是否可以出售
    return this.inventory.has(goodsId, count); // 利用背包判断数量是否足够
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public buy(shopId: string, goodsId: string, count: number): boolean { // 执行购买逻辑
    const shop = this.store.getShop(shopId); // 获取商店
    if (!shop) { // 若商店不存在
      return false; // 返回失败
    } // 条件结束
    const goods = getGoods(shop, goodsId); // 获取商品
    if (!goods) { // 未找到商品
      return false; // 返回失败
    } // 条件结束
    if (!this.canBuy(goods, count, shop.priceMultiplier)) { // 检查购买条件
      return false; // 条件不足
    } // 条件结束
    const unitPrice = this.getPrice(goods, shop.priceMultiplier); // 计算单价
    const totalPrice = unitPrice * count; // 计算总价
    this.inventory.add(GOLD_ITEM_ID, GOLD_ITEM_NAME, -totalPrice); // 扣除金币
    this.inventory.add(goods.id, goods.name, count); // 将商品加入背包
    if (goods.stock !== undefined) { // 如果商品有限库存
      goods.stock = goods.stock - count; // 减少库存
    } // 条件结束
    this.popup?.popup(0, 0, `购买 ${goods.name} x${count}`, '#88ff88'); // 可选飘字提示
    return true; // 返回成功
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public sell(shopId: string, goodsId: string, count: number): boolean { // 执行出售逻辑
    const shop = this.store.getShop(shopId); // 获取商店
    if (!shop || shop.type !== 'buySell') { // 检查商店类型
      return false; // 不支持则失败
    } // 条件结束
    const goods = getGoods(shop, goodsId); // 获取商品定义
    if (!goods || goods.sellable === false) { // 检查是否允许出售
      return false; // 不允许出售
    } // 条件结束
    if (!this.canSell(goodsId, count)) { // 检查背包数量
      return false; // 数量不足
    } // 条件结束
    const buyPrice = this.getPrice(goods, shop.priceMultiplier); // 计算购买价
    const sellPrice = Math.max(1, Math.floor(buyPrice * SELL_PRICE_RATIO)); // 计算出售单价
    const totalPrice = sellPrice * count; // 计算总收益
    this.inventory.add(goodsId, goods.name, -count); // 扣除背包物品
    this.inventory.add(GOLD_ITEM_ID, GOLD_ITEM_NAME, totalPrice); // 增加金币
    if (goods.maxStock !== undefined) { // 如果存在最大库存
      const currentStock = goods.stock ?? 0; // 获取当前库存
      goods.stock = Math.min(goods.maxStock, currentStock + count); // 增加库存但不超过上限
    } else if (goods.stock !== undefined) { // 如果只有当前库存字段
      goods.stock += count; // 简单增加库存
    } // 条件结束
    this.popup?.popup(0, 0, `出售 ${goods.name} x${count}`, '#ffdd66'); // 飘字提示
    return true; // 返回成功
  } // 方法结束
} // 类结束
