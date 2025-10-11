import { QuestTriggers } from '../quest/QuestTriggers'; // 引入任务触发器
// 空行用于分隔
export type AgentQuestEventKind = 'build' | 'collect' | 'haul'; // 声明事件类型
// 空行用于分隔
export interface AgentQuestEvent { // 声明代理事件结构
  kind: AgentQuestEventKind; // 事件类型
  blueprintId?: string; // 可选蓝图标识
  itemId?: string; // 可选物品标识
  count?: number; // 数量
  from?: { x: number; y: number }; // 起点坐标
  to?: { x: number; y: number }; // 终点坐标
  perfTag?: string; // 绩效标签
} // 接口结束
// 空行用于分隔
export interface QuestMappingCondition { // 声明额外条件
  blueprintId?: string; // 匹配蓝图
  itemId?: string; // 匹配物品
  perf?: string; // 匹配绩效
} // 接口结束
// 空行用于分隔
export interface QuestMappingTarget { // 声明映射目标
  type: 'collect' | 'reach' | 'talk' | 'build'; // 目标类型
  itemId?: string; // 目标物品
  count?: number; // 目标数量
  npcId?: string; // 对话NPC
  x?: number; // 目标X
  y?: number; // 目标Y
  blueprintId?: string; // 建造蓝图
} // 接口结束
// 空行用于分隔
export interface QuestMappingRule { // 声明映射规则
  event: AgentQuestEventKind; // 源事件类型
  mapTo: QuestMappingTarget; // 映射目标
  when?: QuestMappingCondition; // 可选条件
} // 接口结束
// 空行用于分隔
export class QuestBridge { // 定义任务桥接器
  private triggers: QuestTriggers; // 保存触发器
  private mappings: QuestMappingRule[]; // 保存映射规则
  public constructor(triggers: QuestTriggers, mappings?: QuestMappingRule[]) { // 构造函数
    this.triggers = triggers; // 保存触发器
    this.mappings = mappings ? [...mappings] : []; // 复制映射规则
  } // 构造结束
  public registerMapping(rule: QuestMappingRule): void { // 动态新增映射
    this.mappings.push(rule); // 追加规则
  } // 方法结束
  public handle(event: AgentQuestEvent): void { // 处理代理事件
    this.processDirect(event); // 先处理默认映射
    this.processRules(event); // 再处理自定义规则
  } // 方法结束
  private processDirect(event: AgentQuestEvent): void { // 处理默认映射
    if (event.kind === 'collect' && event.itemId) { // 处理采集事件
      this.triggers.onCollect(event.itemId, event.count ?? 1); // 直接触发采集
    } // 条件结束
    if (event.kind === 'haul' && event.to) { // 处理搬运事件
      this.triggers.onReach(event.to.x, event.to.y); // 将抵达仓储视为到达目标
    } // 条件结束
  } // 方法结束
  private processRules(event: AgentQuestEvent): void { // 应用映射规则
    this.mappings.filter((rule) => rule.event === event.kind).forEach((rule) => { // 筛选匹配事件
      if (!this.matchCondition(rule.when, event)) { // 判断条件
        return; // 条件不符则跳过
      } // 条件结束
      this.emitTarget(rule.mapTo, event); // 触发目标
    }); // 遍历结束
  } // 方法结束
  private matchCondition(condition: QuestMappingCondition | undefined, event: AgentQuestEvent): boolean { // 匹配条件
    if (!condition) { // 如果无条件
      return true; // 默认匹配
    } // 条件结束
    if (condition.blueprintId && condition.blueprintId !== event.blueprintId) { // 匹配蓝图失败
      return false; // 返回不匹配
    } // 条件结束
    if (condition.itemId && condition.itemId !== event.itemId) { // 匹配物品失败
      return false; // 返回不匹配
    } // 条件结束
    if (condition.perf && condition.perf !== event.perfTag) { // 匹配绩效失败
      return false; // 返回不匹配
    } // 条件结束
    return true; // 通过所有条件
  } // 方法结束
  private emitTarget(target: QuestMappingTarget, event: AgentQuestEvent): void { // 执行映射目标
    if (target.type === 'collect') { // 目标为采集
      const item = target.itemId ?? event.itemId ?? event.blueprintId ?? 'unknown'; // 选择物品
      const count = target.count ?? event.count ?? 1; // 选择数量
      this.triggers.onCollect(item, count); // 调用采集触发
      return; // 完成后返回
    } // 条件结束
    if (target.type === 'reach') { // 目标为到达
      const x = target.x ?? event.to?.x ?? 0; // 选择X
      const y = target.y ?? event.to?.y ?? 0; // 选择Y
      this.triggers.onReach(x, y); // 调用到达触发
      return; // 返回
    } // 条件结束
    if (target.type === 'talk') { // 目标为对话
      const npcId = target.npcId ?? 'npc'; // 选择NPC
      this.triggers.onTalk(npcId); // 调用对话触发
      return; // 返回
    } // 条件结束
    if (target.type === 'build') { // 目标为建造
      const blueprint = target.blueprintId ?? event.blueprintId ?? 'structure'; // 选择蓝图
      this.triggers.onCollect(`build:${blueprint}`, target.count ?? 1); // 将建造映射为收集计数
    } // 条件结束
  } // 方法结束
} // 类结束
