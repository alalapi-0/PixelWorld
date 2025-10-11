import { beforeEach, expect, it, vi } from 'vitest'; // 引入测试框架工具函数

// 每个用例前重置模块缓存并清理全局覆盖
beforeEach(() => { // 设置前置钩子
  vi.resetModules(); // 重置模块缓存确保每次重新加载
  delete (globalThis as { __PIXELWORLD_AUTO_MOCK__?: unknown }).__PIXELWORLD_AUTO_MOCK__; // 清除测试覆盖数据
}); // 钩子结束

// 第一组测试：验证自动蓝图数据加载
it('should expose non empty auto blueprints when auto files exist', async () => { // 定义测试用例
  const loader = await import('../../src/config/AutoDataLoader'); // 动态加载自动数据模块
  const blueprints = loader.getAutoBlueprints(); // 获取自动蓝图列表
  expect(Array.isArray(blueprints)).toBe(true); // 断言返回结果为数组
  expect(blueprints.length).toBeGreaterThan(0); // 断言数组非空
}); // 用例结束

// 第二组测试：验证人工数据优先覆盖逻辑
it('should skip auto blueprint ids that conflict with manual overrides', async () => { // 定义测试用例
  const autoDataModule = await import('../../../../assets/auto/blueprints_auto.json'); // 读取自动蓝图原始JSON
  const firstId = (autoDataModule.blueprints?.[0]?.id ?? '') as string; // 提取首个自动蓝图ID
  expect(firstId.length).toBeGreaterThan(0); // 确保存在有效ID
  (globalThis as { __PIXELWORLD_AUTO_MOCK__?: unknown }).__PIXELWORLD_AUTO_MOCK__ = { // 写入测试覆盖数据
    blueprints: [ // 定义人工蓝图数组
      { id: firstId, name: '测试手动蓝图', tile: 'ROAD', cost: [] }, // 构造冲突蓝图
    ], // 数组结束
  }; // 覆盖结束
  const loader = await import('../../src/config/AutoDataLoader'); // 重新加载自动数据模块
  const blueprints = loader.getAutoBlueprints(); // 获取过滤后的自动蓝图
  const hasConflict = blueprints.some((item) => item.id === firstId); // 检查冲突ID是否仍存在
  expect(hasConflict).toBe(false); // 断言冲突条目被移除
}); // 用例结束

// 第三组测试：验证不会暴露二进制资源字段
it('should not expose binary resource fields in auto payload', async () => { // 定义测试用例
  const loader = await import('../../src/config/AutoDataLoader'); // 动态加载模块
  const blueprints = loader.getAutoBlueprints(); // 获取蓝图数据
  const shops = loader.getAutoShops(); // 获取商店数据
  const quests = loader.getAutoQuests(); // 获取任务数据
  const checkBinaryFlag = (entry: Record<string, unknown>) => { // 定义检查函数
    return 'url' in entry || 'path' in entry; // 若包含url/path认为触及二进制
  }; // 函数结束
  const blueprintHasBinary = blueprints.some((item) => checkBinaryFlag(item as Record<string, unknown>)); // 检查蓝图
  const shopHasBinary = shops.some((item) => checkBinaryFlag(item as Record<string, unknown>)); // 检查商店
  const questHasBinary = quests.some((item) => checkBinaryFlag(item as Record<string, unknown>)); // 检查任务
  expect(blueprintHasBinary).toBe(false); // 蓝图不应含二进制字段
  expect(shopHasBinary).toBe(false); // 商店不应含二进制字段
  expect(questHasBinary).toBe(false); // 任务不应含二进制字段
}); // 用例结束
