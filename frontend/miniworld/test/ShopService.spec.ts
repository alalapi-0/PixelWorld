import { describe, it, expect } from 'vitest'; // 引入测试工具
import { ShopStore } from '../src/economy/ShopStore'; // 引入商店仓库
import { ShopService } from '../src/economy/ShopService'; // 引入商店服务
import { DEFAULT_SHOP_ID, GOLD_ITEM_ID, GOLD_ITEM_NAME } from '../src/economy/ShopTypes'; // 引入常量
import { Inventory } from '../src/systems/Inventory'; // 引入背包
// 分隔注释 // 保持行有注释
describe('ShopService', () => { // 定义商店服务测试
  it('购买和出售商品更新背包与金币', () => { // 定义核心交易用例
    const store = new ShopStore(); // 创建商店仓库
    store.initDefaultShops(); // 初始化默认商店
    const inventory = new Inventory(); // 创建背包
    inventory.add(GOLD_ITEM_ID, GOLD_ITEM_NAME, 100); // 给予金币
    const service = new ShopService(store, inventory); // 创建商店服务
    const shop = store.getShop(DEFAULT_SHOP_ID); // 获取默认商店
    expect(shop).toBeTruthy(); // 断言商店存在
    const buyResult = service.buy(DEFAULT_SHOP_ID, 'wood', 3); // 购买三份木头
    expect(buyResult).toBe(true); // 断言购买成功
    const goldAfterBuy = inventory.getAll().find((item) => item.id === GOLD_ITEM_ID)?.count ?? 0; // 获取剩余金币
    expect(goldAfterBuy).toBe(85); // 断言金币减少
    const woodAfterBuy = inventory.getAll().find((item) => item.id === 'wood')?.count ?? 0; // 获取木头数量
    expect(woodAfterBuy).toBe(3); // 断言获得木头
    const sellResult = service.sell(DEFAULT_SHOP_ID, 'wood', 2); // 出售两份木头
    expect(sellResult).toBe(true); // 断言出售成功
    const goldAfterSell = inventory.getAll().find((item) => item.id === GOLD_ITEM_ID)?.count ?? 0; // 再次获取金币
    expect(goldAfterSell).toBe(89); // 断言金币回升
    const woodAfterSell = inventory.getAll().find((item) => item.id === 'wood')?.count ?? 0; // 再次获取木头
    expect(woodAfterSell).toBe(1); // 断言木头减少
  }); // 用例结束
  it('余额不足时禁止购买', () => { // 定义余额检查用例
    const store = new ShopStore(); // 创建商店仓库
    store.initDefaultShops(); // 初始化默认商店
    const inventory = new Inventory(); // 创建背包
    inventory.add(GOLD_ITEM_ID, GOLD_ITEM_NAME, 0); // 零金币
    const service = new ShopService(store, inventory); // 创建服务
    const result = service.buy(DEFAULT_SHOP_ID, 'wood', 1); // 尝试购买
    expect(result).toBe(false); // 断言失败
  }); // 用例结束
}); // 套件结束
