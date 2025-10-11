export interface Item { id: string; name: string; count: number; } // 定义物品结构
// 分隔注释 // 保持行有注释
export class Inventory { // 定义背包类
  private items: Map<string, Item>; // 使用Map保存物品
  // 分隔注释 // 保持行有注释
  public constructor() { // 构造函数
    this.items = new Map(); // 初始化Map
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public add(id: string, name: string, delta: number): void { // 增加或减少物品数量
    const current = this.items.get(id); // 获取当前物品
    if (current) { // 如果存在
      const nextCount = Math.max(0, current.count + delta); // 计算新的数量并防止负数
      this.items.set(id, { id, name: current.name, count: nextCount }); // 更新物品数量
    } else { // 如果不存在
      this.items.set(id, { id, name, count: Math.max(0, delta) }); // 创建新物品并防止负数
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getAll(): Item[] { // 获取所有物品列表
    return Array.from(this.items.values()).map((item) => ({ ...item })); // 返回浅拷贝数组
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public has(id: string, count: number): boolean { // 判断是否拥有指定数量
    const item = this.items.get(id); // 获取物品
    return item !== undefined && item.count >= count; // 返回是否满足数量
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public toJSON(): { items: Item[] } { // 序列化背包
    return { items: this.getAll() }; // 返回物品数组包装
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public loadFromJSON(json: { items: Item[] }): void { // 将JSON数据载入背包
    this.items.clear(); // 清空当前数据
    json.items.forEach((item) => { // 遍历序列化物品
      this.items.set(item.id, { ...item }); // 逐条写入Map
    }); // 遍历结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public static fromJSON(json: { items: Item[] }): Inventory { // 反序列化背包
    const inventory = new Inventory(); // 创建新实例
    inventory.loadFromJSON(json); // 使用载入方法恢复数据
    return inventory; // 返回实例
  } // 方法结束
} // 类结束
