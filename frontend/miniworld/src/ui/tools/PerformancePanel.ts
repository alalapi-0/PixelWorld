import { AchievementRules } from '../../achievements/AchievementRules'; // 引入成就规则
// 空行用于分隔
export type PerformanceSource = () => Record<string, number>; // 声明绩效数据提供器
// 空行用于分隔
export interface PerformanceSummary { // 声明绩效汇总结构
  on_time: number; // 按时数量
  overtime: number; // 超时数量
  night_shift: number; // 夜间数量
  silent: number; // 静音数量
  total: number; // 总任务
} // 接口结束
// 空行用于分隔
export class PerformancePanel { // 定义绩效面板
  private source: PerformanceSource; // 绩效数据源
  private achievements: AchievementRules; // 成就规则引用
  public constructor(source: PerformanceSource, achievements: AchievementRules) { // 构造函数
    this.source = source; // 保存数据源
    this.achievements = achievements; // 保存成就规则
  } // 构造结束
  public summary(): PerformanceSummary { // 生成绩效汇总
    const data = this.source(); // 读取数据
    const onTime = data['on_time'] ?? 0; // 获取按时数
    const overtime = data['overtime'] ?? 0; // 获取超时数
    const night = data['night_shift'] ?? 0; // 获取夜间数
    const silent = data['silent'] ?? 0; // 获取静音数
    const total = Object.values(data).reduce((sum, value) => sum + value, 0); // 计算总数
    return { on_time: onTime, overtime, night_shift: night, silent, total }; // 返回汇总
  } // 方法结束
  public achievementProgress(): ReturnType<AchievementRules['getProgress']> { // 返回成就进度
    return this.achievements.getProgress(); // 直接透传
  } // 方法结束
} // 类结束
