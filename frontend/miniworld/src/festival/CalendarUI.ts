// 引入管理器
import { FestivalManager } from "./FestivalManager"; // 节日管理器
// 日历界面类
export class CalendarUI { // 文本月历
  constructor(private manager: FestivalManager) {} // 保存管理器
  renderMonth(season: string, days: number): string[] { // 渲染整月
    const lines: string[] = []; // 准备文本
    for (let day = 1; day <= days; day++) { // 遍历日期
      const info = this.manager.getFestivalForDate(season, day); // 查询节日
      const mark = info ? "[*]" : "   "; // 标记节日
      lines.push(`${season}-${String(day).padStart(2, "0")} ${mark}`); // 拼接文本
    } // 结束循环
    return lines; // 返回结果
  } // 结束方法
} // 结束类
