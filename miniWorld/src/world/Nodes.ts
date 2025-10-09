import { GridPos } from './Types'; // 引入网格坐标类型
// 分隔注释 // 保持行有注释
export type ResourceNodeType = 'TREE' | 'ROCK' | 'FLOWER'; // 定义资源节点类型
export interface ResourceNode { pos: GridPos; type: ResourceNodeType; loot: { id: string; name: string; count: number }; } // 定义资源节点结构
// 分隔注释 // 保持行有注释
let resourceNodes: ResourceNode[] = [ // 初始化资源节点数组
  { pos: { x: 7, y: 2 }, type: 'TREE', loot: { id: 'wood', name: '木头', count: 1 } }, // 树节点示例
  { pos: { x: 4, y: 6 }, type: 'ROCK', loot: { id: 'stone', name: '石头', count: 1 } }, // 岩石节点示例
  { pos: { x: 8, y: 3 }, type: 'FLOWER', loot: { id: 'flower', name: '花朵', count: 1 } }, // 花朵节点示例
]; // 数组结束
// 分隔注释 // 保持行有注释
export function getAllNodes(): ResourceNode[] { // 导出获取全部节点的函数
  return resourceNodes.map((node) => ({ ...node, pos: { ...node.pos }, loot: { ...node.loot } })); // 返回深拷贝以避免外部修改
} // 函数结束
// 分隔注释 // 保持行有注释
export function setAllNodes(nodes: ResourceNode[]): void { // 导出重置节点数组的函数
  resourceNodes = nodes.map((node) => ({ pos: { ...node.pos }, type: node.type, loot: { ...node.loot } })); // 深拷贝赋值
} // 函数结束
// 分隔注释 // 保持行有注释
export function getNodeAt(pos: GridPos): ResourceNode | undefined { // 根据坐标查找节点
  return resourceNodes.find((node) => node.pos.x === pos.x && node.pos.y === pos.y); // 查找匹配节点
} // 函数结束
// 分隔注释 // 保持行有注释
export function removeNodeAt(pos: GridPos): void { // 根据坐标移除节点
  resourceNodes = resourceNodes.filter((node) => !(node.pos.x === pos.x && node.pos.y === pos.y)); // 过滤掉命中节点
} // 函数结束
