import { AgentAPI, AgentTaskRecord } from '../../build/AgentAPI'; // 引入任务队列
import { AgentLog } from '../../agents/AgentLog'; // 引入日志系统
// 空行用于分隔
export class ApprovalBoard { // 定义审批面板
  private api: AgentAPI; // 保存任务队列
  private log: AgentLog; // 保存日志引用
  private selection: Set<string> = new Set(); // 当前选择集
  public constructor(api: AgentAPI, log: AgentLog) { // 构造函数
    this.api = api; // 保存任务队列
    this.log = log; // 保存日志
  } // 构造结束
  public listPending(): AgentTaskRecord[] { // 列出待审批任务
    return this.api.listByState('pending'); // 返回待审批列表
  } // 方法结束
  public toggleSelection(id: string, selected: boolean): void { // 更新选中状态
    if (selected) { // 如果需要选中
      this.selection.add(id); // 加入集合
    } else { // 否则
      this.selection.delete(id); // 移除选中
    } // 条件结束
  } // 方法结束
  public approveSelected(): AgentTaskRecord[] { // 审批选中任务
    const updated: AgentTaskRecord[] = []; // 初始化更新列表
    this.selection.forEach((id) => { // 遍历选中
      this.api.approve(id); // 标记通过
      const record = this.api.get(id); // 读取最新记录
      if (record) { // 如果存在
        updated.push(record); // 加入更新列表
        this.log.info('approve', `通过任务：${record.summary}`, id); // 记录日志
      } // 条件结束
    }); // 遍历结束
    this.selection.clear(); // 清空选择
    return updated; // 返回结果
  } // 方法结束
  public rejectSelected(reason = '审批拒绝'): AgentTaskRecord[] { // 拒绝选中任务
    const updated: AgentTaskRecord[] = []; // 初始化更新列表
    this.selection.forEach((id) => { // 遍历选中
      this.api.reject(id, reason); // 标记拒绝
      const record = this.api.get(id); // 获取记录
      if (record) { // 如果存在
        updated.push(record); // 收集结果
        this.log.info('approve', `拒绝任务：${record.summary}`, id, { reason }); // 记录日志
      } // 条件结束
    }); // 遍历结束
    this.selection.clear(); // 清空选择
    return updated; // 返回结果
  } // 方法结束
  public clearSelection(): void { // 清除选择
    this.selection.clear(); // 重置集合
  } // 方法结束
} // 类结束
