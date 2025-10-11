import Phaser from 'phaser'; // 引入Phaser类型
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'; // 引入测试工具
import sample from '../src/ui/glossary/glossary.sample.json'; // 引入示例数据
import { loadGlossary, getCategories, getEntriesByCat, __resetGlossaryStore } from '../src/ui/glossary/GlossaryStore'; // 引入图鉴接口
// 分隔注释 // 保持行有注释
let originalFetch: typeof fetch | undefined; // 保存原始fetch
// 分隔注释 // 保持行有注释
beforeEach(() => { // 每次用例前执行
  originalFetch = globalThis.fetch; // 保存原始fetch
  globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => sample }) as Response) as typeof fetch; // 模拟外部加载
  __resetGlossaryStore(); // 重置存储
}); // 结束
// 分隔注释 // 保持行有注释
afterEach(() => { // 每次用例后执行
  globalThis.fetch = originalFetch!; // 还原fetch
  __resetGlossaryStore(); // 再次重置
}); // 结束
// 分隔注释 // 保持行有注释
describe('GlossaryStore', () => { // 定义测试套件
  it('加载并返回分类与条目', async () => { // 定义用例
    await loadGlossary({} as Phaser.Scene); // 调用加载
    const categories = getCategories(); // 获取分类
    expect(categories[0]?.name).toBe('世界'); // 断言分类名称
    const items = getEntriesByCat('items'); // 获取物品分类
    expect(items[0]?.name).toBe('木头'); // 断言条目名称
  }); // 用例结束
}); // 套件结束
