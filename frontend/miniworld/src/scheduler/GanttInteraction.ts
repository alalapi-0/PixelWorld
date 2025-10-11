import { WorkCalendar } from '../time/WorkCalendar'; // 引入工作日历用于吸附规则
import { GanttLayout, SchedulerData, SchedulerTask } from './GanttLayout'; // 引入布局与数据类型
import { SchedulerIO } from '../config/SchedulerIO'; // 引入排程存储接口

export class GanttInteraction { // 定义甘特交互控制器
  private scheduler: SchedulerData; // 保存当前排程数据
  private layout: GanttLayout; // 保存布局计算器
  private calendar: WorkCalendar; // 保存工作日历
  private io: SchedulerIO; // 保存读写工具
  private selectedTaskId: string | null = null; // 当前选中的任务

  public constructor(scheduler: SchedulerData, layout: GanttLayout, calendar: WorkCalendar, io: SchedulerIO) { // 构造函数
    this.scheduler = scheduler; // 记录排程数据
    this.layout = layout; // 记录布局工具
    this.calendar = calendar; // 记录工作日历
    this.io = io; // 记录存储工具
  } // 构造结束

  public selectTask(taskId: string | null): void { // 选择某个任务
    this.selectedTaskId = taskId; // 更新选中状态
  } // 方法结束

  public dragTask(taskId: string, deltaMinutes: number): void { // 拖拽任务改变开始时间
    const task = this.findTask(taskId); // 查找目标任务
    const start = new Date(task.start); // 解析原始开始时间
    const moved = new Date(start.getTime() + deltaMinutes * 60000); // 根据偏移计算新时间
    const aligned = this.calendar.alignToNextSlot(moved); // 使用工作日历吸附到可执行时间
    task.start = aligned.toISOString(); // 更新任务开始时间
  } // 方法结束

  public resizeTask(taskId: string, deltaMinutes: number): void { // 调整任务持续时间
    const task = this.findTask(taskId); // 查找任务
    const duration = this.extractDuration(task); // 读取当前持续分钟
    const next = Math.max(15, duration + deltaMinutes); // 计算新的持续并限制最小值
    if (this.scheduler.timeScale === 'hours') { // 如果排程以小时计
      task.durationHr = next / 60; // 将分钟转换为小时字段
      task.durationMin = undefined; // 清除分钟字段避免冲突
    } else { // 否则
      task.durationMin = next; // 直接写入分钟
    } // 条件结束
  } // 方法结束

  public connectDependency(fromId: string, toId: string): void { // 创建依赖关系
    const target = this.findTask(toId); // 找到目标任务
    if (!target.dependsOn) { // 如果没有依赖数组
      target.dependsOn = []; // 初始化数组
    } // 条件结束
    if (!target.dependsOn.includes(fromId)) { // 如果依赖中不存在该任务
      target.dependsOn.push(fromId); // 添加依赖
    } // 条件结束
  } // 方法结束

  public disconnectDependency(fromId: string, toId: string): void { // 移除依赖关系
    const target = this.findTask(toId); // 查找目标任务
    if (!target.dependsOn) { // 如果没有依赖
      return; // 无需处理
    } // 条件结束
    target.dependsOn = target.dependsOn.filter((item) => item !== fromId); // 过滤掉指定依赖
    if (target.dependsOn.length === 0) { // 如果数组为空
      delete target.dependsOn; // 删除属性保持清爽
    } // 条件结束
  } // 方法结束

  public duplicateSelected(): SchedulerTask | null { // 复制当前选中任务
    if (!this.selectedTaskId) { // 若没有选中任务
      return null; // 返回空
    } // 条件结束
    const source = this.findTask(this.selectedTaskId); // 查找源任务
    const clone: SchedulerTask = { ...source, id: `${source.id}-copy-${Date.now()}`, start: this.calendar.alignToNextSlot(new Date(new Date(source.start).getTime() + this.extractDuration(source) * 60000)).toISOString(), status: 'planned' }; // 创建副本并顺延时间
    this.scheduler.tasks.push(clone); // 添加到排程中
    return clone; // 返回新任务
  } // 方法结束

  public async save(): Promise<void> { // 保存排程文件
    await this.io.save(this.scheduler); // 调用 IO 保存
  } // 方法结束

  public getScheduler(): SchedulerData { // 获取当前排程
    return this.scheduler; // 返回数据
  } // 方法结束

  private findTask(id: string): SchedulerTask { // 辅助方法：根据 ID 查找任务
    const task = this.scheduler.tasks.find((item) => item.id === id); // 查找任务
    if (!task) { // 如果未找到
      throw new Error(`Task not found: ${id}`); // 抛出错误
    } // 条件结束
    return task; // 返回任务
  } // 方法结束

  private extractDuration(task: SchedulerTask): number { // 辅助方法：提取任务持续时间
    if (this.scheduler.timeScale === 'hours') { // 如果时间单位是小时
      if (task.durationHr !== undefined) { // 若存在小时字段
        return task.durationHr * 60; // 转换成分钟
      } // 条件结束
    } // 条件结束
    if (task.durationMin !== undefined) { // 如果存在分钟字段
      return task.durationMin; // 直接返回
    } // 条件结束
    return 30; // 默认返回半小时
  } // 方法结束
} // 类结束
