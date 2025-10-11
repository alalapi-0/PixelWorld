import { describe, expect, it } from 'vitest'; // 引入测试工具
import { parseCommandScript } from '../../src/agents/CommandDSL'; // 引入解析器
// 空行用于分隔
describe('CommandDSL', () => { // 描述解析器测试
  it('should parse build command with coordinates', () => { // 测试建造解析
    const result = parseCommandScript('BUILD tree at (10,5)'); // 调用解析
    expect(result.errors.length).toBe(0); // 断言无错误
    expect(result.commands[0]).toEqual({ kind: 'build', blueprintId: 'tree', at: { x: 10, y: 5 } }); // 断言命令结构
  }); // 测试结束
  it('should parse collect command from stockpile', () => { // 测试采集解析
    const result = parseCommandScript('COLLECT wood 10 from STOCKPILE to (2,3)'); // 调用解析
    expect(result.errors.length).toBe(0); // 断言无错误
    expect(result.commands[0]).toEqual({ kind: 'collect', itemId: 'wood', count: 10, from: 'STOCKPILE', to: { x: 2, y: 3 } }); // 断言命令结构
  }); // 测试结束
}); // 描述结束
