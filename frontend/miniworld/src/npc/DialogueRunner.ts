// 引入相关类型
import { DialogueEngine, DialogueContext, ResolvedDialogueNode, InventoryItem } from "./DialogueEngine"; // 对话引擎类型
import { RelationshipSystem } from "./RelationshipSystem"; // 好感系统
import { GiftRules, GiftScore } from "./GiftRules"; // 礼物规则
// 定义事件回调集合
export interface DialogueRunnerHooks { // 外部钩子
  onEvent?: (eventId: string) => void; // 强制事件回调
  onMaybeEvent?: (eventId: string) => void; // 条件事件回调
  onGiftResolved?: (score: GiftScore) => void; // 礼物结果回调
} // 结束接口
// 定义运行器配置
export interface DialogueRunnerConfig { // 运行配置
  npcId: string; // 当前 NPC ID
  context: DialogueContext; // 初始上下文
} // 结束接口
// 对话运行器主体
export class DialogueRunner { // 负责推进对话流程
  private currentNodeId = "start"; // 当前节点 ID
  private resolved?: ResolvedDialogueNode; // 已解析节点
  constructor(private engine: DialogueEngine, private relations: RelationshipSystem, private gifts: GiftRules, private hooks: DialogueRunnerHooks, private config: DialogueRunnerConfig) { // 构造函数
    this.enterNode(this.currentNodeId); // 初始化进入起始节点
  } // 结束构造
  getCurrent(): ResolvedDialogueNode | undefined { // 获取当前解析结果
    return this.resolved; // 返回节点
  } // 结束方法
  choose(index: number): void { // 选择选项
    if (!this.resolved) { // 若无节点
      throw new Error("尚未解析节点"); // 抛错
    } // 结束条件
    const choice = this.resolved.choices[index]; // 根据索引取选项
    if (!choice) { // 若不存在
      throw new Error("无效选项"); // 抛错
    } // 结束条件
    this.applyEffects(this.resolved.node.effects || []); // 先应用节点效果
    if (choice.event && this.hooks.onEvent) { // 若选项触发事件
      this.hooks.onEvent(choice.event); // 通知外部
    } // 结束条件
    if (choice.next) { // 若存在下一节点
      this.enterNode(choice.next); // 进入下一个节点
    } else if (this.resolved.node.next) { // 否则检查默认跳转
      this.enterNode(this.resolved.node.next); // 使用默认跳转
    } else { // 若无跳转
      this.resolved = undefined; // 结束对话
    } // 结束条件
  } // 结束方法
  giveGift(item: InventoryItem): GiftScore { // 处理送礼
    const node = this.resolved?.node; // 获取当前节点
    if (!node || !node.onGift) { // 若节点不支持送礼
      throw new Error("当前节点不接受礼物"); // 抛错
    } // 结束条件
    const score = this.gifts.evaluate(this.config.npcId, item.id); // 评估礼物
    if (node.onGift.effects.includes("relationship:dynamic")) { // 如果需要动态好感
      this.relations.addAffinity(this.config.npcId, score.affinityDelta, "gift"); // 增加好感
      this.updateContextRelationship(); // 更新上下文显示
    } // 结束条件
    node.onGift.effects.forEach(effect => { // 遍历其它效果
      if (effect.startsWith("maybeEvent:")) { // 如果是可能事件
        const eventId = effect.split(":")[1]; // 获取事件 ID
        if (this.hooks.onMaybeEvent) { // 若有监听
          this.hooks.onMaybeEvent(eventId); // 通知外部
        } // 结束条件
      } // 结束条件
    }); // 结束遍历
    if (this.hooks.onGiftResolved) { // 若有礼物回调
      this.hooks.onGiftResolved(score); // 通知礼物结果
    } // 结束条件
    return score; // 返回评分
  } // 结束方法
  proceed(): void { // 无选项自动前进
    if (!this.resolved) { // 若无当前节点
      return; // 直接返回
    } // 结束条件
    this.applyEffects(this.resolved.node.effects || []); // 应用效果
    if (this.resolved.node.next) { // 如果有默认跳转
      this.enterNode(this.resolved.node.next); // 跳转
    } else { // 否则
      this.resolved = undefined; // 结束对话
    } // 结束条件
  } // 结束方法
  private applyEffects(effects: string[]): void { // 应用节点效果
    effects.forEach(effect => { // 遍历效果
      if (effect.startsWith("relationship:")) { // 如果是好感效果
        const value = Number(effect.split(":")[1]); // 解析数值
        this.relations.addAffinity(this.config.npcId, value, "dialogue"); // 增加好感
        this.updateContextRelationship(); // 更新上下文
      } // 结束条件
    }); // 结束遍历
  } // 结束方法
  private updateContextRelationship(): void { // 同步上下文显示
    const state = this.relations.getState(this.config.npcId); // 获取状态
    const level = this.relations.getLevel(this.config.npcId); // 获取段位
    this.config.context.relationship = state.affinity; // 更新好感值
    this.config.context.relationshipLevel = level.name; // 更新段位名称
  } // 结束方法
  private enterNode(nodeId: string): void { // 进入节点
    this.currentNodeId = nodeId; // 保存 ID
    this.resolved = this.engine.resolveNode(nodeId, this.config.context); // 使用引擎解析
    if (this.resolved.node.end) { // 若节点结束
      this.applyEffects(this.resolved.node.effects || []); // 应用效果
    } // 结束条件
  } // 结束方法
} // 结束类
