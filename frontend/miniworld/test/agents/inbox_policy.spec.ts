import { describe, expect, it } from 'vitest'; // 引入测试框架
import { CommanderInbox } from '../../src/agents/CommanderInbox'; // 引入收件箱
import { AgentAPI } from '../../src/build/AgentAPI'; // 引入任务队列
import { AgentLog } from '../../src/agents/AgentLog'; // 引入日志
import { CommandPolicy } from '../../src/agents/CommandTypes'; // 引入策略类型
// 空行用于分隔
const policy: CommandPolicy = { // 自定义策略
  maxApprovedPerMinute: 1, // 每分钟最多一条
  maxConcurrency: 1, // 最大并发一条
  forbiddenZones: [{ x1: 0, y1: 0, x2: 0, y2: 0 }], // 禁止原点
  allowedTasks: ['build', 'collect', 'haul'], // 允许的任务类型
}; // 策略结束
// 空行用于分隔
describe('CommanderInbox policies', () => { // 描述策略测试
  it('should reject commands in forbidden zone', () => { // 测试禁区
    const inbox = new CommanderInbox(new AgentAPI(), new AgentLog(), policy); // 构造收件箱
    const result = inbox.submit('BUILD tree at (0,0)', 'emperor'); // 提交命令
    expect(result.entries.length).toBe(0); // 断言无通过
    expect(result.issues[0]?.message).toContain('禁区'); // 断言提示禁区
  }); // 测试结束
  it('should enforce rate limit', () => { // 测试频率限制
    const api = new AgentAPI(); // 创建任务队列
    const inbox = new CommanderInbox(api, new AgentLog(), policy); // 构造收件箱
    inbox.submit('BUILD tree at (1,1)', 'emperor'); // 提交第一条
    const result = inbox.submit('BUILD tree at (2,2)', 'emperor'); // 提交第二条
    expect(result.entries.length).toBe(0); // 断言第二条未进入
    expect(result.issues.some((issue) => issue.message.includes('上限'))).toBe(true); // 断言存在频率错误
  }); // 测试结束
  // 空行用于分隔
  it('should enforce concurrency cap across queue', () => { // 测试并发上限
    const relaxedPolicy: CommandPolicy = { ...policy, maxApprovedPerMinute: 5 }; // 复制策略并放宽频率
    const api = new AgentAPI(); // 创建任务队列
    const inbox = new CommanderInbox(api, new AgentLog(), relaxedPolicy); // 构造收件箱
    const firstResult = inbox.submit('BUILD tree at (1,1)', 'emperor'); // 提交首条命令
    expect(firstResult.entries.length).toBe(1); // 断言首条命令被接受
    const firstRecord = api.list()[0]; // 读取任务记录
    if (!firstRecord) { // 如果未找到记录
      throw new Error('未能获取首个任务记录'); // 抛出错误方便调试
    } // 条件结束
    api.approve(firstRecord.id); // 将任务标记为已审批占用并发
    const secondResult = inbox.submit('BUILD tree at (2,2)', 'emperor'); // 再次提交命令
    expect(secondResult.entries.length).toBe(0); // 断言并发满额被拒
    expect(secondResult.issues.some((issue) => issue.message.includes('并发'))).toBe(true); // 断言提示并发限制
  }); // 测试结束
  // 空行用于分隔
  it('should expand pipeline commands into multiple tasks', () => { // 测试管道展开
    const relaxedPolicy: CommandPolicy = { ...policy, maxApprovedPerMinute: 5 }; // 复制策略放宽频率
    const inbox = new CommanderInbox(new AgentAPI(), new AgentLog(), relaxedPolicy); // 构造收件箱
    const result = inbox.submit('COLLECT wood 1 from (1,1) to STOCKPILE -> BUILD tree at (2,2)', 'emperor'); // 提交管道命令
    expect(result.entries.length).toBe(2); // 断言拆解为两条
    expect(result.entries[0]?.command.kind).toBe('collect'); // 断言首条为采集
    expect(result.entries[1]?.command.kind).toBe('build'); // 断言第二条为建造
  }); // 测试结束
}); // 描述结束
