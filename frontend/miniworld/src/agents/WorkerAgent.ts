import { AgentAPI, AgentTask, AgentTaskRecord } from '../build/AgentAPI'; // 引入任务队列类型
import { Inventory } from '../systems/Inventory'; // 引入仓储系统
import { AgentLog } from './AgentLog'; // 引入日志系统
import { WorkerPlanner, PlannerStep } from './WorkerPlanner'; // 引入规划器
import { PathPoint } from '../world/Pathing'; // 引入坐标类型
import { WorkCalendar, TaskTimeDecision } from '../time/WorkCalendar'; // 引入工作日历
import { TimeSystem } from '../time/TimeSystem'; // 引入时间系统
// 空行用于分隔
export type BuildExecutor = (task: Extract<AgentTask, { type: 'build' }>) => boolean; // 定义建造执行函数类型
// 空行用于分隔
export interface WorkerAgentOptions { startPosition?: PathPoint; buildExecutor?: BuildExecutor; calendar?: WorkCalendar; timeSystem?: TimeSystem; } // 定义初始化参数
// 空行用于分隔
interface ExecutionContext { record: AgentTaskRecord; plan: ReturnType<WorkerPlanner['plan']>; decision: TaskTimeDecision; startedAt: Date; expectedMinutes: number; } // 定义执行上下文
// 空行用于分隔
interface WaitingInfo { record: AgentTaskRecord; resumeAt?: Date; reason: string; } // 定义等待信息
// 空行用于分隔
export class WorkerAgent { // 定义工人代理
  private api: AgentAPI; // 任务队列引用
  private inventory: Inventory; // 仓储引用
  private log: AgentLog; // 日志引用
  private planner: WorkerPlanner; // 规划器引用
  private calendar: WorkCalendar; // 工作日历引用
  private time: TimeSystem; // 时间系统引用
  private position: PathPoint; // 当前坐标
  private buildExecutor: BuildExecutor; // 建造执行函数
  private current: ExecutionContext | null = null; // 当前任务上下文
  private waiting: Map<string, WaitingInfo> = new Map(); // 等待队列
  private performance: Record<string, number> = {}; // 绩效统计
  public constructor(api: AgentAPI, inventory: Inventory, planner: WorkerPlanner, log: AgentLog, options?: WorkerAgentOptions) { // 构造函数
    this.api = api; // 保存任务队列
    this.inventory = inventory; // 保存仓储
    this.planner = planner; // 保存规划器
    this.log = log; // 保存日志
    this.calendar = options?.calendar ?? new WorkCalendar({}); // 初始化日历
    this.time = options?.timeSystem ?? new TimeSystem(); // 初始化时间系统
    this.position = options?.startPosition ?? { x: 0, y: 0 }; // 初始化坐标
    this.buildExecutor = options?.buildExecutor ?? (() => true); // 初始化建造执行函数
  } // 构造结束
  public setBuildExecutor(handler: BuildExecutor): void { // 允许外部替换建造执行函数
    this.buildExecutor = handler; // 更新执行函数
  } // 方法结束
  public tick(): void { // 周期性更新
    if (!this.current) { // 如果当前无任务
      this.pickNextTask(); // 尝试领取新任务
    } // 条件结束
    if (this.current) { // 如果存在任务
      this.processCurrent(); // 执行任务
    } // 条件结束
  } // 方法结束
  private pickNextTask(): void { // 选择下一个任务
    const approved = this.api.pullApproved(); // 获取已批准任务
    if (approved.length === 0) { // 若无任务
      return; // 直接返回
    } // 条件结束
    const now = this.time.now(); // 获取当前时间
    approved.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)); // 按创建时间排序
    for (const record of approved) { // 遍历候选任务
      const wait = this.waiting.get(record.id); // 查询等待状态
      if (wait && wait.resumeAt && wait.resumeAt > now) { // 如果仍需等待
        continue; // 跳过
      } // 条件结束
      const decision = this.calendar.evaluate({ timeWindow: record.task.timeWindow, deadline: record.task.deadline, blueprintId: (record.task as any).blueprintId, silent: record.task.silent, now }); // 调用策略评估
      if (!decision.allowed) { // 如果当前不允许执行
        this.waiting.set(record.id, { record, resumeAt: decision.nextTime, reason: decision.reason ?? 'window' }); // 写入等待
        const resumeText = decision.nextTime ? decision.nextTime.toISOString() : '未定'; // 构造文本
        this.api.updateReason(record.id, `等待时间窗口(${decision.reason ?? 'unknown'})@${resumeText}`); // 在任务上备注
        this.log.info('worker', `任务等待：${record.summary}`, record.id, { resumeAt: resumeText, reason: decision.reason }, { timeWindow: record.task.timeWindow, deadline: record.task.deadline }); // 记录日志
        continue; // 检查下一个任务
      } // 条件结束
      this.waiting.delete(record.id); // 移除等待状态
      const plan = this.planner.plan(record.task, this.position); // 生成计划
      const expectedMinutes = this.planner.estimateDurationMinutes(record.task, this.position); // 估算时长
      this.api.markExecuting(record.id); // 标记任务执行中
      this.current = { record, plan, decision, startedAt: now, expectedMinutes }; // 保存上下文
      this.log.info('worker', `开始任务：${record.summary}`, record.id, { cost: plan.totalCost, expectedMinutes, enforcedSilent: decision.enforcedSilent }, { timeWindow: record.task.timeWindow, deadline: record.task.deadline }); // 记录日志
      return; // 只处理一个任务
    } // 循环结束
  } // 方法结束
  private processCurrent(): void { // 执行当前任务
    if (!this.current) { // 再次确认
      return; // 防御返回
    } // 条件结束
    let success = true; // 默认成功
    this.current.plan.steps.forEach((step) => { // 遍历步骤
      if (!success) { // 如果已失败
        return; // 跳过后续
      } // 条件结束
      success = this.applyStep(this.current!.record, step) && success; // 应用步骤
    }); // 遍历结束
    if (success) { // 若执行成功
      this.finishCurrent(); // 处理收尾
    } else { // 如果失败
      this.api.updateReason(this.current.record.id, '执行失败'); // 写入失败原因
      this.api.resetToPending(this.current.record.id); // 将任务退回队列
      this.log.error('worker', `任务失败：${this.current.record.summary}`, this.current.record.id, undefined, { timeWindow: this.current.record.task.timeWindow, deadline: this.current.record.task.deadline }); // 记录错误
    } // 分支结束
    this.current = null; // 清空上下文
  } // 方法结束
  private finishCurrent(): void { // 完成当前任务
    if (!this.current) { // 防御检查
      return; // 返回
    } // 条件结束
    const finishAt = TimeSystem.addMinutes(this.current.startedAt, this.current.expectedMinutes); // 计算预计完成时间
    const deadline = this.current.decision.deadlineAt; // 获取截止
    let perfTag = 'on_time'; // 默认绩效标签
    if (deadline && finishAt > deadline) { // 如果超过截止
      perfTag = 'overtime'; // 标记超时
    } // 条件结束
    if (this.calendar.isCurfew(finishAt)) { // 如果处于宵禁
      this.incrementPerformance('night_shift'); // 统计夜间任务
      if (perfTag === 'on_time') { // 如果仍按时
        perfTag = 'night_shift'; // 直接标记夜间
      } else { // 如果已超时
        perfTag = 'overtime'; // 保持超时标签
      } // 条件结束
    } // 条件结束
    if (this.current.decision.enforcedSilent) { // 如果需要静音
      this.incrementPerformance('silent'); // 统计静音任务
    } // 条件结束
    this.incrementPerformance(perfTag); // 统计主要绩效
    this.api.markExecuted(this.current.record.id); // 标记完成
    this.api.updateReason(this.current.record.id, `perf:${perfTag}`); // 写入绩效
    this.log.info('worker', `完成任务：${this.current.record.summary}`, this.current.record.id, { position: this.position, perfTag, finishedAt: finishAt.toISOString() }, { timeWindow: this.current.record.task.timeWindow, perfTag, deadline: this.current.record.task.deadline }); // 记录日志
  } // 方法结束
  private incrementPerformance(tag: string): void { // 自增绩效计数
    this.performance[tag] = (this.performance[tag] ?? 0) + 1; // 更新计数
  } // 方法结束
  private applyStep(record: AgentTaskRecord, step: PlannerStep): boolean { // 应用单个步骤
    this.log.info('worker', `步骤：${step.description}`, record.id, { kind: step.kind }, { timeWindow: record.task.timeWindow, deadline: record.task.deadline }); // 记录步骤日志
    if (step.kind === 'move' && step.target) { // 如果是移动
      this.position = { ...step.target }; // 更新位置
      return true; // 移动总是成功
    } // 条件结束
    return this.performAction(record.task, step); // 执行动作步骤
  } // 方法结束
  private performAction(task: AgentTask, step: PlannerStep): boolean { // 执行动作逻辑
    if (task.type === 'build') { // 建造任务
      return this.buildExecutor(task); // 调用建造执行
    } // 条件结束
    if (task.type === 'collect') { // 采集任务
      if (step.description.startsWith('交付')) { // 交付步骤
        this.inventory.add(task.itemId, task.itemId, task.count); // 增加库存
      } // 条件结束
      return true; // 采集视为成功
    } // 条件结束
    if (task.type === 'haul') { // 搬运任务
      if (step.description.startsWith('取出') && task.from === 'STOCKPILE') { // 从仓库取出
        if (!this.inventory.has(task.itemId, task.count)) { // 检查库存
          return false; // 库存不足
        } // 条件结束
        this.inventory.add(task.itemId, task.itemId, -task.count); // 扣减库存
      } // 条件结束
      if (step.description.startsWith('放下') && task.to === 'STOCKPILE') { // 放回仓库
        this.inventory.add(task.itemId, task.itemId, task.count); // 增加库存
      } // 条件结束
      return true; // 搬运视为成功
    } // 条件结束
    return true; // 其他情况默认为成功
  } // 方法结束
  public cancelCurrent(reason: string): void { // 取消当前任务
    if (!this.current) { // 如果没有任务
      return; // 直接返回
    } // 条件结束
    this.api.resetToPending(this.current.record.id); // 将任务退回待审批
    this.api.updateReason(this.current.record.id, reason); // 写入取消原因
    this.log.info('worker', `任务被取消：${reason}`, this.current.record.id, undefined, { timeWindow: this.current.record.task.timeWindow, deadline: this.current.record.task.deadline }); // 记录取消日志
    this.current = null; // 清空上下文
  } // 方法结束
  public getPosition(): PathPoint { // 获取当前位置
    return { ...this.position }; // 返回位置拷贝
  } // 方法结束
  public getCurrentTask(): AgentTaskRecord | null { // 获取当前任务
    return this.current ? this.current.record : null; // 返回记录或空
  } // 方法结束
  public getPerformance(): Record<string, number> { // 获取绩效统计
    return { ...this.performance }; // 返回拷贝
  } // 方法结束
} // 类结束
