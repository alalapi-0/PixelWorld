import Phaser from 'phaser'; // 引入Phaser类型
import { describe, it, expect, beforeEach } from 'vitest'; // 引入测试工具
import { QuestStore } from '../src/quest/QuestStore'; // 引入任务存储类
// 分隔注释 // 保持行有注释
let store: QuestStore; // 存储测试用任务仓库
// 分隔注释 // 保持行有注释
beforeEach(async () => { // 在每个用例前执行
  (globalThis as { fetch?: typeof fetch }).fetch = undefined; // 禁用外部fetch以使用内置示例
  store = new QuestStore(); // 创建任务存储实例
  await store.loadDefs({} as Phaser.Scene); // 加载任务定义
  store.startIfNeeded(); // 自动启动必要任务
}); // 钩子结束
// 分隔注释 // 保持行有注释
describe('QuestStore', () => { // 定义QuestStore测试套件
  it('自动启动的任务应进入进行中状态', () => { // 测试自动启动任务状态
    const progress = store.getProgress('q_collect_wood_10'); // 查询木头任务进度
    expect(progress?.status).toBe('active'); // 断言状态为进行中
  }); // 用例结束
  // 分隔注释 // 保持行有注释
  it('收集进度满足后应标记完成', () => { // 测试收集任务推进
    const progress = store.getProgress('q_collect_wood_10'); // 获取任务进度
    expect(progress).toBeDefined(); // 确保存在进度
    if (!progress) { // TypeScript保护
      return; // 避免继续执行
    } // 条件结束
    progress.counters['s1'] = 10; // 手动填入计数达标
    const advanced = store.advanceIfComplete('q_collect_wood_10'); // 尝试推进
    expect(advanced).toBe(true); // 断言返回推进
    expect(progress.status).toBe('completed'); // 断言状态完成
  }); // 用例结束
  // 分隔注释 // 保持行有注释
  it('toggleTrack应在追踪标记之间切换', () => { // 测试追踪切换
    store.toggleTrack('q_collect_wood_10'); // 切换追踪
    expect(store.getProgress('q_collect_wood_10')?.tracked).toBe(true); // 断言已追踪
    store.toggleTrack('q_collect_wood_10'); // 再次切换
    expect(store.getProgress('q_collect_wood_10')?.tracked).toBe(false); // 断言取消追踪
  }); // 用例结束
}); // 套件结束
