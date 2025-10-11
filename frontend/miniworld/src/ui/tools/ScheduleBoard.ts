import { AgentAPI, AgentTaskRecord } from '../../build/AgentAPI'; // 引入任务队列
import { WorkCalendar } from '../../time/WorkCalendar'; // 引入日历
import { TimeSystem } from '../../time/TimeSystem'; // 引入时间系统
// 空行用于分隔
export interface ScheduleEntry { // 声明日程条目
  task: AgentTaskRecord; // 任务记录
  status: 'waiting' | 'ready' | 'executing' | 'done' | 'violated'; // 状态标签
  reason?: string; // 可选原因
  nextTime?: Date; // 下次执行时间
  deadline?: Date; // 截止时间
} // 接口结束
// 空行用于分隔
export class ScheduleBoard { // 定义日程看板类
  private api: AgentAPI; // 任务队列引用
  private calendar: WorkCalendar; // 日历引用
  private time: TimeSystem; // 时间系统引用
  public constructor(api: AgentAPI, calendar: WorkCalendar, time?: TimeSystem) { // 构造函数
    this.api = api; // 保存任务队列
    this.calendar = calendar; // 保存日历
    this.time = time ?? new TimeSystem(); // 初始化时间系统
  } // 构造结束
  public listToday(): ScheduleEntry[] { // 列出今日任务
    const now = this.time.now(); // 获取当前时间
    return this.api.list().map((record) => this.describe(record, now)).sort((a, b) => (a.nextTime?.getTime() ?? 0) - (b.nextTime?.getTime() ?? 0)); // 转换并排序
  } // 方法结束
  private describe(record: AgentTaskRecord, now: Date): ScheduleEntry { // 描述单个任务
    if (record.state === 'executed') { // 如果已完成
      return { task: record, status: 'done', deadline: undefined }; // 返回完成状态
    } // 条件结束
    if (record.state === 'executing') { // 如果正在执行
      return { task: record, status: 'executing', deadline: undefined }; // 返回执行状态
    } // 条件结束
    const decision = this.calendar.evaluate({ timeWindow: record.task.timeWindow, deadline: record.task.deadline, blueprintId: (record.task as any).blueprintId, silent: record.task.silent, now }); // 获取判定
    if (decision.deadlineAt && decision.deadlineAt < now && record.state !== 'executed') { // 如果已过期
      return { task: record, status: 'violated', reason: 'deadline', deadline: decision.deadlineAt }; // 返回违规状态
    } // 条件结束
    if (!decision.allowed) { // 如果当前不可执行
      return { task: record, status: 'waiting', reason: decision.reason, nextTime: decision.nextTime ?? undefined, deadline: decision.deadlineAt }; // 返回等待状态
    } // 条件结束
    return { task: record, status: 'ready', deadline: decision.deadlineAt }; // 返回准备状态
  } // 方法结束
} // 类结束
