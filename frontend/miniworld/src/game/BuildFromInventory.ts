import { InventorySystem } from './InventorySystem'; // 引入背包系统
import { SaveManager } from '../save/SaveManager'; // 引入存档管理器

interface BlueprintCost { // 定义蓝图消耗接口
  item: string; // 消耗物品ID
  count: number; // 消耗数量
} // 接口结束

interface BlueprintRecord { // 定义蓝图记录接口
  id: string; // 蓝图ID
  result: string; // 建造结果描述
  cost: BlueprintCost[]; // 消耗列表
} // 接口结束

type PlaceCallback = (blueprintId: string) => void; // 定义放置回调类型

export class BuildFromInventory { // 定义建造逻辑类
  private blueprints: BlueprintRecord[] = []; // 缓存蓝图数据

  public constructor(private inventory: InventorySystem, private onPlace: PlaceCallback) { // 构造函数保存依赖
    void this.loadBlueprints(); // 异步加载蓝图
  } // 构造函数结束

  private async loadBlueprints(): Promise<void> { // 加载蓝图方法
    try { // 尝试加载
      const response = await fetch('assets/auto/blueprints_auto.json'); // 请求蓝图JSON
      if (!response.ok) { // 如果状态异常
        console.warn('无法加载蓝图文件'); // 输出警告
        return; // 结束方法
      } // 条件结束
      this.blueprints = (await response.json()) as BlueprintRecord[]; // 解析并缓存蓝图
    } catch (error) { // 捕获错误
      console.warn('加载蓝图时出现异常', error); // 输出警告
    } // 错误处理结束
  } // 方法结束

  public build(itemId: string, count: number): void { // 触发建造方法
    const blueprint = this.blueprints.find((entry) => entry.cost.some((cost) => cost.item === itemId)); // 查找包含物品的蓝图
    if (!blueprint) { // 如果没有蓝图
      this.showPopup('没有可用蓝图'); // 显示提示
      return; // 结束方法
    } // 条件结束
    const cost = blueprint.cost.find((entry) => entry.item === itemId); // 查找具体消耗
    if (!cost || cost.count > count) { // 如果消耗大于拥有数量
      this.showPopup('材料不足'); // 显示提示
      return; // 结束方法
    } // 条件结束
    const success = this.inventory.removeItem(itemId, cost.count); // 扣除物品
    if (!success) { // 如果扣除失败
      this.showPopup('材料不足'); // 再次提示
      return; // 结束方法
    } // 条件结束
    this.onPlace(blueprint.id); // 调用放置回调
    SaveManager.updateInventory(this.inventory.getInventory().slots.reduce<Record<string, number>>((acc, stack) => { // 更新存档
      acc[stack.id] = stack.count; // 记录数量
      return acc; // 返回累加器
    }, {})); // 完成归档
  } // 方法结束

  private showPopup(message: string): void { // 显示提示方法
    alert(message); // 使用浏览器弹窗提示
  } // 方法结束
} // 类结束
