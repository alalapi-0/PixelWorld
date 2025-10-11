import { AgentTask } from '../build/AgentAPI'; // 引入任务类型
import { GridPathing, PathPoint } from '../world/Pathing'; // 引入寻路工具
// 空行用于分隔
export interface PlannerStep { kind: 'move' | 'act'; description: string; cost: number; target?: PathPoint; } // 定义规划步骤
// 空行用于分隔
export interface PlannerResult { steps: PlannerStep[]; totalCost: number; finalPosition: PathPoint; } // 定义规划结果
// 空行用于分隔
export class WorkerPlanner { // 定义工人规划器
  private pathing: GridPathing; // 保存寻路实例
  private minutesPerCost: number; // 每单位成本对应的分钟数
  public constructor(pathing?: GridPathing, minutesPerCost = 2) { // 构造函数允许注入参数
    this.pathing = pathing ?? new GridPathing(); // 默认创建新寻路器
    this.minutesPerCost = minutesPerCost; // 保存成本转分钟系数
  } // 构造结束
  private moveStep(from: PathPoint, to: PathPoint): PlannerStep { // 构造移动步骤
    const distance = this.pathing.estimateDistance(from, to); // 计算曼哈顿距离
    return { kind: 'move', description: `移动至(${to.x},${to.y})`, cost: Math.max(1, distance), target: to }; // 返回移动步骤
  } // 方法结束
  public plan(task: AgentTask, origin: PathPoint): PlannerResult { // 根据任务生成计划
    const steps: PlannerStep[] = []; // 初始化步骤数组
    let cursor: PathPoint = { ...origin }; // 当前所在位置
    if (task.type === 'build') { // 处理建造任务
      steps.push(this.moveStep(cursor, { x: task.x, y: task.y })); // 添加移动步骤
      cursor = { x: task.x, y: task.y }; // 更新当前位置
      steps.push({ kind: 'act', description: `建造${task.blueprintId}`, cost: 5, target: cursor }); // 添加动作步骤
    } else if (task.type === 'collect') { // 处理采集任务
      if (task.from !== 'STOCKPILE') { // 如果需要走向来源
        steps.push(this.moveStep(cursor, task.from)); // 添加移动
        cursor = { ...task.from }; // 更新位置
      } // 条件结束
      steps.push({ kind: 'act', description: `采集${task.itemId}x${task.count}`, cost: 4, target: cursor }); // 添加采集动作
      if (task.to !== 'STOCKPILE') { // 如果需要送往坐标
        steps.push(this.moveStep(cursor, task.to)); // 添加移动
        cursor = { ...task.to }; // 更新位置
      } // 条件结束
      steps.push({ kind: 'act', description: `交付${task.itemId}x${task.count}`, cost: 3, target: cursor }); // 添加交付动作
    } else if (task.type === 'haul') { // 处理搬运任务
      if (task.from !== 'STOCKPILE') { // 如果起点为坐标
        steps.push(this.moveStep(cursor, task.from)); // 添加移动
        cursor = { ...task.from }; // 更新位置
      } // 条件结束
      steps.push({ kind: 'act', description: `取出${task.itemId}x${task.count}`, cost: 2, target: cursor }); // 添加取货动作
      if (task.to !== 'STOCKPILE') { // 如果终点为坐标
        steps.push(this.moveStep(cursor, task.to)); // 添加移动
        cursor = { ...task.to }; // 更新位置
      } // 条件结束
      steps.push({ kind: 'act', description: `放下${task.itemId}x${task.count}`, cost: 2, target: cursor }); // 添加放置动作
    } // 分支结束
    const totalCost = steps.reduce((sum, step) => sum + step.cost, 0); // 统计总成本
    return { steps, totalCost, finalPosition: cursor }; // 返回计划结果
  } // 方法结束
  public estimateDurationMinutes(task: AgentTask, origin: PathPoint): number { // 估算任务所需时间
    const plan = this.plan(task, origin); // 先生成计划
    const estimate = plan.totalCost * this.minutesPerCost; // 按成本换算分钟
    return Math.max(5, Math.round(estimate)); // 返回至少五分钟的整数估计
  } // 方法结束
} // 类结束
