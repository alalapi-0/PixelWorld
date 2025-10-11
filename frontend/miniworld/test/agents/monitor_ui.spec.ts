import { describe, expect, it } from 'vitest'; // 引入测试框架
import { AgentAPI } from '../../src/build/AgentAPI'; // 引入任务队列
import { AgentLog } from '../../src/agents/AgentLog'; // 引入日志
import { AgentMonitor } from '../../src/ui/tools/AgentMonitor'; // 引入监控面板
// 空行用于分隔
describe('AgentMonitor controls', () => { // 描述监控面板测试
  it('should pause resume and cancel tasks', () => { // 测试状态切换
    const api = new AgentAPI(); // 创建任务队列
    const log = new AgentLog(); // 创建日志
    const monitor = new AgentMonitor(api, log); // 创建监控面板
    const record = api.submitTask({ type: 'build', x: 1, y: 1, blueprintId: 'tree' }, {}); // 提交任务
    api.approve(record.id); // 标记批准
    monitor.pause(record.id); // 执行暂停
    expect(api.get(record.id)?.state).toBe('pending'); // 断言状态回退
    monitor.resume(record.id); // 执行恢复
    expect(api.get(record.id)?.state).toBe('approved'); // 断言状态恢复
    monitor.cancel(record.id); // 执行取消
    expect(api.get(record.id)?.state).toBe('rejected'); // 断言状态为拒绝
  }); // 测试结束
}); // 描述结束
