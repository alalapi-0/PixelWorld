import { describe, expect, it } from 'vitest'; // 引入测试工具
import { QuestBridge, QuestMappingRule } from '../../src/quests/QuestBridge'; // 引入桥接器
import { QuestTriggers } from '../../src/quest/QuestTriggers'; // 引入触发器类型
// 空行用于分隔
class StubTriggers implements Pick<QuestTriggers, 'onCollect' | 'onReach' | 'onTalk'> { // 定义触发器桩
  public collectCalls: { itemId: string; count: number }[] = []; // 记录采集触发
  public reachCalls: { x: number; y: number }[] = []; // 记录到达触发
  public talkCalls: { npcId: string }[] = []; // 记录对话触发
  public onCollect(itemId: string, delta: number): void { // 采集触发
    this.collectCalls.push({ itemId, count: delta }); // 记录调用
  } // 方法结束
  public onReach(x: number, y: number): void { // 到达触发
    this.reachCalls.push({ x, y }); // 记录调用
  } // 方法结束
  public onTalk(npcId: string): void { // 对话触发
    this.talkCalls.push({ npcId }); // 记录调用
  } // 方法结束
} // 类结束
// 空行用于分隔
describe('QuestBridge', () => { // 描述测试套件
  it('collect 事件默认映射采集', () => { // 测试默认采集
    const triggers = new StubTriggers(); // 创建桩
    const bridge = new QuestBridge(triggers as unknown as QuestTriggers); // 创建桥接器
    bridge.handle({ kind: 'collect', itemId: 'stone', count: 3 }); // 触发事件
    expect(triggers.collectCalls[0]).toEqual({ itemId: 'stone', count: 3 }); // 校验调用
  }); // 测试结束
  it('haul 事件默认映射到达', () => { // 测试搬运映射
    const triggers = new StubTriggers(); // 创建桩
    const bridge = new QuestBridge(triggers as unknown as QuestTriggers); // 创建桥接器
    bridge.handle({ kind: 'haul', to: { x: 5, y: 6 } }); // 触发搬运
    expect(triggers.reachCalls[0]).toEqual({ x: 5, y: 6 }); // 校验调用
  }); // 测试结束
  it('规则映射建造为采集', () => { // 测试规则映射
    const triggers = new StubTriggers(); // 创建桩
    const rules: QuestMappingRule[] = [ // 定义映射
      { event: 'build', mapTo: { type: 'collect', itemId: 'wood', count: 1 }, when: { blueprintId: 'house' } }, // 建造映射
    ]; // 数组结束
    const bridge = new QuestBridge(triggers as unknown as QuestTriggers, rules); // 创建桥接器
    bridge.handle({ kind: 'build', blueprintId: 'house' }); // 触发建造
    expect(triggers.collectCalls[0]).toEqual({ itemId: 'wood', count: 1 }); // 校验结果
  }); // 测试结束
}); // 套件结束
