import { describe, it, expect } from 'vitest'; // 引入测试函数
import { canPlace, canRemove } from '../src/build/BuildRules'; // 引入建造规则
import type { TileCell } from '../src/world/Types'; // 引入单元类型
import type { Blueprint } from '../src/build/Blueprints'; // 引入蓝图类型

const cell = (type: TileCell['type']): TileCell => ({ type, layerTag: 'ground' }); // 创建单元格辅助函数
const blueprint = (tile: TileCell['type']): Blueprint => ({ id: tile, name: tile, tile, cost: [] }); // 创建蓝图辅助函数

describe('BuildRules', () => { // 建造规则测试套件
  it('validates placement rules', () => { // 测试放置规则
    const grass = cell('GRASS'); // 草地单元
    const water = cell('WATER'); // 水面单元
    const emptyNeighbors = [cell('GRASS'), cell('GRASS'), cell('GRASS'), cell('GRASS')]; // 空邻居
    expect(canPlace(blueprint('ROAD'), grass, emptyNeighbors)).toBe(true); // 草地可放道路
    expect(canPlace(blueprint('TREE'), grass, emptyNeighbors)).toBe(true); // 草地可放树
    expect(canPlace(blueprint('TREE'), water, emptyNeighbors)).toBe(false); // 水面不可放树
  }); // 用例结束
  it('validates removal rules', () => { // 测试拆除规则
    expect(canRemove(cell('WALL'))).toBe(true); // 墙可拆
    expect(canRemove(cell('HOUSE'))).toBe(true); // 房屋可拆
    expect(canRemove(cell('WATER'))).toBe(false); // 水面不可拆
  }); // 用例结束
}); // 套件结束
