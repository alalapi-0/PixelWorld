import Phaser from 'phaser'; // 引入Phaser类型
import { describe, it, expect, beforeEach } from 'vitest'; // 引入测试工具
import { AchievementManager, __setAchievementStorage } from '../src/ui/achievements/AchievementManager'; // 引入成就管理器
// 分隔注释 // 保持行有注释
const memory = new Map<string, unknown>(); // 内存存储
// 分隔注释 // 保持行有注释
const fakeStorage = { // 构造localforage替身
  async setItem(key: string, value: unknown) { memory.set(key, value); return value; }, // 写入数据
  async getItem(key: string) { return memory.has(key) ? memory.get(key) : null; }, // 读取数据
  async removeItem(key: string) { memory.delete(key); }, // 移除数据
  async clear() { memory.clear(); }, // 清空数据
  async length() { return memory.size; }, // 返回长度
  async key(index: number) { return Array.from(memory.keys())[index] ?? null; }, // 返回键名
  async keys() { return Array.from(memory.keys()); }, // 返回所有键
  async iterate<T>(iterator: (value: unknown, key: string, iterationNumber: number) => T | undefined) { // 遍历函数
    let idx = 0; // 初始化计数
    for (const [key, value] of memory.entries()) { // 遍历条目
      const result = iterator(value, key, idx); // 调用回调
      idx += 1; // 递增计数
      if (result !== undefined) { // 如果返回值
        return result; // 返回结果
      } // 条件结束
    } // 循环结束
    return undefined; // 默认返回
  }, // 函数结束
}; // 替身结束
// 分隔注释 // 保持行有注释
beforeEach(() => { // 每个用例前执行
  memory.clear(); // 清空存储
  __setAchievementStorage(fakeStorage as unknown as any); // 替换存储实例
  (globalThis as { fetch?: typeof fetch }).fetch = undefined; // 禁用fetch触发内置示例
}); // 结束
// 分隔注释 // 保持行有注释
describe('AchievementManager', () => { // 定义测试套件
  it('根据采集与事件解锁并保持状态', async () => { // 定义用例
    const manager = new AchievementManager(); // 创建管理器
    await manager.loadDefs({} as Phaser.Scene); // 加载定义
    await manager.load(); // 读取状态
    manager.onCollect('wood', 10); // 提交采集
    expect(manager.isUnlocked('gather_wood_10')).toBe(true); // 断言收集成就
    manager.onEvent('save_once'); // 触发事件
    expect(manager.isUnlocked('first_save')).toBe(true); // 断言事件成就
    await manager.save(); // 手动保存
    const managerNext = new AchievementManager(); // 创建新实例
    await managerNext.loadDefs({} as Phaser.Scene); // 重新加载定义
    await managerNext.load(); // 载入存储
    expect(managerNext.isUnlocked('gather_wood_10')).toBe(true); // 验证持久化
    expect(managerNext.isUnlocked('first_save')).toBe(true); // 验证第二个成就
  }); // 用例结束
}); // 套件结束
