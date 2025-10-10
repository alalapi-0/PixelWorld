import { QuestStore } from './QuestStore'; // 引入任务存储类
import { Step } from './QuestTypes'; // 引入步骤类型
// 分隔注释 // 保持行有注释
export type QuestUpdateCallback = (questId: string, completed: boolean) => void; // 定义任务更新回调类型
// 分隔注释 // 保持行有注释
export class QuestTriggers { // 定义任务触发器类
  private store: QuestStore; // 保存任务存储引用
  private callback?: QuestUpdateCallback; // 保存可选的更新回调
  // 分隔注释 // 保持行有注释
  public constructor(store: QuestStore, callback?: QuestUpdateCallback) { // 构造函数
    this.store = store; // 保存存储引用
    this.callback = callback; // 保存回调引用
  } // 构造结束
  // 分隔注释 // 保持行有注释
  private forEachActive(handler: (questId: string, step: Step) => void): void { // 遍历所有进行中的当前步骤
    this.store.listVisible().filter((entry) => entry.prog.status === 'active').forEach((entry) => { // 过滤进行中任务
      const step = entry.def.steps[entry.prog.currentStepIndex]; // 读取当前步骤
      if (step) { // 如果存在步骤
        handler(entry.def.id, step); // 调用处理器
      } // 条件结束
    }); // 遍历结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private emitUpdate(questId: string): void { // 触发更新回调
    if (!this.callback) { // 如果没有回调
      return; // 直接返回
    } // 条件结束
    const progress = this.store.getProgress(questId); // 读取进度
    this.callback(questId, progress?.status === 'completed'); // 回调并告知是否完成
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public onCollect(itemId: string, delta: number): void { // 处理采集事件
    if (delta <= 0) { // 如果数量无效
      return; // 不处理
    } // 条件结束
    this.forEachActive((questId, step) => { // 遍历进行中任务
      if (step.type !== 'collect' || step.itemId !== itemId) { // 如果类型或物品不匹配
        return; // 跳过该任务
      } // 条件结束
      this.store.markStepProgress(questId, step.id, delta, step.type); // 累计计数
      const advanced = this.store.advanceIfComplete(questId); // 检查是否推进
      this.emitUpdate(questId); // 通知更新
      if (advanced) { // 如果推进成功
        this.emitUpdate(questId); // 再次通知以反映新状态
      } // 条件结束
    }); // 遍历结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public onTalk(npcId: string): void { // 处理对话事件
    this.forEachActive((questId, step) => { // 遍历进行中任务
      if (step.type !== 'talk' || step.npcId !== npcId) { // 如果类型或NPC不匹配
        return; // 跳过
      } // 条件结束
      this.store.markStepProgress(questId, step.id, 1, step.type); // 标记完成
      const advanced = this.store.advanceIfComplete(questId); // 尝试推进
      this.emitUpdate(questId); // 通知更新
      if (advanced) { // 如果有推进
        this.emitUpdate(questId); // 再次通知
      } // 条件结束
    }); // 遍历结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public onReach(x: number, y: number): void { // 处理抵达事件
    this.forEachActive((questId, step) => { // 遍历进行中任务
      if (step.type !== 'reach' || step.targetX === undefined || step.targetY === undefined) { // 如果类型或坐标缺失
        return; // 跳过
      } // 条件结束
      const radius = step.radius ?? 0; // 读取半径
      const distance = Math.hypot(x - step.targetX, y - step.targetY); // 计算距离
      if (distance > radius) { // 如果超出范围
        return; // 不处理
      } // 条件结束
      this.store.markStepProgress(questId, step.id, 1, step.type); // 标记完成
      const advanced = this.store.advanceIfComplete(questId); // 尝试推进
      this.emitUpdate(questId); // 通知更新
      if (advanced) { // 如果有推进
        this.emitUpdate(questId); // 再次通知
      } // 条件结束
    }); // 遍历结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public onEquip(_equipId: string): void { // 预留装备事件
    // 当前轮次暂未实现装备条件 // 占位注释
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public onState(_key: string, _value: number): void { // 预留状态事件
    // 当前轮次暂未实现状态条件 // 占位注释
  } // 方法结束
} // 类结束
