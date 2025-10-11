export interface AgentLogEntry { timestamp: number; tag: string; message: string; taskId?: string; detail?: Record<string, unknown>; } // 定义日志条目结构
// 空行用于分隔
export class AgentLog { // 定义日志存储类
  private entries: AgentLogEntry[] = []; // 保存日志数组
  public push(entry: AgentLogEntry): void { // 追加日志方法
    this.entries.push(entry); // 将条目加入数组
  } // 方法结束
  public info(tag: string, message: string, taskId?: string, detail?: Record<string, unknown>): void { // 记录普通信息
    this.push({ timestamp: Date.now(), tag, message, taskId, detail }); // 构造信息级别条目
  } // 方法结束
  public error(tag: string, message: string, taskId?: string, detail?: Record<string, unknown>): void { // 记录错误信息
    this.push({ timestamp: Date.now(), tag: `${tag}:error`, message, taskId, detail }); // 构造错误条目
  } // 方法结束
  public list(): AgentLogEntry[] { // 获取日志列表
    return this.entries.map((entry) => ({ ...entry })); // 返回浅拷贝数组
  } // 方法结束
  public clear(): void { // 清空日志
    this.entries = []; // 重置数组
  } // 方法结束
  public exportLines(): string[] { // 导出文本行
    return this.entries.map((entry) => `[${new Date(entry.timestamp).toISOString()}][${entry.tag}] ${entry.message}`); // 生成文本
  } // 方法结束
  public toJSON(): { entries: AgentLogEntry[] } { // 序列化日志
    return { entries: this.list() }; // 返回包装对象
  } // 方法结束
  public static fromJSON(json: { entries: AgentLogEntry[] } | undefined | null): AgentLog { // 反序列化日志
    const log = new AgentLog(); // 创建实例
    if (json?.entries) { // 判断是否有数据
      json.entries.forEach((entry) => log.push({ ...entry })); // 逐条恢复
    } // 条件结束
    return log; // 返回实例
  } // 方法结束
} // 类结束
