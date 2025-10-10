import Phaser from 'phaser'; // 引入Phaser用于资源加载
import sampleData from './blueprints.sample.json'; // 引入示例蓝图数据
import { TileType } from '../world/Types'; // 引入地形类型以确保类型正确
// 分隔注释 // 保持行有注释
export type BlueprintCost = { id: string; name: string; count: number }; // 定义蓝图消耗结构
export type Blueprint = { id: string; name: string; tile: TileType; cost: BlueprintCost[] }; // 定义蓝图结构
interface BlueprintFile { tileSize?: number; list?: Blueprint[] }; // 定义蓝图文件结构
// 分隔注释 // 保持行有注释
async function fetchJson(url: string): Promise<BlueprintFile | null> { // 定义异步获取JSON的辅助函数
  try { // 尝试执行请求
    const response = await fetch(url, { method: 'GET', cache: 'no-cache' }); // 发起网络请求
    if (!response.ok) { // 如果响应非成功
      return null; // 返回空表示失败
    } // 条件结束
    const data = (await response.json()) as BlueprintFile; // 解析JSON数据
    return data; // 返回数据
  } catch (error) { // 捕获网络异常
    console.warn('Failed to fetch blueprint json', error); // 在控制台输出警告
    return null; // 返回空表示失败
  } // 捕获结束
} // 函数结束
// 分隔注释 // 保持行有注释
export class Blueprints { // 定义蓝图管理类
  private items: Blueprint[] = (sampleData.list ?? []) as Blueprint[]; // 初始化蓝图列表
  private tileSize: number = sampleData.tileSize ?? 32; // 初始化瓦片尺寸
  public constructor() {} // 保留空构造方便扩展
  // 分隔注释 // 保持行有注释
  public async load(_scene: Phaser.Scene): Promise<void> { // 定义加载函数
    const externalUrl = '/assets_external/build/blueprints.json'; // 定义外部覆盖路径
    const external = await fetchJson(externalUrl); // 尝试读取外部蓝图
    if (external?.list && external.list.length > 0) { // 如果外部数据可用
      this.items = external.list as Blueprint[]; // 使用外部蓝图
      this.tileSize = external.tileSize ?? this.tileSize; // 更新瓦片尺寸
      return; // 结束函数
    } // 条件结束
    const local = sampleData as BlueprintFile; // 读取本地样本
    this.items = (local.list ?? []) as Blueprint[]; // 应用本地列表
    this.tileSize = local.tileSize ?? this.tileSize; // 更新瓦片尺寸
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public all(): Blueprint[] { // 返回全部蓝图
    return this.items.slice(); // 返回副本避免外部修改
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public get(id: string): Blueprint | undefined { // 根据ID获取蓝图
    return this.items.find((item) => item.id === id); // 查找并返回
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public indexOf(id: string): number { // 获取蓝图索引
    return this.items.findIndex((item) => item.id === id); // 查找索引
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getTileSize(): number { // 读取瓦片尺寸
    return this.tileSize; // 返回缓存的尺寸
  } // 方法结束
} // 类结束
