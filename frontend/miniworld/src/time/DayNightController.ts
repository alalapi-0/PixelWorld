import type { TimeState } from '../systems/TimeSystem'; // 引入时间状态类型
// 分隔注释 // 保持行有注释
export class DayNightController { // 定义昼夜控制器
  public getLightFactor(time: Pick<TimeState, 'hour' | 'minute'>): number { // 计算亮度因子
    const minutes = time.hour * 60 + time.minute; // 将时间转换为分钟
    const normalized = minutes / (24 * 60); // 归一化到0-1
    const angle = (normalized - 0.25) * Math.PI * 2; // 以清晨为起点转换角度
    const value = 0.5 - 0.5 * Math.cos(angle); // 使用余弦曲线模拟亮度
    return Math.min(1, Math.max(0, Number(value.toFixed(3)))); // 保持在0-1并保留三位小数
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getPhaseLabel(time: Pick<TimeState, 'hour'>): string { // 根据小时返回昼夜文本
    const hour = time.hour; // 读取小时
    if (hour >= 22 || hour < 5) { // 深夜
      return '深夜'; // 返回标签
    } // 条件结束
    if (hour >= 18) { // 傍晚
      return '傍晚'; // 返回标签
    } // 条件结束
    if (hour >= 12) { // 下午
      return '下午'; // 返回标签
    } // 条件结束
    if (hour >= 6) { // 上午
      return '上午'; // 返回标签
    } // 条件结束
    return '清晨'; // 默认返回清晨
  } // 方法结束
} // 类结束
