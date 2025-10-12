// 引入节日管理器
import { FestivalManager } from "../festival/FestivalManager"; // 节日管理器
// 定义布告数据
export interface NoticeBoardContext { // 布告上下文
  season: string; // 当前季节
  day: number; // 当前日期
  weatherForecast: string[]; // 天气预报
} // 结束接口
// 布告栏类
export class NoticeBoard { // 文本布告栏
  constructor(private festivalManager: FestivalManager) {} // 保存管理器
  render(context: NoticeBoardContext): string[] { // 生成布告文本
    const lines: string[] = []; // 准备数组
    lines.push(`今日：${context.season}-${String(context.day).padStart(2, "0")}`); // 今日日期
    lines.push("天气预报：" + context.weatherForecast.join("，")); // 天气列表
    const upcoming = this.festivalManager.getUpcomingFestivals(context.season, context.day); // 查询即将到来节日
    if (upcoming.length === 0) { // 若无节日
      lines.push("近期暂无节日活动"); // 提示
    } else { // 有节日
      upcoming.slice(0, 2).forEach(item => { // 只显示前两个
        lines.push(`节日预告：${item.definition.name} 距离还有 ${item.daysUntil} 天`); // 追加行
      }); // 结束遍历
    } // 结束条件
    return lines; // 返回文本
  } // 结束方法
} // 结束类
