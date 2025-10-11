// 引入vitest工具函数
import { describe, it, expect, vi, beforeEach } from 'vitest'; // 引入测试框架API
// 引入热重载事件总线
import { HotReloadBus, emitAutoChanged } from '../../src/runtime/HotReloadBus'; // 引入事件工具
// 引入自动数据监听器
import { AutoDataWatcher } from '../../src/runtime/AutoDataWatcher'; // 引入轮询器
// 引入运行时仓库
import { BlueprintStoreRuntime } from '../../src/runtime/stores/BlueprintStore'; // 引入蓝图仓库
import { ShopStoreRuntime } from '../../src/runtime/stores/ShopStoreRuntime'; // 引入商店仓库
import { QuestStoreRuntime } from '../../src/runtime/stores/QuestStoreRuntime'; // 引入任务仓库

// 重置事件监听器以避免测试间干扰
beforeEach(() => { // 在每个测试前执行
  const handler = () => undefined; // 创建占位函数
  HotReloadBus.on('autoChanged', handler); // 注册占位监听器
  HotReloadBus.off('autoChanged', handler); // 立即移除确保清理
}); // 钩子结束

// 定义测试套件
describe('AutoDataWatcher 热重载链路', () => { // 描述测试场景
  it('在哈希发生变化时发出事件', async () => { // 定义事件触发测试
    const fetcher = vi // 使用vitest mock
      .fn<[], Promise<Record<string, { sha1?: string }>>>() // 声明返回类型
      .mockResolvedValueOnce({ 'assets/auto/blueprints_auto.json': { sha1: 'v1' } }) // 首次返回旧哈希
      .mockResolvedValueOnce({ 'assets/auto/blueprints_auto.json': { sha1: 'v2' } }); // 第二次返回新哈希
    const emitter = vi.fn(); // 创建模拟事件触发器
    const watcher = new AutoDataWatcher({ fetcher, emitter }); // 使用mock依赖创建监听器
    await watcher.checkOnce(); // 首次轮询建立基线
    await watcher.checkOnce(); // 第二次轮询应触发事件
    expect(emitter).toHaveBeenCalledTimes(1); // 断言只触发一次
    expect(emitter.mock.calls[0][0].changed).toEqual(['assets/auto/blueprints_auto.json']); // 断言变更文件列表
  }); // 测试结束

  it('事件总线可广播给订阅者', () => { // 定义事件广播测试
    const payload = { changed: ['demo.json'], timestamp: 1 }; // 构造事件负载
    const listener = vi.fn(); // 创建监听器
    HotReloadBus.on('autoChanged', listener); // 注册监听
    emitAutoChanged(payload); // 触发事件
    expect(listener).toHaveBeenCalledWith(payload); // 确认监听器收到负载
    HotReloadBus.off('autoChanged', listener); // 移除监听器
  }); // 测试结束

  it('三大仓库在热重载后保持玩家状态', () => { // 定义仓库状态测试
    const blueprintStore = new BlueprintStoreRuntime(); // 创建蓝图仓库
    blueprintStore.load([{ id: 'a', name: 'A' } as unknown as { id: string; name: string }]); // 加载初始蓝图
    const shopStore = new ShopStoreRuntime(); // 创建商店仓库
    shopStore.load([{ id: 'shop', name: '商店', type: 'buy', goods: [{ id: 'item', name: '物品', kind: 'item', basePrice: 10 }] }]); // 加载初始商店
    shopStore.setBalance(123); // 记录金币余额
    shopStore.setStock('item', 5); // 设置库存
    const questStore = new QuestStoreRuntime(); // 创建任务仓库
    questStore.load([{ id: 'quest', kind: 'main', title: '任务', desc: '描述', steps: [] }]); // 加载初始任务
    questStore.setProgress({ questId: 'quest', status: 'completed', currentStepIndex: 0, counters: {}, tracked: false }); // 标记已完成

    emitAutoChanged({ changed: ['assets/auto/blueprints_auto.json'], timestamp: Date.now() }); // 模拟事件触发

    blueprintStore.reloadFrom([{ id: 'b', name: 'B' } as unknown as { id: string; name: string }]); // 使用新数据重载蓝图
    shopStore.reloadFrom([{ id: 'shop', name: '商店', type: 'buy', goods: [] }]); // 使用新数据重载商店
    questStore.reloadFrom([{ id: 'quest', kind: 'main', title: '任务', desc: '更新', steps: [] }]); // 使用新数据重载任务

    expect(shopStore.getBalance()).toBe(123); // 确认金币余额未丢失
    expect(shopStore.getStock('item')).toBe(5); // 确认库存仍在
    expect(questStore.getProgress('quest')?.status).toBe('completed'); // 确认任务完成状态保留
    expect(blueprintStore.isBlueprintArchived('a')).toBe(true); // 确认旧蓝图被标记下线
  }); // 测试结束
}); // 套件结束
