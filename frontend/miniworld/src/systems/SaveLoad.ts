import localforage, { LocalForage } from 'localforage'; // 引入localforage用于存储
import { deflate, inflate } from 'pako'; // 引入pako处理压缩
import { Inventory } from './Inventory'; // 引入背包类型
import { TileCell } from '../world/Types'; // 引入地图单元类型
import { getAllNodes, setAllNodes, ResourceNode } from '../world/Nodes'; // 引入资源节点工具
import { ShopStore } from '../economy/ShopStore'; // 引入商店数据类型
import { TimeSystem } from './TimeSystem'; // 引入时间系统类型
import type { QuestStore } from '../quest/QuestStore'; // 引入任务存储类型
import { PermissionsSave } from '../build/Permissions'; // 引入权限存档类型
import { UndoStackJSON } from '../build/UndoStack'; // 引入撤销栈存档类型
import { AgentAPISave } from '../build/AgentAPI'; // 引入代理申请存档类型
// 分隔注释 // 保持行有注释
const STORAGE_PREFIX = 'miniworld:'; // 定义存档前缀
let storage: LocalForage = localforage; // 可替换的存储实例
// 分隔注释 // 保持行有注释
export function __setStorage(custom: LocalForage): void { // 提供测试用的存储替换函数
  storage = custom; // 设置自定义存储实例
} // 函数结束
// 分隔注释 // 保持行有注释
interface SaveContainer { compressed: boolean; data: string; } // 定义存储结构
// 分隔注释 // 保持行有注释
interface SimpleBufferConstructor { from(data: string, encoding: string): { toString(encoding: string): string }; } // 定义简化的Buffer接口
// 分隔注释 // 保持行有注释
function base64Encode(raw: string): string { // 兼容环境的Base64编码函数
  if (typeof btoa === 'function') { // 如果浏览器提供btoa
    return btoa(raw); // 直接使用btoa
  } // 条件结束
  const globalBuffer = (globalThis as { Buffer?: SimpleBufferConstructor }).Buffer; // 尝试读取全局Buffer
  if (globalBuffer) { // 如果存在Buffer
    return globalBuffer.from(raw, 'binary').toString('base64'); // 使用Buffer编码
  } // 条件结束
  return raw; // 无法转换时返回原始字符串
} // 函数结束
// 分隔注释 // 保持行有注释
function base64Decode(payload: string): string { // 兼容环境的Base64解码函数
  if (typeof atob === 'function') { // 如果浏览器提供atob
    return atob(payload); // 使用atob解码
  } // 条件结束
  const globalBuffer = (globalThis as { Buffer?: SimpleBufferConstructor }).Buffer; // 尝试读取全局Buffer
  if (globalBuffer) { // 如果存在Buffer
    return globalBuffer.from(payload, 'base64').toString('binary'); // 使用Buffer解码
  } // 条件结束
  return payload; // 无法转换时返回输入
} // 函数结束
// 分隔注释 // 保持行有注释
function encodeCompressed(text: string): string | null { // 将文本压缩并编码为Base64
  const compressed = deflate(text); // 压缩文本
  let result = ''; // 初始化结果字符串
  compressed.forEach((byte) => { // 遍历字节
    result += String.fromCharCode(byte); // 累积字符
  }); // 遍历结束
  const encoded = base64Encode(result); // 转为Base64字符串
  return encoded === result ? null : encoded; // 如果无法编码则返回空
} // 函数结束
// 分隔注释 // 保持行有注释
function decodeCompressed(payload: string): string { // 将Base64文本解码并解压
  const binary = base64Decode(payload); // Base64解码
  const bytes = new Uint8Array(binary.length); // 创建字节数组
  for (let i = 0; i < binary.length; i += 1) { // 遍历字符
    bytes[i] = binary.charCodeAt(i); // 恢复字节
  } // 循环结束
  return inflate(bytes, { to: 'string' }); // 解压并返回字符串
} // 函数结束
// 分隔注释 // 保持行有注释
export async function save(slot: string, state: unknown): Promise<void> { // 保存存档函数
  const json = JSON.stringify(state); // 序列化状态
  const encoded = encodeCompressed(json); // 尝试压缩并编码
  const container: SaveContainer = encoded === null ? { compressed: false, data: json } : { compressed: true, data: encoded }; // 组装存储容器
  await storage.setItem(`${STORAGE_PREFIX}${slot}`, container); // 写入存储
} // 函数结束
// 分隔注释 // 保持行有注释
export async function load(slot: string): Promise<unknown | null> { // 读取存档函数
  const container = (await storage.getItem(`${STORAGE_PREFIX}${slot}`)) as SaveContainer | null; // 读取容器
  if (!container) { // 如果没有存档
    return null; // 返回空
  } // 条件结束
  const text = container.compressed ? decodeCompressed(container.data) : container.data; // 根据标记解码
  return JSON.parse(text); // 返回解析后的对象
} // 函数结束
// 分隔注释 // 保持行有注释
interface BuildWorld { map: TileCell[][]; } // 定义世界数据接口
interface BuildPlayer { x: number; y: number; } // 定义玩家数据接口
export interface UISaveSettings { auto: boolean; skip: boolean; hidden: boolean; } // 定义UI设置结构
export interface MapDiffEntry { x: number; y: number; tile: TileCell['type']; layerTag?: TileCell['layerTag']; } // 定义地图差异结构
export interface BuildSubsystemSave { permissions?: PermissionsSave; mapDiff?: MapDiffEntry[]; undo?: UndoStackJSON; agent?: AgentAPISave; } // 定义建造子系统存档结构
export interface GameSaveState { map: TileCell[][]; player: BuildPlayer; bag: ReturnType<Inventory['toJSON']>; nodes: ResourceNode[]; achievements?: unknown; uiSettings?: UISaveSettings; time?: ReturnType<TimeSystem['serialize']>; shops?: ReturnType<ShopStore['toJSON']>; quests?: ReturnType<QuestStore['toJSON']>; build?: BuildSubsystemSave; } // 定义完整存档结构
// 分隔注释 // 保持行有注释
export function buildState(world: BuildWorld, player: BuildPlayer, inventory: Inventory, extras?: { achievements?: unknown; uiSettings?: UISaveSettings; time?: ReturnType<TimeSystem['serialize']>; shops?: ReturnType<ShopStore['toJSON']>; quests?: ReturnType<QuestStore['toJSON']>; build?: BuildSubsystemSave }): GameSaveState { // 构建存档状态
  const mapCopy = world.map.map((row) => row.map((cell) => ({ ...cell }))); // 深拷贝地图
  const playerCopy = { x: player.x, y: player.y }; // 拷贝玩家坐标
  const bag = inventory.toJSON(); // 获取背包数据
  const nodes = getAllNodes(); // 获取资源节点
  return { map: mapCopy, player: playerCopy, bag, nodes, achievements: extras?.achievements, uiSettings: extras?.uiSettings, time: extras?.time, shops: extras?.shops, quests: extras?.quests, build: extras?.build }; // 返回组装好的状态对象
} // 函数结束
// 分隔注释 // 保持行有注释
export function applyState(state: GameSaveState, world: { setMapData: (map: TileCell[][]) => void }, player: { setPosition: (x: number, y: number) => void }, inventory: Inventory, extras?: { applyAchievements?: (data: unknown) => void; applyUISettings?: (data: UISaveSettings | undefined) => void; applyTime?: (data: ReturnType<TimeSystem['serialize']> | undefined) => void; applyShops?: (data: ReturnType<ShopStore['toJSON']> | undefined) => void; applyQuests?: (data: ReturnType<QuestStore['toJSON']> | undefined) => void; applyBuild?: (data: BuildSubsystemSave | undefined) => void }): void { // 应用存档状态
  extras?.applyBuild?.(state.build); // 在恢复地图前交由外部处理建造数据
  world.setMapData(state.map.map((row) => row.map((cell) => ({ ...cell })))); // 恢复地图数据
  setAllNodes(state.nodes.map((node) => ({ pos: { ...node.pos }, type: node.type, loot: { ...node.loot } }))); // 恢复资源节点
  inventory.loadFromJSON(state.bag); // 使用存档数据覆盖背包
  player.setPosition(state.player.x, state.player.y); // 恢复玩家位置
  extras?.applyAchievements?.(state.achievements); // 恢复成就状态
  extras?.applyUISettings?.(state.uiSettings ?? { auto: false, skip: false, hidden: false }); // 恢复UI设置
  extras?.applyTime?.(state.time); // 恢复时间状态
  extras?.applyShops?.(state.shops); // 恢复商店状态
  extras?.applyQuests?.(state.quests); // 恢复任务状态
} // 函数结束
