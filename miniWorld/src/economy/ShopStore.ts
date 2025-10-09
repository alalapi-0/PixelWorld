import { Goods, Shop, DEFAULT_SHOP_ID } from './ShopTypes'; // 引入类型和常量
// 分隔注释 // 保持行有注释
function cloneGoodsList(list: Goods[]): Goods[] { // 定义工具函数用于深拷贝商品列表
  return list.map((goods) => ({ ...goods })); // 对每个商品执行浅拷贝返回新数组
} // 函数结束
// 分隔注释 // 保持行有注释
export class ShopStore { // 定义商店仓库类
  private shops: Map<string, Shop>; // 存储商店映射
  // 分隔注释 // 保持行有注释
  public constructor() { // 构造函数
    this.shops = new Map(); // 初始化映射
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public initDefaultShops(): void { // 初始化默认商店数据
    const general: Shop = { // 构造杂货铺数据
      id: DEFAULT_SHOP_ID, // 设置商店ID
      name: '杂货铺', // 设置商店名称
      type: 'buySell', // 支持买卖
      priceMultiplier: 1, // 默认价格系数
      restockRule: { daily: 5 }, // 设置每日补货数量
      goods: [ // 定义在售商品数组
        { id: 'wood', name: '木头', kind: 'material', basePrice: 5, stock: 30, maxStock: 99, buyable: true, sellable: true }, // 木头商品
        { id: 'rock', name: '石头', kind: 'material', basePrice: 8, stock: 20, maxStock: 99, buyable: true, sellable: true }, // 石头商品
        { id: 'seed', name: '种子', kind: 'item', basePrice: 15, stock: 15, maxStock: 60, buyable: true, sellable: false }, // 种子商品
      ], // 商品数组结束
    }; // 商店对象结束
    this.shops.set(general.id, general); // 保存杂货铺到映射
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getShop(id: string): Shop | undefined { // 根据ID获取商店
    const shop = this.shops.get(id); // 查找映射
    if (!shop) { // 如果不存在
      return undefined; // 返回未定义
    } // 条件结束
    return shop; // 返回商店引用
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public listShops(): Shop[] { // 获取商店列表
    return Array.from(this.shops.values()).map((shop) => ({ ...shop, goods: cloneGoodsList(shop.goods) })); // 返回复制后的数组
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public restockAll(currentDate: { day: number; weekDay: number }): void { // 根据规则执行补货
    this.shops.forEach((shop) => { // 遍历每个商店
      if (!shop.restockRule) { // 如果没有补货规则
        return; // 跳过处理
      } // 条件结束
      if (shop.restockRule.dayOfWeek && !shop.restockRule.dayOfWeek.includes(currentDate.weekDay)) { // 检查周几限制
        return; // 不满足时跳过
      } // 条件结束
      const restockAmount = shop.restockRule.daily ?? 0; // 读取每日补货数量
      if (restockAmount <= 0) { // 如果无补货数量
        return; // 结束处理
      } // 条件结束
      shop.goods.forEach((goods) => { // 遍历商店商品
        if (goods.maxStock === undefined) { // 如果无最大库存
          return; // 视为无限库存跳过补货
        } // 条件结束
        const currentStock = goods.stock ?? 0; // 读取当前库存
        const nextStock = Math.min(goods.maxStock, currentStock + restockAmount); // 计算补货后库存
        goods.stock = nextStock; // 写回库存
      }); // 遍历结束
    }); // 遍历结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public toJSON(): { shops: Shop[] } { // 序列化商店数据
    return { shops: Array.from(this.shops.values()).map((shop) => ({ ...shop, goods: cloneGoodsList(shop.goods) })) }; // 返回深拷贝结构
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public static fromJSON(json: { shops?: Shop[] } | undefined): ShopStore { // 从JSON恢复商店
    const store = new ShopStore(); // 创建新实例
    store.shops.clear(); // 清空默认数据
    if (!json?.shops || json.shops.length === 0) { // 如果没有数据
      store.initDefaultShops(); // 使用默认商店
      return store; // 返回实例
    } // 条件结束
    json.shops.forEach((shop) => { // 遍历输入数据
      const restored: Shop = { ...shop, goods: cloneGoodsList(shop.goods ?? []) }; // 克隆商店和商品
      store.shops.set(restored.id, restored); // 写入映射
    }); // 遍历结束
    return store; // 返回实例
  } // 方法结束
} // 类结束
