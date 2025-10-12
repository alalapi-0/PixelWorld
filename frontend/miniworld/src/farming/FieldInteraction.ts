// 引入作物系统
import { CropSystem, DayContext } from "./CropSystem"; // 作物系统
// 定义背包接口
export interface InventoryBridge { // 背包操作
  has(itemId: string, quantity: number): boolean; // 判断库存
  consume(itemId: string, quantity: number): boolean; // 消耗物品
  add(itemId: string, quantity: number): void; // 添加物品
} // 结束接口
// 定义种子映射
export type SeedMapping = Record<string, string>; // 种子与作物映射
// 田地交互类
export class FieldInteraction { // 负责与作物系统交互
  constructor(private crops: CropSystem, private inventory: InventoryBridge, private seedMap: SeedMapping) {} // 保存依赖
  plant(seedId: string, fieldIndex: number, context: DayContext): boolean { // 播种操作
    const cropId = this.seedMap[seedId]; // 查找对应作物
    if (!cropId) { // 没有映射
      return false; // 拒绝
    } // 结束条件
    if (!this.inventory.has(seedId, 1)) { // 检查库存
      return false; // 无种子
    } // 结束条件
    const planted = this.crops.plant(fieldIndex, cropId, context); // 调用播种
    if (planted) { // 成功播种
      this.inventory.consume(seedId, 1); // 扣除种子
    } // 结束条件
    return planted; // 返回结果
  } // 结束方法
  water(fieldIndex: number): boolean { // 浇水操作
    return this.crops.water(fieldIndex); // 直接调用作物系统
  } // 结束方法
  harvest(fieldIndex: number): boolean { // 收获操作
    const result = this.crops.harvest(fieldIndex); // 获取收获
    if (!result) { // 若无收获
      return false; // 返回失败
    } // 结束条件
    this.inventory.add(result.itemId, result.count); // 将收获加入背包
    return true; // 成功
  } // 结束方法
} // 结束类
