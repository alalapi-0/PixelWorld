export type BuildRequestState = 'pending' | 'approved' | 'rejected' | 'executed'; // 定义申请状态枚举
export type BuildRequest = { id: string; x: number; y: number; blueprintId: string; reason?: string; state: BuildRequestState }; // 定义申请结构
export interface AgentAPISave { requests: BuildRequest[] }; // 定义序列化结构
// 分隔注释 // 保持行有注释
function cloneRequest(request: BuildRequest): BuildRequest { // 定义克隆申请的辅助函数
  return { id: request.id, x: request.x, y: request.y, blueprintId: request.blueprintId, reason: request.reason, state: request.state }; // 返回浅拷贝
} // 函数结束
// 分隔注释 // 保持行有注释
export class AgentAPI { // 定义AI代理申请队列类
  private requests: BuildRequest[] = []; // 存储所有申请
  public constructor() {} // 空构造函数
  // 分隔注释 // 保持行有注释
  public submit(req: Omit<BuildRequest, 'id' | 'state'>): BuildRequest { // 新增申请
    const request: BuildRequest = { id: `${Date.now()}_${Math.random().toString(16).slice(2)}`, state: 'pending', x: req.x, y: req.y, blueprintId: req.blueprintId, reason: req.reason }; // 构造申请对象
    this.requests.push(request); // 存入队列
    return cloneRequest(request); // 返回副本
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public list(): BuildRequest[] { // 获取所有申请
    return this.requests.map((req) => cloneRequest(req)); // 返回副本数组
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public nextPending(): BuildRequest | null { // 获取下一个待审批申请
    const found = this.requests.find((req) => req.state === 'pending'); // 查找待审批项
    return found ? cloneRequest(found) : null; // 返回克隆或空
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private updateState(id: string, state: BuildRequestState): void { // 内部状态更新函数
    const target = this.requests.find((req) => req.id === id); // 查找目标申请
    if (target) { // 如果存在
      target.state = state; // 更新状态
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public approve(id: string): void { // 将申请标记为通过
    this.updateState(id, 'approved'); // 调用内部更新
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public reject(id: string): void { // 将申请标记为拒绝
    this.updateState(id, 'rejected'); // 调用内部更新
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public markExecuted(id: string): void { // 将申请标记为已执行
    this.updateState(id, 'executed'); // 调用内部更新
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public toJSON(): AgentAPISave { // 序列化申请队列
    return { requests: this.requests.map((req) => cloneRequest(req)) }; // 返回克隆数组
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public static fromJSON(json: AgentAPISave | undefined | null): AgentAPI { // 从JSON恢复
    const api = new AgentAPI(); // 创建实例
    if (json?.requests) { // 如果存在数据
      api.requests = json.requests.map((req) => cloneRequest(req)); // 恢复列表
    } // 条件结束
    return api; // 返回实例
  } // 方法结束
} // 类结束
