import { GANTT_STYLES, GanttStyles } from './GanttStyles'; // 引入样式常量便于换算

export type SchedulerTimeScale = 'minutes' | 'hours'; // 定义排程支持的时间刻度

export interface SchedulerRow { // 声明排程行的结构
  id: string; // 行的唯一标识
  label: string; // 行的显示标签
} // 结束接口定义

export interface SchedulerTask { // 声明排程任务的结构
  id: string; // 任务唯一标识
  type: string; // 任务类型
  title: string; // 任务标题
  rowId: string; // 所属行
  start: string; // 开始时间（ISO 字符串）
  durationMin?: number; // 分钟持续时间
  durationHr?: number; // 小时持续时间
  deadline?: string; // 截止时间
  dependsOn?: string[]; // 依赖列表
  payload?: Record<string, unknown>; // 任务附加数据
  flags?: string[]; // 状态标记
  status?: string; // 当前状态
  progress?: number; // 执行进度
} // 结束接口定义

export interface SchedulerData { // 定义排程文件整体结构
  version: number; // 版本号
  timeScale: SchedulerTimeScale; // 时间刻度
  startAt: string; // 时间轴起始点
  rows: SchedulerRow[]; // 所有资源行
  tasks: SchedulerTask[]; // 所有任务
} // 结束接口定义

export interface LayoutTask { // 描述渲染时需要的任务几何信息
  task: SchedulerTask; // 原始任务对象
  x: number; // 起始 x 坐标
  y: number; // 起始 y 坐标
  width: number; // 宽度（像素）
  height: number; // 高度（像素）
  rowIndex: number; // 所属行索引
} // 结束接口定义

export interface LayoutTick { // 描述时间刻度
  x: number; // 刻度线的 x 坐标
  label: string; // 显示标签
  major: boolean; // 是否为主刻度
} // 结束接口定义

export interface LayoutResult { // 描述一次布局计算后的集合
  tasks: LayoutTask[]; // 所有任务的布局信息
  ticks: LayoutTick[]; // 时间刻度集合
  rowPositions: Map<string, number>; // 行到 y 坐标的映射
} // 结束接口定义

export interface GanttLayoutOptions { // 布局配置项
  viewportWidth: number; // 视口宽度
  viewportHeight: number; // 视口高度
  zoom: number; // 缩放倍数
} // 结束接口定义

export class GanttLayout { // 定义甘特布局核心类
  private scheduler: SchedulerData; // 保存当前排程数据
  private styles: GanttStyles; // 保存样式常量
  private options: GanttLayoutOptions; // 保存视口与缩放配置
  private startAt: Date; // 计算时的起始时间
  private pixelsPerMinute: number; // 每分钟对应的像素

  public constructor(scheduler: SchedulerData, options?: Partial<GanttLayoutOptions>, styles: GanttStyles = GANTT_STYLES) { // 构造函数
    this.scheduler = scheduler; // 存储排程数据
    this.styles = styles; // 存储样式配置
    this.startAt = new Date(scheduler.startAt); // 解析起始时间
    this.options = { viewportWidth: options?.viewportWidth ?? 1280, viewportHeight: options?.viewportHeight ?? 720, zoom: options?.zoom ?? 1 }; // 合并默认选项
    this.pixelsPerMinute = this.computePixelsPerMinute(scheduler.timeScale); // 计算缩放后的每分钟像素
  } // 结束构造

  private computePixelsPerMinute(scale: SchedulerTimeScale): number { // 内部方法：根据刻度计算像素比例
    const base = 2; // 定义基础像素密度
    if (scale === 'hours') { // 若以小时为刻度
      return base * this.options.zoom / 60; // 小时时间需要除以 60 得到每分钟像素
    } // 条件结束
    return base * this.options.zoom; // 默认分钟刻度直接乘缩放
  } // 方法结束

  public updateOptions(next: Partial<GanttLayoutOptions>): void { // 更新布局参数
    this.options = { ...this.options, ...next }; // 合并新的配置
    this.pixelsPerMinute = this.computePixelsPerMinute(this.scheduler.timeScale); // 重新计算缩放比例
  } // 方法结束

  public timeToX(time: string | Date): number { // 将时间转换成 x 坐标
    const date = typeof time === 'string' ? new Date(time) : time; // 确保得到 Date 对象
    const minutes = (date.getTime() - this.startAt.getTime()) / 60000; // 计算相对分钟差
    return minutes * this.pixelsPerMinute; // 按比例转换为像素
  } // 方法结束

  public xToTime(x: number): Date { // 将 x 坐标转换回时间
    const minutes = x / this.pixelsPerMinute; // 计算分钟差
    return new Date(this.startAt.getTime() + minutes * 60000); // 叠加到起始时间得到日期
  } // 方法结束

  public rowToY(rowId: string): number { // 根据行标识计算 y 坐标
    const index = this.scheduler.rows.findIndex((row) => row.id === rowId); // 寻找行索引
    if (index === -1) { // 如果找不到行
      throw new Error(`Unknown rowId: ${rowId}`); // 抛出错误提示
    } // 条件结束
    const rowHeight = this.styles.rowHeight + this.styles.rowGap; // 计算单行占据的高度
    return this.styles.timelineHeight + index * rowHeight; // 返回时间轴下方的 y 坐标
  } // 方法结束

  public compute(): LayoutResult { // 主方法：执行布局计算
    const rowPositions = new Map<string, number>(); // 准备行到 y 坐标的映射
    this.scheduler.rows.forEach((row) => { // 遍历行
      rowPositions.set(row.id, this.rowToY(row.id)); // 为每行记录 y 坐标
    }); // 结束遍历

    const tasks: LayoutTask[] = this.scheduler.tasks.map((task) => { // 遍历任务并生成布局对象
      const rowIndex = this.scheduler.rows.findIndex((row) => row.id === task.rowId); // 查找任务所属行索引
      const x = this.timeToX(task.start); // 计算起始 x
      const durationMinutes = this.extractDuration(task); // 抽取任务持续时间
      const width = Math.max(durationMinutes * this.pixelsPerMinute, this.styles.taskBarHeight); // 计算任务条宽度并做最小值限制
      const y = rowPositions.get(task.rowId) ?? this.styles.timelineHeight; // 读取行的 y 坐标
      return { task, x, y, width, height: this.styles.taskBarHeight, rowIndex }; // 返回布局结果
    }); // 结束映射

    const ticks = this.computeTicks(); // 计算时间刻度

    return { tasks, ticks, rowPositions }; // 返回整体布局
  } // 方法结束

  private extractDuration(task: SchedulerTask): number { // 内部方法：提取任务持续时间
    if (this.scheduler.timeScale === 'hours') { // 如果排程使用小时刻度
      const hours = task.durationHr ?? (task.durationMin ? task.durationMin / 60 : 1); // 优先使用小时字段
      return hours * 60; // 转换为分钟
    } // 条件结束
    return task.durationMin ?? (task.durationHr ? task.durationHr * 60 : 30); // 默认以分钟字段为主
  } // 方法结束

  private computeTicks(): LayoutTick[] { // 内部方法：计算时间刻度集合
    const ticks: LayoutTick[] = []; // 初始化数组
    const totalWidth = Math.max(this.options.viewportWidth, this.scheduler.tasks.reduce((max, task) => { // 计算任务覆盖的最大宽度
      const endX = this.timeToX(task.start) + this.extractDuration(task) * this.pixelsPerMinute; // 计算任务结束的 x 坐标
      return Math.max(max, endX); // 更新最大值
    }, 0)); // reduce 结束

    const majorGap = this.styles.tickMajor; // 读取主刻度间隔
    for (let x = 0; x <= totalWidth + majorGap; x += this.styles.tickMinor) { // 以小刻度遍历到末尾
      const time = this.xToTime(x); // 将坐标转换为时间
      const label = this.formatTickLabel(time); // 生成标签
      const major = x % majorGap === 0; // 判断是否为主刻度
      ticks.push({ x, label, major }); // 存入刻度数组
    } // 循环结束
    return ticks; // 返回刻度集合
  } // 方法结束

  private formatTickLabel(time: Date): string { // 内部方法：格式化刻度标签
    if (this.scheduler.timeScale === 'hours') { // 若以小时刻度显示
      return time.toISOString().slice(11, 16); // 只取小时与分钟
    } // 条件结束
    return time.toISOString().slice(11, 16); // 分钟刻度同样取时分
  } // 方法结束

  public detectOverlap(rowId: string, taskId: string): boolean { // 检测同一行任务是否重叠
    const target = this.scheduler.tasks.find((task) => task.id === taskId); // 查找目标任务
    if (!target) { // 如果未找到
      return false; // 返回不重叠
    } // 条件结束
    const targetStart = this.timeToX(target.start); // 目标任务起点 x
    const targetEnd = targetStart + this.extractDuration(target) * this.pixelsPerMinute; // 目标任务结束 x
    return this.scheduler.tasks.some((task) => { // 遍历所有任务
      if (task.id === target.id || task.rowId !== rowId) { // 跳过自身或不同的行
        return false; // 不构成重叠
      } // 条件结束
      const start = this.timeToX(task.start); // 计算其他任务起点
      const end = start + this.extractDuration(task) * this.pixelsPerMinute; // 计算其他任务终点
      return !(end <= targetStart || start >= targetEnd); // 判断时间区间是否相交
    }); // 结束遍历
  } // 方法结束
} // 类结束
