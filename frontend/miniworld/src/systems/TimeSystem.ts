import Phaser from 'phaser'; // 引入Phaser框架
// 分隔注释 // 保持行有注释
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'; // 定义季节类型
// 分隔注释 // 保持行有注释
export interface TimeState { // 定义时间状态接口
  minute: number; // 当前分钟
  hour: number; // 当前小时
  day: number; // 当前日序号
  weekDay: number; // 当前星期索引
  season: Season; // 当前季节
  year: number; // 当前年份
} // 接口结束
// 分隔注释 // 保持行有注释
const MINUTES_PER_REAL_SECOND = 10; // 定义默认换算比例
const MINUTES_PER_MS = MINUTES_PER_REAL_SECOND / 1000; // 计算每毫秒对应分钟
const HOURS_PER_DAY = 24; // 一天小时数
const DAYS_PER_SEASON = 30; // 每季天数
const WEEK_LENGTH = 7; // 每周天数
const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']; // 季节顺序
// 分隔注释 // 保持行有注释
export class TimeSystem { // 定义时间系统类
  private scene: Phaser.Scene; // 保存场景引用
  private state: TimeState; // 当前时间状态
  private fractionMinutes = 0; // 累计的小数分钟
  private overlay?: Phaser.GameObjects.Rectangle; // 昼夜叠层引用
  private dayCallbacks: Array<(t: TimeState) => void> = []; // 新的一天回调列表
  private weekCallbacks: Array<(t: TimeState) => void> = []; // 新的一周回调列表
  private seasonCallbacks: Array<(t: TimeState) => void> = []; // 新的一季回调列表
  // 分隔注释 // 保持行有注释
  public constructor(scene: Phaser.Scene) { // 构造函数
    this.scene = scene; // 保存场景引用
    this.state = { minute: 0, hour: 6, day: 1, weekDay: 0, season: 'spring', year: 1 }; // 初始化时间
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public update(deltaMs: number, speedScale: number): void { // 更新时间流逝
    const scaledMinutes = deltaMs * speedScale * MINUTES_PER_MS; // 根据倍率换算分钟
    this.fractionMinutes += scaledMinutes; // 累加小数分钟
    while (this.fractionMinutes >= 1) { // 当累计分钟达到1
      this.fractionMinutes -= 1; // 消耗一分钟
      this.advanceMinute(); // 推进一分钟
    } // 循环结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private advanceMinute(): void { // 推进一分钟的内部逻辑
    this.state.minute += 1; // 分钟加一
    if (this.state.minute >= 60) { // 如果达到60分钟
      this.state.minute = 0; // 重置分钟
      this.advanceHour(); // 推进小时
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private advanceHour(): void { // 推进一小时的内部逻辑
    this.state.hour += 1; // 小时加一
    if (this.state.hour >= HOURS_PER_DAY) { // 如果达到一天
      this.state.hour = 0; // 重置小时
      this.advanceDay(); // 推进天数
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private advanceDay(): void { // 推进一天的内部逻辑
    this.state.day += 1; // 天数加一
    const previousWeekDay = this.state.weekDay; // 记录上一天的星期
    this.state.weekDay = (this.state.weekDay + 1) % WEEK_LENGTH; // 推进星期
    let newSeasonStarted = false; // 标记是否进入新季节
    if (this.state.day > DAYS_PER_SEASON) { // 如果超过季节天数
      this.state.day = 1; // 重置日序号
      newSeasonStarted = true; // 标记新季节
      const seasonIndex = SEASONS.indexOf(this.state.season); // 获取当前季节索引
      const nextIndex = (seasonIndex + 1) % SEASONS.length; // 计算下一个索引
      if (nextIndex === 0) { // 如果回到春季
        this.state.year += 1; // 年份加一
      } // 条件结束
      this.state.season = SEASONS[nextIndex]; // 切换季节
    } // 条件结束
    const snapshot = { ...this.state }; // 克隆当前状态
    this.dayCallbacks.forEach((cb) => cb(snapshot)); // 触发新日回调
    if (this.state.weekDay === 0 && previousWeekDay !== 0) { // 如果周索引回到0
      this.weekCallbacks.forEach((cb) => cb({ ...this.state })); // 触发新周回调
    } // 条件结束
    if (newSeasonStarted) { // 如果进入新季节
      this.seasonCallbacks.forEach((cb) => cb({ ...this.state })); // 触发新季节回调
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getState(): TimeState { // 获取当前时间状态
    return { ...this.state }; // 返回克隆
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public onNewDay(cb: (t: TimeState) => void): void { // 注册新的一天回调
    this.dayCallbacks.push(cb); // 添加到列表
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public onNewWeek(cb: (t: TimeState) => void): void { // 注册新的一周回调
    this.weekCallbacks.push(cb); // 添加到列表
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public onNewSeason(cb: (t: TimeState) => void): void { // 注册新的一季回调
    this.seasonCallbacks.push(cb); // 添加到列表
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private ensureOverlay(scene: Phaser.Scene): Phaser.GameObjects.Rectangle { // 确保昼夜叠层存在
    if (!this.overlay) { // 如果尚未创建
      const rect = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 0); // 创建矩形叠层
      rect.setOrigin(0, 0); // 设置原点
      rect.setScrollFactor(0); // 固定在屏幕
      rect.setDepth(1400); // 提升渲染深度
      this.overlay = rect; // 保存引用
    } // 条件结束
    return this.overlay; // 返回叠层
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public applyTintTo(scene: Phaser.Scene): void { // 根据时间应用昼夜色调
    const overlay = this.ensureOverlay(scene); // 获取叠层
    let color = 0x000000; // 初始化颜色
    let alpha = 0; // 初始化透明度
    const hour = this.state.hour; // 读取当前小时
    if (hour >= 22 || hour < 5) { // 深夜时段
      color = 0x000033; // 设置深蓝
      alpha = 0.55; // 设置透明度
    } else if (hour >= 18) { // 傍晚时段
      color = 0x331100; // 设置暮色
      alpha = 0.35; // 设置透明度
    } else if (hour >= 5 && hour < 6) { // 清晨渐亮
      color = 0x111133; // 设置淡蓝
      alpha = 0.2; // 设置透明度
    } else { // 白天
      alpha = 0; // 无叠层
    } // 条件结束
    overlay.setFillStyle(color, alpha); // 更新叠层样式
    overlay.setSize(scene.scale.width, scene.scale.height); // 更新尺寸以适配窗口
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public serialize(): { state: TimeState; fraction: number } { // 序列化当前时间
    return { state: { ...this.state }, fraction: this.fractionMinutes }; // 返回包含状态和小数部分的数据
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public restore(json: { state?: TimeState; fraction?: number } | undefined): void { // 从存档恢复时间
    if (!json?.state) { // 如果没有提供状态
      return; // 不做处理
    } // 条件结束
    this.state = { ...json.state }; // 恢复状态
    this.fractionMinutes = json.fraction ?? 0; // 恢复小数部分
  } // 方法结束
} // 类结束
