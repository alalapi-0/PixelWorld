import { TileCell, TileType } from './Types'; // 引入类型定义
// 分隔注释 // 保持行有注释
const WALKABLE_TYPES: TileType[] = ['GRASS', 'ROAD', 'TILE_FLOOR']; // 定义可通行地形集合
// 分隔注释 // 保持行有注释
export function genDemoMap(width: number, height: number): TileCell[][] { // 生成演示地图
  const map: TileCell[][] = []; // 初始化地图数组
  for (let y = 0; y < height; y += 1) { // 遍历行
    const row: TileCell[] = []; // 初始化当前行
    for (let x = 0; x < width; x += 1) { // 遍历列
      row.push({ type: 'GRASS', layerTag: 'ground' }); // 默认填充草地
    } // 列循环结束
    map.push(row); // 将行加入地图
  } // 行循环结束
  for (let x = 0; x < width; x += 1) { // 构建道路
    map[5][x] = { type: 'ROAD', layerTag: 'ground' }; // 设置水平道路
  } // 道路循环结束
  for (let y = 2; y < 5; y += 1) { // 构建水域
    map[y][2] = { type: 'WATER', layerTag: 'ground' }; // 设置河流单元
    map[y][3] = { type: 'LAKE', layerTag: 'ground' }; // 设置湖泊单元
  } // 水域循环结束
  map[7][7] = { type: 'HOUSE', layerTag: 'ground' }; // 放置房屋
  map[2][7] = { type: 'TREE', layerTag: 'ground' }; // 放置树木
  map[6][4] = { type: 'ROCK', layerTag: 'ground' }; // 放置岩石
  map[3][8] = { type: 'LAVA', layerTag: 'ground' }; // 放置岩浆
  map[4][4] = { type: 'WALL', layerTag: 'ground' }; // 放置墙体
  map[4][5] = { type: 'TILE_FLOOR', layerTag: 'overpass' }; // 设置可穿越的桥
  map[4][6] = { type: 'TILE_FLOOR', layerTag: 'overpass' }; // 桥的延伸
  return map; // 返回生成的地图
} // 函数结束
// 分隔注释 // 保持行有注释
export function isWalkable(cell: TileCell): boolean { // 判断单元格是否可走
  return WALKABLE_TYPES.includes(cell.type); // 根据可通行集合判断
} // 函数结束
// 分隔注释 // 保持行有注释
export function layerOf(cell: TileCell): 'ground' | 'overpass' { // 获取单元格层位
  return cell.layerTag ?? 'ground'; // 默认返回地面层
} // 函数结束
