import { describe, it, expect } from 'vitest'; // 引入测试工具
import { UndoStack, BuildOp } from '../src/build/UndoStack'; // 引入撤销栈
import type { TileCell } from '../src/world/Types'; // 引入单元类型

const cell = (type: TileCell['type']): TileCell => ({ type, layerTag: 'ground' }); // 创建单元格辅助函数
const placeOp = (id: number): BuildOp => ({ kind: 'place', x: id, y: id, prev: cell('GRASS'), next: cell('ROAD'), cost: [] }); // 创建放置操作
const removeOp = (id: number): BuildOp => ({ kind: 'remove', x: id, y: id, prev: cell('ROAD'), next: cell('GRASS') }); // 创建拆除操作

describe('UndoStack', () => { // 撤销栈测试套件
  it('returns operations in correct undo redo order', () => { // 测试撤销重做顺序
    const stack = new UndoStack(); // 创建栈
    stack.push(placeOp(1)); // 压入操作1
    stack.push(placeOp(2)); // 压入操作2
    stack.push(removeOp(3)); // 压入操作3
    const undo3 = stack.undo(); // 撤销操作3
    expect(undo3?.x).toBe(3); // 应为操作3
    const undo2 = stack.undo(); // 撤销操作2
    expect(undo2?.x).toBe(2); // 应为操作2
    const redo2 = stack.redo(); // 重做操作2
    expect(redo2?.x).toBe(2); // 应为操作2
    const redo3 = stack.redo(); // 重做操作3
    expect(redo3?.x).toBe(3); // 应为操作3
  }); // 用例结束
  it('drops earliest operations when exceeding limit', () => { // 测试超出限制
    const stack = new UndoStack(2); // 限制为两个
    stack.push(placeOp(1)); // 压入操作1
    stack.push(placeOp(2)); // 压入操作2
    stack.push(placeOp(3)); // 压入操作3导致丢弃操作1
    const undoA = stack.undo(); // 撤销操作3
    const undoB = stack.undo(); // 撤销操作2
    const undoC = stack.undo(); // 尝试撤销更多
    expect(undoA?.x).toBe(3); // 首先应得到操作3
    expect(undoB?.x).toBe(2); // 然后是操作2
    expect(undoC).toBeNull(); // 操作1已被丢弃
  }); // 用例结束
}); // 套件结束
