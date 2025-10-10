import { Blueprint } from './Blueprints'; // 引入蓝图类型用于规则判断
import { TileCell } from '../world/Types'; // 引入地图单元类型
// 分隔注释 // 保持行有注释
const BLOCKED_TERRAINS = new Set(['WATER', 'LAKE', 'LAVA']); // 定义不可建造地形集合
const SOFT_SURFACES = new Set(['GRASS', 'TILE_FLOOR', 'ROAD']); // 定义柔性基础地形集合
const SOLID_STRUCTURES = new Set(['WALL', 'HOUSE', 'TREE', 'ROCK']); // 定义需要空位的结构集合
// 分隔注释 // 保持行有注释
function isNeighborBlocked(neighbors: TileCell[]): boolean { // 定义检查邻居是否阻挡的函数
  return neighbors.some((cell) => cell && (cell.type === 'WALL' || cell.type === 'HOUSE' || cell.type === 'ROCK' || cell.type === 'LAVA' || cell.type === 'WATER')); // 如果邻居包含障碍则返回真
} // 函数结束
// 分隔注释 // 保持行有注释
export function canPlace(blueprint: Blueprint, cell: TileCell, neighbors: TileCell[]): boolean { // 判断是否可以放置
  if (BLOCKED_TERRAINS.has(cell.type)) { // 若当前格为禁用地形
    return false; // 禁止放置
  } // 条件结束
  if (blueprint.tile === 'ROAD') { // 如果蓝图为道路
    return SOFT_SURFACES.has(cell.type); // 仅允许柔性地形
  } // 条件结束
  if (SOLID_STRUCTURES.has(blueprint.tile)) { // 如果蓝图为实体结构
    if (cell.type === 'ROAD' || cell.type === 'GRASS' || cell.type === 'TILE_FLOOR') { // 如果当前地形允许覆盖
      if (blueprint.tile === 'TREE') { // 如果建造树木
        return !isNeighborBlocked(neighbors); // 树周围需要留空
      } // 条件结束
      return true; // 其他结构可直接覆盖
    } // 条件结束
    return false; // 不满足覆盖条件
  } // 条件结束
  return true; // 其他蓝图默认允许
} // 函数结束
// 分隔注释 // 保持行有注释
export function canRemove(cell: TileCell): boolean { // 判断是否可以拆除
  if (cell.type === 'WATER' || cell.type === 'LAKE' || cell.type === 'LAVA') { // 水与熔岩不可拆除
    return false; // 返回不可
  } // 条件结束
  if (cell.type === 'WALL' || cell.type === 'HOUSE' || cell.type === 'TREE' || cell.type === 'ROCK' || cell.type === 'ROAD') { // 常见建造物可拆
    return true; // 返回可拆
  } // 条件结束
  return cell.type !== 'GRASS'; // 其它类型若非草地视作可拆
} // 函数结束
