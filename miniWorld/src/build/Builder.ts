import { Inventory } from '../systems/Inventory'; // 引入背包系统
import { TileCell } from '../world/Types'; // 引入单元格类型
import { Blueprint } from './Blueprints'; // 引入蓝图类型
import { UndoStack, BuildOp } from './UndoStack'; // 引入撤销栈类型
import { canRemove, canPlace } from './BuildRules'; // 引入放置与拆除规则
// 分隔注释 // 保持行有注释
function cloneCell(cell: TileCell): TileCell { // 定义克隆单元格的辅助函数
  return { type: cell.type, layerTag: cell.layerTag }; // 返回浅拷贝
} // 函数结束
// 分隔注释 // 保持行有注释
export class Builder { // 定义建造执行器
  private map: TileCell[][]; // 持有地图引用
  private inventory: Inventory; // 持有背包引用
  private undo: UndoStack; // 持有撤销栈引用
  public constructor(map: TileCell[][], inventory: Inventory, undo: UndoStack) { // 构造函数
    this.map = map; // 保存地图
    this.inventory = inventory; // 保存背包
    this.undo = undo; // 保存撤销栈
  } // 构造结束
  // 分隔注释 // 保持行有注释
  private hasResources(cost: { id: string; name: string; count: number }[]): boolean { // 判断资源是否足够
    return cost.every((item) => this.inventory.has(item.id, item.count)); // 检查每一项材料
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private applyCost(cost: { id: string; name: string; count: number }[]): void { // 扣除材料
    cost.forEach((item) => { // 遍历材料
      this.inventory.add(item.id, item.name, -item.count); // 从背包扣除
    }); // 遍历结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private revertCost(cost: { id: string; name: string; count: number }[]): void { // 撤销扣除
    cost.forEach((item) => { // 遍历材料
      this.inventory.add(item.id, item.name, item.count); // 将材料加回
    }); // 遍历结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public place(x: number, y: number, bp: Blueprint, neighbors: TileCell[]): boolean { // 执行放置
    const row = this.map[y]; // 获取目标行
    if (!row) { // 检查行是否存在
      return false; // 越界返回失败
    } // 条件结束
    const cell = row[x]; // 获取目标格
    if (!cell) { // 检查列是否存在
      return false; // 越界返回失败
    } // 条件结束
    if (!this.hasResources(bp.cost)) { // 检查材料是否足够
      return false; // 不足则失败
    } // 条件结束
    if (!canPlace(bp, cell, neighbors)) { // 检查规则是否允许放置
      return false; // 不符合规则则失败
    } // 条件结束
    const prev = cloneCell(cell); // 克隆原始格
    const next = this.previewTile(bp); // 计算放置后的格
    row[x] = next; // 写入地图
    this.applyCost(bp.cost); // 扣除材料
    const op: BuildOp = { kind: 'place', x, y, prev, next: cloneCell(next), cost: bp.cost.map((item) => ({ ...item })) }; // 构造操作记录
    this.undo.push(op); // 存入撤销栈
    return true; // 返回成功
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public remove(x: number, y: number): boolean { // 执行拆除
    const row = this.map[y]; // 获取目标行
    if (!row) { // 检查行
      return false; // 越界返回失败
    } // 条件结束
    const cell = row[x]; // 获取目标格
    if (!cell) { // 检查列
      return false; // 越界返回失败
    } // 条件结束
    if (!canRemove(cell)) { // 检查是否允许拆除
      return false; // 不允许则失败
    } // 条件结束
    const prev = cloneCell(cell); // 克隆原始格
    const next: TileCell = { type: 'GRASS', layerTag: 'ground' }; // 定义拆除后的格
    row[x] = next; // 写入地图
    const op: BuildOp = { kind: 'remove', x, y, prev, next: cloneCell(next) }; // 构造操作记录
    this.undo.push(op); // 存入撤销栈
    return true; // 返回成功
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public previewTile(bp: Blueprint): TileCell { // 生成预览单元
    return { type: bp.tile, layerTag: 'ground' }; // 默认使用地面层
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public applyUndo(op: BuildOp): void { // 执行撤销逻辑
    const row = this.map[op.y]; // 获取目标行
    if (!row) { // 检查行
      return; // 越界直接返回
    } // 条件结束
    if (op.kind === 'place') { // 如果撤销放置
      row[op.x] = cloneCell(op.prev); // 恢复原始格
      this.revertCost(op.cost); // 返还材料
    } else { // 否则为拆除
      row[op.x] = cloneCell(op.prev); // 恢复被拆物体
      if (op.refund) { // 如果记录了返还
        op.refund.forEach((item) => { this.inventory.add(item.id, item.name, -item.count); }); // 撤销返还
      } // 条件结束
    } // 分支结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public applyRedo(op: BuildOp): void { // 执行重做逻辑
    const row = this.map[op.y]; // 获取目标行
    if (!row) { // 检查行
      return; // 越界直接返回
    } // 条件结束
    if (op.kind === 'place') { // 如果重做放置
      if (this.hasResources(op.cost)) { // 再次确认材料
        row[op.x] = cloneCell(op.next); // 应用结果
        this.applyCost(op.cost); // 再次扣除
      } // 条件结束
    } else { // 否则为拆除
      row[op.x] = cloneCell(op.next); // 恢复拆除后的格
      if (op.refund) { // 如果记录了返还
        op.refund.forEach((item) => { this.inventory.add(item.id, item.name, item.count); }); // 再次返还
      } // 条件结束
    } // 分支结束
  } // 方法结束
} // 类结束
