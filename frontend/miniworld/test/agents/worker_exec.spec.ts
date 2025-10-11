import { describe, expect, it, vi } from 'vitest'; // 引入测试框架
import { AgentAPI } from '../../src/build/AgentAPI'; // 引入任务队列
import { Inventory } from '../../src/systems/Inventory'; // 引入仓储
import { WorkerPlanner } from '../../src/agents/WorkerPlanner'; // 引入规划器
import { AgentLog } from '../../src/agents/AgentLog'; // 引入日志
import { WorkerAgent } from '../../src/agents/WorkerAgent'; // 引入工人
// 空行用于分隔
describe('WorkerAgent execution', () => { // 描述工人执行测试
  it('should process build, collect and haul tasks', () => { // 测试执行流程
    const api = new AgentAPI(); // 创建任务队列
    const inventory = new Inventory(); // 创建仓储
    inventory.add('wood', '木材', 5); // 初始化木材库存
    const planner = new WorkerPlanner(); // 创建规划器
    const log = new AgentLog(); // 创建日志
    const worker = new WorkerAgent(api, inventory, planner, log); // 创建工人
    const buildFn = vi.fn(() => true); // 创建建造模拟函数
    worker.setBuildExecutor(buildFn); // 设置建造执行器
    const buildRecord = api.submitTask({ type: 'build', x: 1, y: 2, blueprintId: 'tree' }, {}); // 提交建造任务
    api.approve(buildRecord.id); // 审批通过
    worker.tick(); // 执行一次
    expect(buildFn).toHaveBeenCalled(); // 断言建造被调用
    const collectRecord = api.submitTask({ type: 'collect', itemId: 'stone', count: 3, from: { x: 0, y: 0 }, to: 'STOCKPILE' }, {}); // 提交采集
    api.approve(collectRecord.id); // 审批采集
    worker.tick(); // 执行采集
    expect(inventory.getCount('stone')).toBe(3); // 断言仓储增加
    const haulRecord = api.submitTask({ type: 'haul', itemId: 'wood', count: 2, from: 'STOCKPILE', to: { x: 2, y: 2 } }, {}); // 提交搬运
    api.approve(haulRecord.id); // 审批搬运
    worker.tick(); // 执行搬运
    expect(inventory.getCount('wood')).toBe(3); // 断言木材减少
    expect(log.list().length).toBeGreaterThan(0); // 断言日志有记录
  }); // 测试结束
}); // 描述结束
