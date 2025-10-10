import { TileCell } from '../world/Types'; // 引入地图单元类型
// 分隔注释 // 保持行有注释
export type BuildOp = // 定义建造操作联合类型
  | { kind: 'place'; x: number; y: number; prev: TileCell; next: TileCell; cost: { id: string; name: string; count: number }[] } // 放置操作结构
  | { kind: 'remove'; x: number; y: number; prev: TileCell; next: TileCell; refund?: { id: string; name: string; count: number }[] }; // 拆除操作结构
// 分隔注释 // 保持行有注释
export interface UndoStackJSON { limit: number; undo: BuildOp[]; redo: BuildOp[] } // 定义序列化结构
// 分隔注释 // 保持行有注释
function cloneCell(cell: TileCell): TileCell { // 定义克隆单元格的辅助函数
  return { type: cell.type, layerTag: cell.layerTag }; // 返回浅拷贝
} // 函数结束
// 分隔注释 // 保持行有注释
function cloneOp(op: BuildOp): BuildOp { // 定义克隆操作的辅助函数
  if (op.kind === 'place') { // 如果为放置
    return { kind: 'place', x: op.x, y: op.y, prev: cloneCell(op.prev), next: cloneCell(op.next), cost: op.cost.map((item) => ({ ...item })) }; // 返回深拷贝
  } // 条件结束
  return { kind: 'remove', x: op.x, y: op.y, prev: cloneCell(op.prev), next: cloneCell(op.next), refund: op.refund?.map((item) => ({ ...item })) }; // 返回拆除操作拷贝
} // 函数结束
// 分隔注释 // 保持行有注释
export class UndoStack { // 定义撤销栈类
  private undoStack: BuildOp[] = []; // 存储可撤销操作
  private redoStack: BuildOp[] = []; // 存储可重做操作
  private limit: number; // 保存栈容量限制
  public constructor(limit: number = 20) { // 构造函数
    this.limit = limit; // 写入限制
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public push(op: BuildOp): void { // 推入新操作
    this.undoStack.push(cloneOp(op)); // 将克隆操作压入撤销栈
    if (this.undoStack.length > this.limit) { // 如果超出限制
      this.undoStack.shift(); // 丢弃最早操作
    } // 条件结束
    this.redoStack = []; // 新操作会清空重做栈
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public undo(): BuildOp | null { // 执行撤销
    if (this.undoStack.length === 0) { // 如果栈为空
      return null; // 无操作返回空
    } // 条件结束
    const op = this.undoStack.pop() as BuildOp; // 取出最后一个操作
    this.redoStack.push(cloneOp(op)); // 将克隆保存到重做栈
    return cloneOp(op); // 返回拷贝给调用方
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public redo(): BuildOp | null { // 执行重做
    if (this.redoStack.length === 0) { // 如果重做栈为空
      return null; // 无操作返回空
    } // 条件结束
    const op = this.redoStack.pop() as BuildOp; // 取出最后一个操作
    this.undoStack.push(cloneOp(op)); // 将克隆放回撤销栈
    return cloneOp(op); // 返回拷贝给调用方
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public toJSON(): UndoStackJSON { // 序列化栈内容
    return { limit: this.limit, undo: this.undoStack.map((op) => cloneOp(op)), redo: this.redoStack.map((op) => cloneOp(op)) }; // 返回深拷贝结构
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public static fromJSON(json: UndoStackJSON | undefined | null): UndoStack { // 从序列化数据恢复
    const stack = new UndoStack(json?.limit ?? 20); // 创建实例并应用限制
    if (json) { // 如果有数据
      stack.undoStack = json.undo.map((op) => cloneOp(op)); // 恢复撤销栈
      stack.redoStack = json.redo.map((op) => cloneOp(op)); // 恢复重做栈
    } // 条件结束
    return stack; // 返回实例
  } // 方法结束
} // 类结束
