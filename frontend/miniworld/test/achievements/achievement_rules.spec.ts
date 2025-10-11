import { describe, expect, it } from 'vitest'; // 引入测试工具
import { AchievementRules } from '../../src/achievements/AchievementRules'; // 引入成就规则
// 空行用于分隔
describe('AchievementRules', () => { // 描述测试套件
  it('累计建造道路触发成就', () => { // 测试道路成就
    const unlocked: string[] = []; // 记录解锁
    const rules = new AchievementRules([
      { id: 'build_road_10', title: '道路工匠', threshold: 10, match: { type: 'build', blueprintId: 'road' } }, // 定义规则
    ], (id) => unlocked.push(id)); // 创建成就对象
    for (let i = 0; i < 10; i += 1) { // 循环十次
      rules.process({ type: 'build', blueprintId: 'road' }); // 处理建造事件
    } // 循环结束
    expect(unlocked).toContain('build_road_10'); // 应解锁成就
  }); // 测试结束
  it('夜间任务触发夜猫子成就', () => { // 测试夜间成就
    const unlocked: string[] = []; // 记录解锁
    const rules = new AchievementRules([
      { id: 'night_ops_1', title: '夜猫子工程', threshold: 1, match: { perf: 'night_shift' } }, // 定义规则
    ], (id) => unlocked.push(id)); // 创建成就对象
    rules.process({ type: 'build', perfTag: 'night_shift' }); // 处理夜间任务
    expect(unlocked).toContain('night_ops_1'); // 应解锁夜猫子
  }); // 测试结束
}); // 套件结束
