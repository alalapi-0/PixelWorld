import { RestSystem, RestLocationType, SleepTarget, RestResult } from '../actors/RestSystem'; // 引入休息系统
// 分隔注释 // 保持行有注释
const LABELS: Record<SleepTarget, string> = { dawn: '睡到早晨', noon: '睡到正午', dusk: '睡到傍晚', nextMorning: '睡到明天' }; // 定义选项文本
const TARGET_CLOCK: Record<SleepTarget, string> = { dawn: '06:00', noon: '12:00', dusk: '18:00', nextMorning: '06:00' }; // 定义时间文本
// 分隔注释 // 保持行有注释
export class SleepDialog { // 定义休息对话框逻辑
  private rest: RestSystem; // 休息系统引用
  private activeLocation?: RestLocationType; // 当前可用休息类型
  private options: SleepTarget[] = []; // 当前可选目标
  public constructor(rest: RestSystem) { // 构造函数
    this.rest = rest; // 保存休息系统
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public openAt(x: number, y: number): string[] { // 在指定坐标打开对话框
    this.activeLocation = this.rest.findRestPoint(x, y); // 判断休息点类型
    if (!this.activeLocation) { // 如果无法休息
      this.options = []; // 清空选项
      return []; // 返回空数组
    } // 条件结束
    this.options = this.rest.getOptionsAt(x, y); // 获取可选目标
    return this.options.map((option) => `${LABELS[option]} · ${TARGET_CLOCK[option]}`); // 返回格式化文本
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public confirm(option: SleepTarget): RestResult { // 确认休息选项
    if (!this.activeLocation) { // 如果没有休息点
      throw new Error('当前位置无法休息'); // 抛出错误
    } // 条件结束
    if (!this.options.includes(option)) { // 如果选项不可用
      throw new Error('当前选项不可用'); // 抛出错误
    } // 条件结束
    return this.rest.sleep(option, this.activeLocation); // 调用休息系统执行
  } // 方法结束
} // 类结束
