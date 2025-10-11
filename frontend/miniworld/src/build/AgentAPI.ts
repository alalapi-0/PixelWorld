import { Command, Deadline, TimeWindow } from '../agents/CommandTypes'; // 引入命令类型供注释使用
// 空行用于分隔
export type AgentTask = // 定义任务联合类型
  | { type: 'build'; x: number; y: number; blueprintId: string; cost?: { id: string; count: number }[]; timeWindow?: TimeWindow; deadline?: Deadline; silent?: boolean } // 建造任务
  | { type: 'collect'; itemId: string; count: number; from: { x: number; y: number } | 'STOCKPILE'; to: { x: number; y: number } | 'STOCKPILE'; timeWindow?: TimeWindow; deadline?: Deadline; silent?: boolean } // 采集任务
  | { type: 'haul'; itemId: string; count: number; from: { x: number; y: number } | 'STOCKPILE'; to: { x: number; y: number } | 'STOCKPILE'; timeWindow?: TimeWindow; deadline?: Deadline; silent?: boolean }; // 搬运任务
// 空行用于分隔
export type AgentTaskState = 'pending' | 'approved' | 'rejected' | 'executing' | 'executed'; // 定义任务状态枚举
// 空行用于分隔
export interface AgentTaskRecord { // 定义任务记录结构
  id: string; // 唯一标识
  state: AgentTaskState; // 当前状态
  task: AgentTask; // 具体任务
  issuerRole?: string; // 发起角色
  reason?: string; // 状态原因
  createdAt: number; // 创建时间戳
  updatedAt: number; // 更新时间戳
  sourceLine?: number; // 来源脚本行
  summary: string; // 概要描述
} // 接口结束
// 空行用于分隔
export interface AgentAPISave { // 定义序列化结构
  tasks: AgentTaskRecord[]; // 任务列表
} // 接口结束
// 空行用于分隔
function cloneRecord(record: AgentTaskRecord): AgentTaskRecord { // 克隆任务记录
  return { ...record, task: { ...record.task } }; // 使用浅拷贝返回新对象
} // 函数结束
// 空行用于分隔
function describeTask(task: AgentTask): string { // 生成任务摘要
  switch (task.type) { // 根据类型分支
    case 'build': // 建造类型
      return `建造${task.blueprintId}@(${task.x},${task.y})`; // 返回建造摘要
    case 'collect': // 采集类型
      return `采集${task.itemId}x${task.count}`; // 返回采集摘要
    case 'haul': // 搬运类型
      return `搬运${task.itemId}x${task.count}`; // 返回搬运摘要
    default: // 兜底分支
      return '未知任务'; // 返回占位文本
  } // 分支结束
} // 函数结束
// 空行用于分隔
export class AgentAPI { // 定义代理任务队列类
  private tasks: AgentTaskRecord[] = []; // 存储任务的数组
  public submitTask(task: AgentTask, meta?: { issuerRole?: string; sourceLine?: number }): AgentTaskRecord { // 提交新任务
    const record: AgentTaskRecord = { // 构造记录
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`, // 生成唯一标识
      state: 'pending', // 初始状态为待审批
      task: { ...task }, // 保存任务副本
      issuerRole: meta?.issuerRole, // 记录角色
      reason: undefined, // 初始无原因
      createdAt: Date.now(), // 创建时间
      updatedAt: Date.now(), // 更新时间
      sourceLine: meta?.sourceLine, // 保存来源行
      summary: describeTask(task), // 生成摘要
    }; // 记录构造结束
    this.tasks.push(record); // 推入队列
    return cloneRecord(record); // 返回拷贝
  } // 方法结束
  public submitBuild(req: { x: number; y: number; blueprintId: string; reason?: string }): AgentTaskRecord { // 兼容旧建造接口
    const record = this.submitTask({ type: 'build', x: req.x, y: req.y, blueprintId: req.blueprintId }, {}); // 调用通用提交
    if (req.reason) { // 如果有原因
      this.updateReason(record.id, req.reason); // 写入原因
    } // 条件结束
    return this.get(record.id) ?? record; // 返回当前记录
  } // 方法结束
  public list(): AgentTaskRecord[] { // 列出所有任务
    return this.tasks.map((item) => cloneRecord(item)); // 返回副本数组
  } // 方法结束
  public listByState(state: AgentTaskState): AgentTaskRecord[] { // 按状态过滤
    return this.tasks.filter((item) => item.state === state).map((item) => cloneRecord(item)); // 返回符合状态的副本
  } // 方法结束
  public nextPending(): AgentTaskRecord | null { // 获取下一个待审批任务
    const found = this.tasks.find((item) => item.state === 'pending'); // 查找第一个待审批
    return found ? cloneRecord(found) : null; // 返回副本或空
  } // 方法结束
  public approve(id: string): void { // 审批通过任务
    this.updateState(id, 'approved', undefined); // 更新状态
  } // 方法结束
  public reject(id: string, reason?: string): void { // 拒绝任务
    this.updateState(id, 'rejected', reason ?? '已拒绝'); // 更新状态并记录原因
  } // 方法结束
  public markExecuting(id: string): void { // 标记开始执行
    this.updateState(id, 'executing', undefined); // 切换状态
  } // 方法结束
  public markExecuted(id: string, reason?: string): void { // 标记已执行
    this.updateState(id, 'executed', reason); // 切换状态并保存原因
  } // 方法结束
  public get(id: string): AgentTaskRecord | undefined { // 按ID获取任务
    const found = this.tasks.find((item) => item.id === id); // 查找目标
    return found ? cloneRecord(found) : undefined; // 返回副本
  } // 方法结束
  public countByState(state: AgentTaskState): number { // 统计状态数量
    return this.tasks.filter((item) => item.state === state).length; // 返回数量
  } // 方法结束
  public pullApproved(): AgentTaskRecord[] { // 拉取所有已批准任务
    return this.listByState('approved'); // 复用过滤逻辑
  } // 方法结束
  public resetToPending(id: string): void { // 将任务重置为待审批
    this.updateState(id, 'pending', undefined); // 更新状态
  } // 方法结束
  public updateReason(id: string, reason: string): void { // 更新原因
    const target = this.tasks.find((item) => item.id === id); // 查找目标
    if (target) { // 如果存在
      target.reason = reason; // 写入原因
      target.updatedAt = Date.now(); // 更新时间戳
    } // 条件结束
  } // 方法结束
  public attachCommand(id: string, command: Command): void { // 可选绑定命令引用
    const target = this.tasks.find((item) => item.id === id); // 查找目标
    if (target) { // 如果存在
      target.summary = `${target.summary} <- ${command.kind}`; // 在摘要中附加命令类型
    } // 条件结束
  } // 方法结束
  public toJSON(): AgentAPISave { // 序列化任务队列
    return { tasks: this.list() }; // 返回副本数组包装
  } // 方法结束
  public static fromJSON(json: AgentAPISave | undefined | null): AgentAPI { // 从序列化恢复
    const api = new AgentAPI(); // 创建实例
    if (json?.tasks) { // 如果存在任务
      api.tasks = json.tasks.map((item) => cloneRecord(item)); // 恢复数组
    } // 条件结束
    return api; // 返回实例
  } // 方法结束
  private updateState(id: string, state: AgentTaskState, reason?: string): void { // 内部状态更新函数
    const target = this.tasks.find((item) => item.id === id); // 查找目标
    if (target) { // 如果存在
      target.state = state; // 更新状态
      target.updatedAt = Date.now(); // 更新时间
      if (reason !== undefined) { // 如果提供原因
        target.reason = reason; // 写入原因
      } // 条件结束
    } // 条件结束
  } // 方法结束
} // 类结束
