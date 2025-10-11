import { describe, it, expect } from 'vitest'; // 引入测试函数
import { Inventory } from '../systems/Inventory'; // 引入背包类
// 分隔注释 // 保持行有注释
describe('Inventory', () => { // 描述背包测试
  it('合并数量并支持序列化往返', () => { // 定义测试用例
    const bag = new Inventory(); // 创建背包
    bag.add('wood', '木头', 1); // 添加一次物品
    bag.add('wood', '木头', 2); // 再次添加同物品
    const items = bag.getAll(); // 获取物品列表
    expect(items[0]?.count).toBe(3); // 断言数量合并
    expect(bag.has('wood', 3)).toBe(true); // 断言查询数量
    const json = bag.toJSON(); // 序列化背包
    const restored = Inventory.fromJSON(json); // 反序列化背包
    expect(restored.has('wood', 3)).toBe(true); // 断言往返一致
  }); // 用例结束
}); // 描述结束
