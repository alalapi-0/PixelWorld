import { describe, expect, it } from 'vitest'; // 引入测试工具
import { AgentAPI } from '../../src/build/AgentAPI'; // 引入任务队列
import { Inventory } from '../../src/systems/Inventory'; // 引入仓储
import { AgentLog } from '../../src/agents/AgentLog'; // 引入日志
import { WorkerPlanner } from '../../src/agents/WorkerPlanner'; // 引入规划器
import { WorkerAgent } from '../../src/agents/WorkerAgent'; // 引入工人
import { WorkCalendar } from '../../src/time/WorkCalendar'; // 引入日历
import { TimeSystem } from '../../src/time/TimeSystem'; // 引入时间系统
// 空行用于分隔
class MockClock { // 定义模拟时钟
  private current: Date; // 当前时间
  public system: TimeSystem; // 暴露时间系统
  public constructor() { // 构造函数
    this.current = new Date(2025, 0, 1, 7, 0, 0, 0); // 初始化时间
    this.system = new TimeSystem(() => this.current); // 通过提供器创建时间系统
  } // 构造结束
  public set(hour: number, minute: number, dayOffset = 0): void { // 设置当前时间
    this.current = new Date(2025, 0, 1 + dayOffset, hour, minute, 0, 0); // 更新时间
  } // 方法结束
} // 类结束
// 空行用于分隔
describe('工人时间策略', () => { // 描述测试套件
  it('非工作时段排队等待', () => { // 测试排队
    const clock = new MockClock(); // 创建时钟
    const api = new AgentAPI(); // 创建任务队列
    const inventory = new Inventory(); // 创建仓储
    const log = new AgentLog(); // 创建日志
    const planner = new WorkerPlanner(); // 创建规划器
    const calendar = new WorkCalendar({ workHours: '08:00-18:00' }, clock.system); // 创建日历
    const worker = new WorkerAgent(api, inventory, planner, log, { calendar, timeSystem: clock.system }); // 创建工人
    const record = api.submitTask({ type: 'build', x: 3, y: 3, blueprintId: 'road', timeWindow: { start: '08:00', end: '18:00' } }); // 提交任务
    api.approve(record.id); // 审批通过
    worker.tick(); // 执行一次
    expect(api.get(record.id)?.state).toBe('approved'); // 应保持批准状态
    expect(api.get(record.id)?.reason).toContain('等待'); // 原因包含等待
    clock.set(9, 0); // 调整到工作时段
    worker.tick(); // 再次执行
    worker.tick(); // 再跑一轮以完成动作
    expect(api.get(record.id)?.state).toBe('executed'); // 应完成任务
  }); // 测试结束
  it('宵禁静音任务改期', () => { // 测试宵禁
    const clock = new MockClock(); // 创建时钟
    clock.set(23, 0); // 设置到宵禁时段
    const api = new AgentAPI(); // 创建任务队列
    const inventory = new Inventory(); // 创建仓储
    const log = new AgentLog(); // 创建日志
    const planner = new WorkerPlanner(); // 创建规划器
    const calendar = new WorkCalendar({ workHours: '00:00-23:59', curfew: '22:00-06:00', quietTasks: ['build_house'] }, clock.system); // 创建含宵禁日历
    const worker = new WorkerAgent(api, inventory, planner, log, { calendar, timeSystem: clock.system }); // 创建工人
    const record = api.submitTask({ type: 'build', x: 1, y: 1, blueprintId: 'build_house' }); // 提交静音建造
    api.approve(record.id); // 审批通过
    worker.tick(); // 执行一次
    expect(api.get(record.id)?.state).toBe('approved'); // 仍保持批准
    expect(api.get(record.id)?.reason).toContain('curfew'); // 原因包含宵禁
    clock.set(8, 30, 1); // 调整至下一工作日
    worker.tick(); // 再次执行
    worker.tick(); // 再跑一轮以完成动作
    expect(api.get(record.id)?.state).toBe('executed'); // 应完成任务
  }); // 测试结束
  it('超时任务记录绩效', () => { // 测试超时
    const clock = new MockClock(); // 创建时钟
    clock.set(17, 50); // 设置接近截止
    const api = new AgentAPI(); // 创建任务队列
    const inventory = new Inventory(); // 创建仓储
    const log = new AgentLog(); // 创建日志
    const planner = new WorkerPlanner(); // 创建规划器
    const calendar = new WorkCalendar({ workHours: '08:00-18:00' }, clock.system); // 创建日历
    const worker = new WorkerAgent(api, inventory, planner, log, { calendar, timeSystem: clock.system }); // 创建工人
    const record = api.submitTask({ type: 'build', x: 5, y: 5, blueprintId: 'tower', deadline: { atClock: '17:55' } }); // 提交带截止任务
    api.approve(record.id); // 审批通过
    worker.tick(); // 执行一次
    expect(api.get(record.id)?.reason).toContain('perf:overtime'); // 应标记超时
    expect(worker.getPerformance().overtime).toBeGreaterThanOrEqual(1); // 绩效统计包含超时
  }); // 测试结束
}); // 套件结束
