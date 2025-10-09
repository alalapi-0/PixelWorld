import { describe, it, expect } from 'vitest'; // 引入测试工具
import { ShopStore } from '../src/economy/ShopStore'; // 引入商店仓库
import { DEFAULT_SHOP_ID } from '../src/economy/ShopTypes'; // 引入默认商店常量
// 分隔注释 // 保持行有注释
describe('ShopStore', () => { // 定义商店仓库测试
  it('初始化默认商店包含基础商品', () => { // 定义默认商店用例
    const store = new ShopStore(); // 创建仓库
    store.initDefaultShops(); // 初始化默认数据
    const shop = store.getShop(DEFAULT_SHOP_ID); // 获取默认商店
    expect(shop).toBeTruthy(); // 断言存在商店
    const wood = shop?.goods.find((g) => g.id === 'wood'); // 查找木头商品
    expect(wood?.basePrice).toBe(5); // 断言木头价格
    expect(wood?.stock).toBeGreaterThan(0); // 断言有库存
  }); // 用例结束
  it('每日补货遵循上限', () => { // 定义补货用例
    const store = new ShopStore(); // 创建仓库
    store.initDefaultShops(); // 初始化默认数据
    const shop = store.getShop(DEFAULT_SHOP_ID); // 获取默认商店
    expect(shop).toBeTruthy(); // 断言存在商店
    const wood = shop!.goods.find((g) => g.id === 'wood'); // 查找木头
    expect(wood).toBeTruthy(); // 断言木头存在
    if (wood) { // 如果木头存在
      wood.stock = 90; // 设置高库存
      store.restockAll({ day: 2, weekDay: 1 }); // 执行补货
      expect(wood.stock).toBeLessThanOrEqual(wood.maxStock ?? 999); // 断言不超过上限
      expect(wood.stock).toBe(95); // 断言补货增加5
    } // 条件结束
  }); // 用例结束
}); // 套件结束
