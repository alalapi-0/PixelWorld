// 定义时间段结构
export interface ScheduleBlock { // 描述一个时间段
  time: string; // 时间范围文本
  place: string; // 对应地点
} // 结束接口
// 定义 NPC 日程配置
export interface NPCScheduleConfig { // 包含平日与节日安排
  weekdays: ScheduleBlock[]; // 工作日安排
  closed: string[]; // 休息日缩写
  festivalOverride: Record<string, ScheduleBlock[]>; // 节日覆盖
} // 结束接口
// 定义查询结果
export interface ScheduleResult { // 返回 NPC 是否在场
  available: boolean; // 是否可互动
  place?: string; // 可选地点描述
  reason?: string; // 不可用原因
} // 结束接口
// 日程系统主体
export class NPCScheduleSystem { // 管理所有 NPC 日程
  constructor(private schedules: Record<string, NPCScheduleConfig>) {} // 构造函数直接保存数据
  isAvailable(npcId: string, weekday: string, time: string, festivalId?: string | null): ScheduleResult { // 判断是否在场
    const config = this.schedules[npcId]; // 取出 NPC 配置
    if (!config) { // 若无配置
      return { available: false, reason: "unknown" }; // 返回未知
    } // 结束条件
    const override = festivalId ? config.festivalOverride[festivalId] : undefined; // 检查节日覆盖
    if (override) { // 如果有节日覆盖
      const block = this.findBlock(override, time); // 查找时间块
      if (block) { // 若找到
        return { available: true, place: block.place }; // 返回可用
      } // 结束条件
      return { available: false, reason: "festival_off" }; // 节日但不在时段
    } // 结束条件
    if (config.closed.includes(weekday)) { // 若当天休息
      return { available: false, reason: "closed" }; // 返回打烊
    } // 结束条件
    const block = this.findBlock(config.weekdays, time); // 查找平日时段
    if (!block) { // 未找到
      return { available: false, reason: "off_hours" }; // 不在营业时间
    } // 结束条件
    return { available: true, place: block.place }; // 返回可互动
  } // 结束方法
  private findBlock(blocks: ScheduleBlock[], time: string): ScheduleBlock | undefined { // 内部工具
    return blocks.find(block => this.timeWithin(block.time, time)); // 查找包含当前时间的时段
  } // 结束方法
  private timeWithin(range: string, time: string): boolean { // 判断时间是否在范围内
    const [start, end] = range.split("-"); // 拆分起止
    return time >= start && time <= end; // 简单字符串比较满足 HH:MM 格式
  } // 结束方法
} // 结束类
