import { AgentAPI, AgentTaskRecord, AgentTaskState } from '../../build/AgentAPI'; // 引入任务队列
import { AgentLog } from '../../agents/AgentLog'; // 引入日志系统
// 空行用于分隔
export interface MonitorSnapshot { pending: AgentTaskRecord[]; approved: AgentTaskRecord[]; executing: AgentTaskRecord[]; executed: AgentTaskRecord[]; } // 定义快照结构
// 空行用于分隔
export class AgentMonitor { // 定义监控面板
  private api: AgentAPI; // 任务队列引用
  private log: AgentLog; // 日志引用
  public constructor(api: AgentAPI, log: AgentLog) { // 构造函数
    this.api = api; // 保存任务队列
    this.log = log; // 保存日志
  } // 构造结束
  private list(state: AgentTaskState): AgentTaskRecord[] { // 根据状态获取任务
    return this.api.listByState(state); // 调用任务队列
  } // 方法结束
  public snapshot(): MonitorSnapshot { // 获取当前快照
    return { // 返回结构体
      pending: this.list('pending'), // 待审批列表
      approved: this.list('approved'), // 已批准列表
      executing: this.list('executing'), // 执行中列表
      executed: this.list('executed'), // 已完成列表
    }; // 返回结构
  } // 方法结束
  public pause(id: string): void { // 暂停任务
    this.api.resetToPending(id); // 将任务回退
    this.log.info('monitor', '任务已暂停', id); // 记录日志
  } // 方法结束
  public resume(id: string): void { // 恢复任务
    this.api.approve(id); // 标记为已批准
    this.log.info('monitor', '任务已恢复', id); // 记录日志
  } // 方法结束
  public cancel(id: string): void { // 取消任务
    this.api.reject(id, '监控面板取消'); // 标记为拒绝
    this.log.info('monitor', '任务已取消', id); // 记录日志
  } // 方法结束
} // 类结束
