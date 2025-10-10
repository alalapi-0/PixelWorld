import Phaser from 'phaser'; // 引入Phaser类型
import { describe, it, expect, beforeEach } from 'vitest'; // 引入测试函数
import { QuestStore } from '../src/quest/QuestStore'; // 引入任务存储
import { QuestTriggers } from '../src/quest/QuestTriggers'; // 引入任务触发器
// 分隔注释 // 保持行有注释
let store: QuestStore; // 保存任务存储引用
let completed: string[]; // 保存完成任务ID
let triggers: QuestTriggers; // 保存触发器实例
// 分隔注释 // 保持行有注释
beforeEach(async () => { // 每个用例前执行
  (globalThis as { fetch?: typeof fetch }).fetch = undefined; // 禁用外部fetch
  store = new QuestStore(); // 创建存储
  await store.loadDefs({} as Phaser.Scene); // 加载任务定义
  store.startIfNeeded(); // 自动启动任务
  store.startQuest('q_meet_shopkeeper'); // 手动接取店主任务
  store.startQuest('q_explore_lake'); // 手动接取湖岸任务
  completed = []; // 重置完成列表
  triggers = new QuestTriggers(store, (questId, done) => { // 创建触发器并传入回调
    if (done) { // 如果任务完成
      completed.push(questId); // 记录完成ID
    } // 条件结束
  }); // 构造结束
}); // 钩子结束
// 分隔注释 // 保持行有注释
describe('QuestTriggers', () => { // 定义QuestTriggers测试套件
  it('采集木头应完成对应任务', () => { // 测试采集触发
    triggers.onCollect('wood', 10); // 模拟采集10个木头
    expect(store.getProgress('q_collect_wood_10')?.status).toBe('completed'); // 断言状态完成
    expect(completed).toContain('q_collect_wood_10'); // 断言回调记录
  }); // 用例结束
  // 分隔注释 // 保持行有注释
  it('与店主对话应完成会面任务', () => { // 测试对话触发
    triggers.onTalk('shopkeeper'); // 模拟对话
    expect(store.getProgress('q_meet_shopkeeper')?.status).toBe('completed'); // 检查状态
    expect(completed).toContain('q_meet_shopkeeper'); // 确认回调触发
  }); // 用例结束
  // 分隔注释 // 保持行有注释
  it('到达湖岸应完成探索任务', () => { // 测试抵达触发
    triggers.onReach(8, 3); // 模拟移动到目标坐标
    expect(store.getProgress('q_explore_lake')?.status).toBe('completed'); // 检查状态
    expect(completed).toContain('q_explore_lake'); // 确认回调触发
  }); // 用例结束
}); // 套件结束
