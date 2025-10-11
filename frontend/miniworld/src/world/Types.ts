export type TileType = 'GRASS' | 'ROAD' | 'TILE_FLOOR' | 'WATER' | 'LAKE' | 'WALL' | 'TREE' | 'HOUSE' | 'ROCK' | 'LAVA'; // 定义地形类型联合类型
export interface GridPos { x: number; y: number; } // 定义网格坐标接口
export interface TileCell { type: TileType; layerTag?: 'ground' | 'overpass'; } // 定义单元格数据结构
