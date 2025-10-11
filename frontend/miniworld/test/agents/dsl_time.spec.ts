import { describe, expect, it } from 'vitest'; // 引入测试工具
import { parseCommandScript } from '../../src/agents/CommandDSL'; // 引入批令解析器
// 空行用于分隔
describe('DSL 时间语法解析', () => { // 描述测试套件
  it('解析 in 时间窗', () => { // 测试解析时间窗
    const result = parseCommandScript('BUILD road at (3,3) in 08:00-18:00'); // 执行解析
    expect(result.errors.length).toBe(0); // 不应出现错误
    expect(result.commands[0].timeWindow).toEqual({ start: '08:00', end: '18:00' }); // 校验时间窗
  }); // 测试结束
  it('解析 before 截止', () => { // 测试解析截止
    const result = parseCommandScript('BUILD house at (1,2) before 21:00'); // 执行解析
    expect(result.commands[0].deadline).toEqual({ atClock: '21:00' }); // 校验截止
  }); // 测试结束
  it('解析 due 天数', () => { // 测试解析期限
    const result = parseCommandScript('COLLECT stone 5 from (1,1) to STOCKPILE due 2d'); // 执行解析
    expect(result.commands[0].deadline).toEqual({ inDays: 2 }); // 校验天数
  }); // 测试结束
}); // 套件结束
