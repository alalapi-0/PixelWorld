// 引入vitest工具函数
import { describe, it, expect } from 'vitest'; // 使用vitest断言
// 引入蓝图仓库
import { BlueprintStoreRuntime } from '../../src/runtime/stores/BlueprintStore'; // 引入蓝图运行时仓库
// 引入商店仓库
import { ShopStoreRuntime } from '../../src/runtime/stores/ShopStoreRuntime'; // 引入商店运行时仓库
// 引入任务仓库
import { QuestStoreRuntime } from '../../src/runtime/stores/QuestStoreRuntime'; // 引入任务运行时仓库

// 定义蓝图仓库测试
describe('BlueprintStoreRuntime 热重载', () => { // 描述蓝图热重载行为
  it('在替换数据时标记下线蓝图', () => { // 定义下线检测测试
    const store = new BlueprintStoreRuntime(); // 创建蓝图仓库
    store.load([{ id: 'old', name: '旧蓝图' } as unknown as { id: string; name: string }]); // 加载初始数据
    const versionBefore = store.getVersion(); // 记录初始版本
    store.reloadFrom([{ id: 'new', name: '新蓝图' } as unknown as { id: string; name: string }]); // 使用新数据重载
    expect(store.isBlueprintArchived('old')).toBe(true); // 断言旧蓝图被归档
    expect(store.getBlueprints().map((bp) => bp.id)).toEqual(['new']); // 断言新蓝图生效
    expect(store.getVersion()).not.toBe(versionBefore); // 断言版本号发生变化
  }); // 测试结束
}); // 套件结束

// 定义商店仓库测试
describe('ShopStoreRuntime 热重载', () => { // 描述商店热重载行为
  it('在重载后保留库存与余额', () => { // 定义库存保留测试
    const store = new ShopStoreRuntime(); // 创建商店仓库
    store.load([{ id: 'shop', name: '杂货店', type: 'buySell', goods: [{ id: 'apple', name: '苹果', kind: 'food', basePrice: 5, stock: 3 }] }]); // 加载初始商店
    store.setBalance(200); // 设置初始余额
    store.setStock('apple', 7); // 覆盖库存
    store.reloadFrom([{ id: 'shop', name: '杂货店', type: 'buySell', goods: [{ id: 'apple', name: '苹果', kind: 'food', basePrice: 6 }] }]); // 使用新定义重载
    expect(store.getBalance()).toBe(200); // 确认余额保留
    expect(store.getStock('apple')).toBe(7); // 确认库存保留
    expect(store.isGoodsDiscontinued('apple')).toBe(false); // 确认仍为在售商品
    store.reloadFrom([]); // 再次重载为空以模拟下架
    expect(store.isGoodsDiscontinued('apple')).toBe(true); // 断言商品被标记下架
  }); // 测试结束
}); // 套件结束

// 定义任务仓库测试
describe('QuestStoreRuntime 热重载', () => { // 描述任务热重载行为
  it('在重载后保留进度并归档下线任务', () => { // 定义进度保留测试
    const store = new QuestStoreRuntime(); // 创建任务仓库
    store.load([{ id: 'questA', kind: 'main', title: '任务A', desc: '描述', steps: [], autoStart: false }]); // 加载初始任务
    store.setProgress({ questId: 'questA', status: 'completed', currentStepIndex: 1, counters: {}, tracked: true }); // 人为设置完成进度
    store.reloadFrom([{ id: 'questB', kind: 'main', title: '任务B', desc: '描述', steps: [], autoStart: true }]); // 使用新任务重载
    expect(store.isQuestArchived('questA')).toBe(true); // 断言旧任务被归档
    expect(store.getProgress('questA')?.status).toBe('completed'); // 确认旧任务进度保留
    expect(store.getProgress('questB')?.status).toBe('active'); // 确认新任务根据autoStart自动激活
  }); // 测试结束
}); // 套件结束
