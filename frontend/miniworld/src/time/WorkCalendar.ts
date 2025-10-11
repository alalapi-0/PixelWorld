import { Deadline, TimeWindow } from '../agents/CommandTypes'; // 引入命令时间与截止类型
import { TimeSystem, ClockMinutes } from './TimeSystem'; // 引入时间工具
// 空行用于分隔
export interface PolicyConfig { // 声明策略配置接口
  workHours?: string; // 工作时段
  curfew?: string; // 宵禁时间
  quietTasks?: string[]; // 静音任务列表
  holiday?: string[]; // 节假日日期
} // 接口结束
// 空行用于分隔
export interface TaskTimeOptions { // 声明任务执行选项
  timeWindow?: TimeWindow; // 命令指定时间窗
  deadline?: Deadline; // 命令指定截止
  blueprintId?: string; // 蓝图标识
  silent?: boolean; // 是否请求静音
  now?: Date; // 当前时间
} // 接口结束
// 空行用于分隔
export interface TaskTimeDecision { // 声明策略判定结果
  allowed: boolean; // 是否允许执行
  reason?: string; // 拒绝原因
  nextTime?: Date; // 推荐下一执行时间
  enforcedSilent?: boolean; // 是否强制静音
  deadlineAt?: Date; // 计算后的绝对截止时间
} // 接口结束
// 空行用于分隔
interface ParsedCurfew { // 声明内部宵禁结构
  start: ClockMinutes | null; // 宵禁开始
  end: ClockMinutes | null; // 宵禁结束
} // 接口结束
// 空行用于分隔
export class WorkCalendar { // 定义工作日历类
  private policy: PolicyConfig; // 保存策略配置
  private time: TimeSystem; // 保存时间系统
  private curfew: ParsedCurfew; // 保存宵禁配置
  private workWindow: TimeWindow | undefined; // 保存工作时段
  public constructor(policy: PolicyConfig, timeSystem?: TimeSystem) { // 构造函数
    this.policy = policy; // 保存策略
    this.time = timeSystem ?? new TimeSystem(); // 初始化时间系统
    this.workWindow = this.parseWindow(policy.workHours); // 解析工作时间窗
    this.curfew = this.parseCurfew(policy.curfew); // 解析宵禁数据
  } // 构造结束
  private parseWindow(text: string | undefined): TimeWindow | undefined { // 解析时间窗字符串
    if (!text) { // 如果为空
      return undefined; // 返回空
    } // 条件结束
    const [start, end] = text.split('-').map((item) => item.trim()); // 拆分两端
    return { start, end }; // 返回时间窗
  } // 方法结束
  private parseCurfew(text: string | undefined): ParsedCurfew { // 解析宵禁字符串
    if (!text) { // 如果为空
      return { start: null, end: null }; // 返回空结构
    } // 条件结束
    const [startText, endText] = text.split('-').map((item) => item.trim()); // 拆分两端
    return { start: TimeSystem.parseClock(startText), end: TimeSystem.parseClock(endText) }; // 返回解析结果
  } // 方法结束
  public getPolicy(): PolicyConfig { // 获取策略副本
    return { ...this.policy, quietTasks: this.policy.quietTasks ? [...this.policy.quietTasks] : undefined }; // 返回浅拷贝
  } // 方法结束
  public isHoliday(date: Date): boolean { // 判断是否节假日
    if (!this.policy.holiday || this.policy.holiday.length === 0) { // 如果未配置
      return false; // 直接返回
    } // 条件结束
    const iso = date.toISOString().slice(0, 10); // 获取日期字符串
    return this.policy.holiday.includes(iso); // 判断是否包含
  } // 方法结束
  public isWithinWorkHours(date: Date): boolean { // 判断是否在工作时间
    if (this.isHoliday(date)) { // 若为假日
      return false; // 不在工作时间
    } // 条件结束
    return TimeSystem.isWithinWindow(this.workWindow, date); // 使用工具判断
  } // 方法结束
  public isCurfew(date: Date): boolean { // 判断是否处于宵禁
    if (this.curfew.start === null && this.curfew.end === null) { // 未配置宵禁
      return false; // 默认非宵禁
    } // 条件结束
    const minute = TimeSystem.extractClockMinutes(date); // 计算分钟
    const start = this.curfew.start ?? 0; // 获取开始
    const end = this.curfew.end ?? 0; // 获取结束
    if (this.curfew.start !== null && this.curfew.end !== null) { // 双端存在
      if (start <= end) { // 未跨日
        return minute >= start && minute < end; // 判断区间
      } // 条件结束
      return minute >= start || minute < end; // 跨日判断
    } // 条件结束
    if (this.curfew.start !== null) { // 只有开始
      return minute >= start; // 判断是否晚于开始
    } // 条件结束
    if (this.curfew.end !== null) { // 只有结束
      return minute < end; // 判断是否早于结束
    } // 条件结束
    return false; // 兜底返回
  } // 方法结束
  public isQuietTask(blueprintId: string | undefined): boolean { // 判断任务是否静音类
    if (!blueprintId) { // 如果未提供
      return false; // 返回否
    } // 条件结束
    return this.policy.quietTasks?.includes(blueprintId) ?? false; // 判断列表
  } // 方法结束
  private nextSlot(window: TimeWindow | undefined, from: Date, requireNonCurfew: boolean): Date | undefined { // 计算下一执行时刻
    const effectiveWindow = window ?? this.workWindow; // 选择有效时间窗
    let cursor = new Date(from.getTime()); // 初始化游标
    for (let step = 0; step < TimeSystem.MINUTES_PER_DAY * 7; step += 15) { // 最多搜索七天
      if (!this.isHoliday(cursor) && TimeSystem.isWithinWindow(effectiveWindow, cursor)) { // 判断工作条件
        if (!requireNonCurfew || !this.isCurfew(cursor)) { // 判断宵禁
          return cursor; // 返回可执行时刻
        } // 条件结束
      } // 条件结束
      cursor = TimeSystem.addMinutes(cursor, 15); // 游标前进
    } // 循环结束
    return undefined; // 未找到返回空
  } // 方法结束
  private resolveDeadline(now: Date, deadline: Deadline | undefined): Date | undefined { // 计算绝对截止
    if (!deadline) { // 如果未提供
      return undefined; // 返回空
    } // 条件结束
    if (deadline.atClock) { // 如果指定时刻
      const minutes = TimeSystem.parseClock(deadline.atClock); // 解析时刻
      if (minutes !== null) { // 如果解析成功
        const target = new Date(now); // 创建副本
        target.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0); // 设置时刻
        if (target < now) { // 如果已过
          return TimeSystem.addDays(target, 1); // 推迟到次日
        } // 条件结束
        return target; // 返回目标时间
      } // 条件结束
    } // 条件结束
    if (deadline.inDays !== undefined) { // 如果指定天数
      return TimeSystem.addDays(now, deadline.inDays); // 直接加天
    } // 条件结束
    return undefined; // 未能解析
  } // 方法结束
  public evaluate(options: TaskTimeOptions): TaskTimeDecision { // 评估任务执行许可
    const now = options.now ?? this.time.now(); // 获取当前时间
    const requireSilent = options.silent ?? this.isQuietTask(options.blueprintId); // 判断是否需要静音
    if (this.isHoliday(now)) { // 若为节假日
      return { allowed: false, reason: 'holiday', nextTime: this.nextSlot(options.timeWindow, TimeSystem.addDays(now, 1), requireSilent), enforcedSilent: requireSilent, deadlineAt: this.resolveDeadline(now, options.deadline) }; // 返回假日阻止
    } // 条件结束
    if (!TimeSystem.isWithinWindow(options.timeWindow ?? this.workWindow, now)) { // 如果不在时间窗
      return { allowed: false, reason: 'window', nextTime: this.nextSlot(options.timeWindow, now, requireSilent), enforcedSilent: requireSilent, deadlineAt: this.resolveDeadline(now, options.deadline) }; // 返回等待
    } // 条件结束
    if (requireSilent && this.isCurfew(now)) { // 如果静音任务处于宵禁
      return { allowed: false, reason: 'curfew', nextTime: this.nextSlot(options.timeWindow, now, true), enforcedSilent: true, deadlineAt: this.resolveDeadline(now, options.deadline) }; // 返回宵禁阻止
    } // 条件结束
    return { allowed: true, enforcedSilent: requireSilent, deadlineAt: this.resolveDeadline(now, options.deadline) }; // 允许执行
  } // 方法结束

  public alignToNextSlot(target: Date): Date { // 将时间对齐到下一个工作时段
    const aligned = new Date(target.getTime()); // 复制目标时间以便修改
    const minutes = aligned.getMinutes(); // 读取分钟数
    const remainder = minutes % 30; // 计算与半小时的余数
    if (remainder !== 0) { // 如果不是整半小时
      aligned.setMinutes(minutes + (30 - remainder), 0, 0); // 向上取整到最近的半小时并清理秒
    } else { // 否则已经对齐
      aligned.setSeconds(0, 0); // 将秒和毫秒清零
    } // 条件结束
    if (!this.isWithinWorkHours(aligned) || this.isCurfew(aligned)) { // 如果仍不满足工作条件
      const fallback = this.nextSlot(undefined, TimeSystem.addMinutes(aligned, 15), true); // 查找下一个可执行时间
      return fallback ?? aligned; // 如果找到则返回，否则保持对齐时间
    } // 条件结束
    return aligned; // 返回对齐后的时间
  } // 方法结束
} // 类结束
