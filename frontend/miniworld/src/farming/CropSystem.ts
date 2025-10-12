// 定义作物阶段
export interface CropStage { // 描述每个生长期
  days: number; // 所需天数
} // 结束接口
// 定义产出
export interface CropYield { // 描述收获物
  itemId: string; // 物品 ID
  count: string; // 数量区间
} // 结束接口
// 定义作物
export interface CropDefinition { // 作物定义
  seasons: string[]; // 适合季节
  stages: CropStage[]; // 生长阶段
  yield: CropYield; // 收获
  waterPerDay: number; // 每日需浇水次数
  witherIfOutOfSeason?: boolean; // 跨季枯萎
} // 结束接口
// 定义田地状态
export interface FieldState { // 田地结构
  x: number; // 坐标 X
  y: number; // 坐标 Y
  cropId: string | null; // 当前作物 ID
  stage: number; // 当前阶段索引
  progress: number; // 当前阶段累计天数
  watered: boolean; // 是否已浇水
  dayPlanted: number | null; // 播种日
  withered: boolean; // 是否枯萎
} // 结束接口
// 定义天气上下文
export interface DayContext { // 当日环境
  season: string; // 当前季节
  day: number; // 当前日期
  weather: string; // 当前天气
} // 结束接口
// 定义收获结果
export interface HarvestResult { // 收获结果
  itemId: string; // 物品 ID
  count: number; // 数量
} // 结束接口
// 作物系统主体
export class CropSystem { // 管理作物生长
  private logs: string[] = []; // 记录日志
  constructor(private crops: Record<string, CropDefinition>, private fields: FieldState[]) {} // 构造函数
  getFields(): FieldState[] { // 返回田地列表
    return this.fields; // 返回数组
  } // 结束方法
  plant(fieldIndex: number, cropId: string, context: DayContext): boolean { // 播种
    const field = this.fields[fieldIndex]; // 获取田地
    const crop = this.crops[cropId]; // 获取作物定义
    if (!field || !crop) { // 校验
      return false; // 无法播种
    } // 结束条件
    if (field.cropId) { // 田地已占用
      return false; // 不允许覆盖
    } // 结束条件
    if (!crop.seasons.map(season => season.toLowerCase()).includes(context.season.toLowerCase())) { // 季节不匹配
      return false; // 拒绝播种
    } // 结束条件
    field.cropId = cropId; // 设置作物
    field.stage = 0; // 重置阶段
    field.progress = 0; // 重置进度
    field.dayPlanted = context.day; // 记录播种日
    field.watered = false; // 重置浇水状态
    field.withered = false; // 清除枯萎
    this.logs.push(`播种${cropId}于(${field.x},${field.y})`); // 写入日志
    return true; // 播种成功
  } // 结束方法
  water(fieldIndex: number): boolean { // 浇水
    const field = this.fields[fieldIndex]; // 获取田地
    if (!field || !field.cropId || field.withered) { // 校验
      return false; // 无法浇水
    } // 结束条件
    field.watered = true; // 标记浇水
    this.logs.push(`浇水(${field.x},${field.y})`); // 写入日志
    return true; // 成功
  } // 结束方法
  advanceDay(context: DayContext): void { // 推进一天
    this.fields.forEach(field => { // 遍历田地
      if (!field.cropId || field.withered) { // 若为空或枯萎
        field.watered = false; // 清空浇水标记
        return; // 跳过
      } // 结束条件
      const crop = this.crops[field.cropId]; // 获取作物
      if (!crop) { // 若定义缺失
        return; // 跳过
      } // 结束条件
      if (crop.witherIfOutOfSeason && !crop.seasons.map(season => season.toLowerCase()).includes(context.season.toLowerCase())) { // 跨季枯萎
        field.withered = true; // 标记枯萎
        this.logs.push(`作物${field.cropId}因季节枯萎`); // 记录日志
        return; // 跳过
      } // 结束条件
      const autoWater = context.weather === "rain"; // 雨天自动浇水
      if (context.weather === "storm" && this.shouldWither(field, context.day)) { // 暴风摧毁判定
        field.withered = true; // 标记枯萎
        this.logs.push(`暴风摧毁(${field.x},${field.y})`); // 写入日志
        return; // 跳过
      } // 结束条件
      const watered = autoWater || field.watered; // 计算浇水状态
      if (!watered) { // 未浇水
        field.progress = 0; // 不增长
        field.watered = false; // 清空
        return; // 跳过
      } // 结束条件
      field.progress += 1; // 增加进度
      const stageDef = crop.stages[field.stage]; // 当前阶段定义
      if (stageDef && field.progress >= stageDef.days) { // 达到阶段需求
        field.stage += 1; // 进入下一阶段
        field.progress = 0; // 重置进度
      } // 结束条件
      field.watered = false; // 重置浇水
    }); // 结束遍历
  } // 结束方法
  harvest(fieldIndex: number): HarvestResult | null { // 收获
    const field = this.fields[fieldIndex]; // 获取田地
    if (!field || !field.cropId || field.withered) { // 校验
      return null; // 无法收获
    } // 结束条件
    const crop = this.crops[field.cropId]; // 获取定义
    if (!crop) { // 无定义
      return null; // 失败
    } // 结束条件
    if (field.stage < crop.stages.length) { // 未成熟
      return null; // 拒绝收获
    } // 结束条件
    const count = this.parseYieldCount(crop.yield.count); // 解析数量
    const result: HarvestResult = { itemId: crop.yield.itemId, count }; // 构建结果
    this.logs.push(`收获${crop.yield.itemId}数量${count}`); // 写入日志
    field.cropId = null; // 清空田地
    field.stage = 0; // 重置阶段
    field.progress = 0; // 重置进度
    field.dayPlanted = null; // 清除播种日
    field.withered = false; // 清除枯萎
    return result; // 返回结果
  } // 结束方法
  getLogs(): string[] { // 获取日志
    return [...this.logs]; // 返回副本
  } // 结束方法
  private parseYieldCount(count: string): number { // 解析数量区间
    if (count.includes("..")) { // 范围格式
      const [minStr, maxStr] = count.split(".."); // 拆分
      const min = Number(minStr); // 最小值
      return min; // 为可预测性使用最小值
    } // 结束条件
    return Number(count); // 固定数量
  } // 结束方法
  private shouldWither(field: FieldState, day: number): boolean { // 暴风枯萎判定
    const seed = field.x + field.y + day; // 构建种子
    return seed % 3 === 0; // 使用固定模式模拟概率
  } // 结束方法
} // 结束类
