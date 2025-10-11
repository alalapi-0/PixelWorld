export interface ItemStack { // 定义物品堆接口
  id: string; // 物品ID
  count: number; // 物品数量
} // 接口结束

export interface Inventory { // 定义背包接口
  slots: ItemStack[]; // 背包槽位列表
  capacity: number; // 背包容量
} // 接口结束

type InventoryListener = (inventory: Inventory) => void; // 定义背包监听器类型

export class InventorySystem { // 定义背包系统类
  private data: Inventory; // 存储背包数据
  private listeners: Set<InventoryListener> = new Set(); // 存储监听器集合

  public constructor(capacity: number, initialItems: Record<string, number>) { // 构造函数接收容量与初始物品
    const slots: ItemStack[] = []; // 初始化槽位数组
    Object.entries(initialItems).forEach(([id, count]) => { // 遍历初始物品
      slots.push({ id, count }); // 将物品推入槽位
    }); // 遍历结束
    this.data = { slots, capacity }; // 构造背包数据
  } // 构造函数结束

  public getInventory(): Inventory { // 获取背包数据方法
    return { slots: [...this.data.slots], capacity: this.data.capacity }; // 返回背包副本
  } // 方法结束

  public addItem(id: string, count: number): void { // 添加物品方法
    const slot = this.data.slots.find((entry) => entry.id === id); // 查找已有槽位
    if (slot) { // 如果槽位存在
      slot.count += count; // 增加数量
    } else if (this.data.slots.length < this.data.capacity) { // 检查是否还有空位
      this.data.slots.push({ id, count }); // 新增槽位
    } // 条件结束
    this.emitChange(); // 通知监听器
  } // 方法结束

  public removeItem(id: string, count: number): boolean { // 移除物品方法
    const slot = this.data.slots.find((entry) => entry.id === id); // 查找槽位
    if (!slot || slot.count < count) { // 如果不存在或数量不足
      return false; // 返回失败
    } // 条件结束
    slot.count -= count; // 减少数量
    if (slot.count <= 0) { // 如果数量耗尽
      this.data.slots = this.data.slots.filter((entry) => entry !== slot); // 移除槽位
    } // 条件结束
    this.emitChange(); // 通知监听器
    return true; // 返回成功
  } // 方法结束

  public splitStack(id: string): ItemStack | undefined { // 拆分堆叠方法
    const slot = this.data.slots.find((entry) => entry.id === id); // 查找槽位
    if (!slot || slot.count < 2) { // 如果数量不足以拆分
      return undefined; // 返回未定义
    } // 条件结束
    const half = Math.floor(slot.count / 2); // 计算拆分数量
    slot.count -= half; // 原槽位减少数量
    if (this.data.slots.length < this.data.capacity) { // 检查是否有空位
      const newStack: ItemStack = { id, count: half }; // 创建新堆
      this.data.slots.push(newStack); // 添加新槽位
      this.emitChange(); // 通知监听器
      return newStack; // 返回新堆
    } else { // 如果没有空位
      slot.count += half; // 恢复原数量
      return undefined; // 返回未定义
    } // 条件结束
  } // 方法结束

  public onChange(listener: InventoryListener): void { // 添加监听器方法
    this.listeners.add(listener); // 加入集合
  } // 方法结束

  public offChange(listener: InventoryListener): void { // 移除监听器方法
    this.listeners.delete(listener); // 从集合中删除
  } // 方法结束

  private emitChange(): void { // 通知监听器方法
    const snapshot = this.getInventory(); // 获取背包快照
    this.listeners.forEach((listener) => listener(snapshot)); // 遍历调用监听器
  } // 方法结束
} // 类结束
