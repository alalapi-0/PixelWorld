import { describe, it, expect } from 'vitest'; // 引入测试函数
import { Builder } from '../src/build/Builder'; // 引入建造执行器
import { UndoStack } from '../src/build/UndoStack'; // 引入撤销栈
import { Inventory } from '../src/systems/Inventory'; // 引入背包
import type { TileCell } from '../src/world/Types'; // 引入单元格类型
import type { Blueprint } from '../src/build/Blueprints'; // 引入蓝图类型

const makeCell = (type: TileCell['type']): TileCell => ({ type, layerTag: 'ground' }); // 创建单元格辅助函数
const neighborsFor = (map: TileCell[][], x: number, y: number): TileCell[] => [map[y - 1]?.[x] ?? makeCell('GRASS'), map[y]?.[x + 1] ?? makeCell('GRASS'), map[y + 1]?.[x] ?? makeCell('GRASS'), map[y]?.[x - 1] ?? makeCell('GRASS')]; // 计算邻居

describe('Builder', () => { // 建造执行器测试套件
  it('places and removes tiles with cost handling', () => { // 测试放置与拆除及成本
    const map: TileCell[][] = [ // 定义地图
      [makeCell('GRASS'), makeCell('GRASS'), makeCell('GRASS')], // 第一行
      [makeCell('GRASS'), makeCell('GRASS'), makeCell('GRASS')], // 第二行
      [makeCell('GRASS'), makeCell('WATER'), makeCell('GRASS')], // 第三行
    ]; // 地图结束
    const inventory = new Inventory(); // 创建背包
    inventory.add('stone', '石头', 5); // 添加石头
    inventory.add('seed', '树苗', 1); // 添加树苗
    const undo = new UndoStack(); // 创建撤销栈
    const builder = new Builder(map, inventory, undo); // 创建建造执行器
    const road: Blueprint = { id: 'road', name: '道路', tile: 'ROAD', cost: [{ id: 'stone', name: '石头', count: 1 }] }; // 定义道路蓝图
    const tree: Blueprint = { id: 'tree', name: '树苗', tile: 'TREE', cost: [{ id: 'seed', name: '树苗', count: 1 }] }; // 定义树蓝图
    const placed = builder.place(1, 1, road, neighborsFor(map, 1, 1)); // 尝试放置道路
    expect(placed).toBe(true); // 应当成功
    expect(map[1][1].type).toBe('ROAD'); // 中心格应变为道路
    expect(inventory.has('stone', 5)).toBe(false); // 石头应已扣除
    const failed = builder.place(1, 2, tree, neighborsFor(map, 1, 2)); // 尝试在水面放树
    expect(failed).toBe(false); // 应当失败
    expect(map[2][1].type).toBe('WATER'); // 水面保持不变
    expect(inventory.has('seed', 1)).toBe(true); // 树苗未扣除
    const removed = builder.remove(1, 1); // 拆除道路
    expect(removed).toBe(true); // 应当成功
    expect(map[1][1].type).toBe('GRASS'); // 变回草地
  }); // 用例结束
}); // 套件结束
