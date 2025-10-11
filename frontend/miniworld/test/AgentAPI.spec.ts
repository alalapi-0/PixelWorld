import { describe, it, expect } from 'vitest'; // 引入测试函数
import { AgentAPI } from '../src/build/AgentAPI'; // 引入代理接口

describe('AgentAPI', () => { // 代理接口测试套件
  it('handles queue operations and serialization', () => { // 测试队列与序列化
    const api = new AgentAPI(); // 创建接口
    const first = api.submitTask({ type: 'build', x: 1, y: 2, blueprintId: 'tree' }, { issuerRole: 'test' }); // 提交第一条
    const second = api.submitTask({ type: 'build', x: 2, y: 2, blueprintId: 'road' }, { issuerRole: 'test' }); // 提交第二条
    const pending = api.nextPending(); // 读取待审批
    expect(pending?.id).toBe(first.id); // 应先返回第一条
    api.approve(first.id); // 审批通过
    api.markExecuting(first.id); // 标记执行中
    api.markExecuted(first.id); // 标记执行完成
    const list = api.list(); // 获取列表
    expect(list[0].state).toBe('executed'); // 第一条应执行完成
    expect(list[1].state).toBe('pending'); // 第二条仍待审批
    const restored = AgentAPI.fromJSON(api.toJSON()); // 序列化并恢复
    const restoredList = restored.list(); // 读取恢复数据
    expect(restoredList.length).toBe(2); // 应有两条
    expect(restoredList[0].state).toBe('executed'); // 状态保持
  }); // 用例结束
}); // 套件结束
