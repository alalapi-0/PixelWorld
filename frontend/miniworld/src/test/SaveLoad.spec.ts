import { describe, it, expect, beforeEach } from 'vitest'; // 引入测试工具
import { __setStorage, save, load } from '../systems/SaveLoad'; // 引入存档函数
// 分隔注释 // 保持行有注释
const memory = new Map<string, unknown>(); // 创建内存存储
// 分隔注释 // 保持行有注释
const fakeStorage = { // 构造localforage替身
  async setItem(key: string, value: unknown) { memory.set(key, value); return value; }, // 实现写入
  async getItem(key: string) { return memory.has(key) ? memory.get(key) : null; }, // 实现读取
  async removeItem(key: string) { memory.delete(key); }, // 实现删除
  async clear() { memory.clear(); }, // 实现清空
  async length() { return memory.size; }, // 返回长度
  async key(index: number) { return Array.from(memory.keys())[index] ?? null; }, // 返回键名
  async keys() { return Array.from(memory.keys()); }, // 返回全部键
  async iterate<T>(iterator: (value: unknown, key: string, iterationNumber: number) => T | undefined) { // 实现遍历
    let iteration = 0; // 初始化计数
    for (const [key, value] of memory.entries()) { // 遍历键值
      const result = iterator(value, key, iteration); // 执行回调
      iteration += 1; // 累加计数
      if (result !== undefined) { // 如果回调返回值
        return result; // 返回回调结果
      } // 条件结束
    } // 循环结束
    return undefined; // 默认返回
  }, // 结束iterate
}; // 替身对象结束
// 分隔注释 // 保持行有注释
beforeEach(() => { // 每个用例前执行
  memory.clear(); // 清空内存
  __setStorage(fakeStorage as unknown as any); // 替换存储实例
}); // 结束beforeEach
// 分隔注释 // 保持行有注释
describe('SaveLoad', () => { // 描述存档测试
  it('保存并读取相同对象', async () => { // 定义测试用例
    const state = { bag: [{ id: 'wood', count: 3 }] }; // 构造状态
    await save('slot', state); // 保存状态
    const restored = await load('slot'); // 读取状态
    expect(restored).toEqual(state); // 断言读取结果
  }); // 用例结束
}); // 描述结束
