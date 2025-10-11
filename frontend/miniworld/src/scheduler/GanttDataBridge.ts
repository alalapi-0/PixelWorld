import { AgentAPI, AgentTask } from '../build/AgentAPI'; // 引入代理任务接口
import { SchedulerData, SchedulerTask } from './GanttLayout'; // 引入排程数据类型
import { SchedulerIO } from '../config/SchedulerIO'; // 引入存储工具

export interface WorkerStatusEvent { // 描述工人状态事件
  taskId: string; // 关联的任务 ID
  status: string; // 最新状态
  progress?: number; // 可选的进度百分比
} // 结束接口

export class GanttDataBridge { // 定义甘特图与执行系统之间的桥接器
  private api: AgentAPI; // 保存 AgentAPI 引用
  private io: SchedulerIO; // 保存排程 IO
  private workerListeners = new Set<(event: WorkerStatusEvent) => void>(); // 存储工人事件监听器
  private scheduler: SchedulerData | null = null; // 当前排程数据

  public constructor(api: AgentAPI, io: SchedulerIO) { // 构造函数
    this.api = api; // 记录 AgentAPI
    this.io = io; // 记录 IO 工具
  } // 构造结束

  public setScheduler(data: SchedulerData): void { // 设置当前排程
    this.scheduler = data; // 保存排程数据
  } // 方法结束

  public onWorkerEvent(handler: (event: WorkerStatusEvent) => void): void { // 允许外部监听工人事件
    this.workerListeners.add(handler); // 添加监听器
  } // 方法结束

  public receiveWorkerEvent(event: WorkerStatusEvent): void { // 从工人处接收事件
    if (!this.scheduler) { // 如果没有排程
      return; // 直接返回
    } // 条件结束
    const task = this.scheduler.tasks.find((item) => item.id === event.taskId); // 查找任务
    if (!task) { // 如果未找到
      return; // 忽略
    } // 条件结束
    task.status = event.status; // 更新状态
    if (event.progress !== undefined) { // 如果提供进度
      task.progress = event.progress; // 写入进度
    } // 条件结束
    this.workerListeners.forEach((listener) => listener(event)); // 遍历监听器广播事件
  } // 方法结束

  public async sendForApproval(): Promise<SchedulerTask[]> { // 将待审批任务推送到 AgentAPI
    if (!this.scheduler) { // 如果没有排程
      throw new Error('Scheduler not loaded'); // 抛出异常
    } // 条件结束
    const promoted: SchedulerTask[] = []; // 记录已提交任务
    for (const task of this.scheduler.tasks) { // 遍历任务
      if (task.status !== 'planned') { // 若非计划状态
        continue; // 跳过
      } // 条件结束
      if (!this.dependenciesSatisfied(task)) { // 如果依赖未满足
        continue; // 跳过
      } // 条件结束
      const payload = task.payload as AgentTask | undefined; // 读取 payload
      if (!payload) { // 如果没有负载
        continue; // 跳过
      } // 条件结束
      this.api.submitTask(payload, { issuerRole: 'scheduler' }); // 提交到任务队列
      task.status = 'approved'; // 更新状态
      promoted.push(task); // 记录成功提交
    } // 遍历结束
    if (promoted.length > 0) { // 如果有提交
      await this.io.save(this.scheduler); // 写回排程
    } // 条件结束
    return promoted; // 返回提交列表
  } // 方法结束

  private dependenciesSatisfied(task: SchedulerTask): boolean { // 判断依赖是否满足
    if (!this.scheduler || !task.dependsOn || task.dependsOn.length === 0) { // 无依赖直接通过
      return true; // 返回真
    } // 条件结束
    return task.dependsOn.every((id) => { // 检查每个依赖
      const target = this.scheduler!.tasks.find((item) => item.id === id); // 查找依赖任务
      if (!target) { // 如果依赖不存在
        return false; // 无法满足
      } // 条件结束
      return target.status === 'approved' || target.status === 'executing' || target.status === 'done'; // 只有已审批或进行中或完成才视为满足
    }); // 遍历结束
  } // 方法结束
} // 类结束
