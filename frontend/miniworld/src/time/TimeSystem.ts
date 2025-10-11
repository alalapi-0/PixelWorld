import { TimeWindow } from '../agents/CommandTypes'; // 引入命令时间窗类型
// 空行用于分隔
export type ClockMinutes = number; // 声明时钟分钟数类型
// 空行用于分隔
export interface TimeSnapshot { clockMinutes: ClockMinutes; date: Date; } // 声明时间快照结构
// 空行用于分隔
export type TimeNowProvider = () => Date; // 声明当前时间提供器类型
// 空行用于分隔
export class TimeSystem { // 定义时间系统工具类
  public static readonly MINUTES_PER_DAY = 24 * 60; // 每日分钟常量
  private nowProvider: TimeNowProvider; // 保存时间提供器
  public constructor(provider?: TimeNowProvider) { // 构造函数允许注入时间提供器
    this.nowProvider = provider ?? (() => new Date()); // 默认使用系统时间
  } // 构造结束
  public now(): Date { // 获取当前时间
    return this.nowProvider(); // 调用提供器
  } // 方法结束
  public snapshot(): TimeSnapshot { // 生成时间快照
    const date = this.now(); // 获取当前时间
    return { date, clockMinutes: TimeSystem.extractClockMinutes(date) }; // 返回快照
  } // 方法结束
  public static extractClockMinutes(date: Date): ClockMinutes { // 从日期提取分钟
    return date.getHours() * 60 + date.getMinutes(); // 计算分钟数
  } // 方法结束
  public static parseClock(text: string | undefined): ClockMinutes | null { // 解析时刻字符串
    if (!text) { // 如果为空
      return null; // 返回空
    } // 条件结束
    const match = text.trim().match(/^(\d{1,2}):(\d{2})$/); // 匹配HH:MM
    if (!match) { // 如果未匹配
      return null; // 返回空
    } // 条件结束
    const hours = Number(match[1]); // 解析小时
    const minutes = Number(match[2]); // 解析分钟
    if (hours >= 24 || minutes >= 60) { // 校验范围
      return null; // 返回空
    } // 条件结束
    return hours * 60 + minutes; // 返回分钟值
  } // 方法结束
  public static formatClock(value: ClockMinutes): string { // 格式化分钟为HH:MM
    const normalized = ((value % TimeSystem.MINUTES_PER_DAY) + TimeSystem.MINUTES_PER_DAY) % TimeSystem.MINUTES_PER_DAY; // 归一化
    const hours = Math.floor(normalized / 60); // 计算小时
    const minutes = normalized % 60; // 计算分钟
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`; // 返回格式化文本
  } // 方法结束
  public static addMinutes(date: Date, minutes: number): Date { // 日期加分钟
    return new Date(date.getTime() + minutes * 60 * 1000); // 返回新日期
  } // 方法结束
  public static addDays(date: Date, days: number): Date { // 日期加天数
    return TimeSystem.addMinutes(date, days * TimeSystem.MINUTES_PER_DAY); // 复用分钟加法
  } // 方法结束
  public static isWithinWindow(window: TimeWindow | undefined, date: Date): boolean { // 判断是否在时间窗内
    if (!window) { // 如果未提供窗口
      return true; // 默认允许
    } // 条件结束
    const current = TimeSystem.extractClockMinutes(date); // 获取当前分钟
    const start = TimeSystem.parseClock(window.start); // 解析起点
    const end = TimeSystem.parseClock(window.end); // 解析终点
    if (start === null && end === null) { // 若两端均无
      return true; // 默认允许
    } // 条件结束
    if (start !== null && end !== null) { // 若两端存在
      if (start <= end) { // 如果未跨日
        return current >= start && current <= end; // 简单区间判断
      } // 条件结束
      return current >= start || current <= end; // 跨日情况
    } // 条件结束
    if (start !== null) { // 只有起点
      return current >= start; // 判断是否晚于起点
    } // 条件结束
    if (end !== null) { // 只有终点
      return current <= end; // 判断是否早于终点
    } // 条件结束
    return true; // 兜底允许
  } // 方法结束
} // 类结束
