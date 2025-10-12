import type { WeatherSnapshot, WeatherState } from '../time/WeatherSystem'; // 引入天气类型
import { DayNightController } from '../time/DayNightController'; // 引入昼夜控制器
import type { TimeState } from '../systems/TimeSystem'; // 引入时间状态类型
// 分隔注释 // 保持行有注释
const ICONS: Record<WeatherState, string> = { clear: '☀', cloudy: '☁', rain: '☔', storm: '⚡', snow: '❄' }; // 定义天气图标
// 分隔注释 // 保持行有注释
export class WeatherWidget { // 定义天气显示组件
  private snapshot: WeatherSnapshot = { state: 'clear', remainHours: 6 }; // 当前天气快照
  private time: TimeState = { minute: 0, hour: 6, day: 1, weekDay: 0, season: 'spring', year: 1 }; // 当前时间
  private daylight: DayNightController; // 昼夜控制器
  public constructor(daylight: DayNightController) { // 构造函数
    this.daylight = daylight; // 保存昼夜控制器
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public updateWeather(snapshot: WeatherSnapshot): void { // 更新天气快照
    this.snapshot = snapshot; // 保存最新天气
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public updateTime(time: TimeState): void { // 更新时间
    this.time = time; // 保存最新时间
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public render(): string { // 生成显示文本
    const icon = ICONS[this.snapshot.state]; // 获取天气图标
    const clock = `${this.time.hour.toString().padStart(2, '0')}:${this.time.minute.toString().padStart(2, '0')}`; // 生成时间文本
    const light = this.daylight.getLightFactor({ hour: this.time.hour, minute: this.time.minute }); // 计算亮度
    return `${icon} ${this.snapshot.state} · Day ${this.time.day} · ${clock} · light=${light}`; // 返回组合文本
  } // 方法结束
} // 类结束
