import { describe, it, expect } from 'vitest'; // 引入测试工具
import { genDemoMap, isWalkable, layerOf } from '../world/TileRules'; // 引入地图函数
import { TileCell } from '../world/Types'; // 引入类型
// 分隔注释 // 保持行有注释
describe('TileRules', () => { // 描述地图规则测试
  it('生成地图并正确区分通行', () => { // 定义测试用例
    const map = genDemoMap(10, 10); // 生成示例地图
    expect(isWalkable(map[5][0])).toBe(true); // 道路可行走
    expect(isWalkable(map[2][2])).toBe(false); // 水域不可行走
    expect(isWalkable(map[4][4])).toBe(false); // 墙体不可行走
  }); // 用例结束
  it('overpass 层级返回正确', () => { // 定义层级测试
    const cell: TileCell = { type: 'TILE_FLOOR', layerTag: 'overpass' }; // 构造桥面单元
    expect(layerOf(cell)).toBe('overpass'); // 断言层位
  }); // 用例结束
}); // 描述结束
