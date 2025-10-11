import { SchedulerIO } from '../../config/SchedulerIO'; // 引入排程存储
import { GanttDataBridge } from '../../scheduler/GanttDataBridge'; // 引入数据桥
import { GanttInteraction } from '../../scheduler/GanttInteraction'; // 引入交互控制器

export interface SchedulerToolbarEvents { // 定义工具栏事件映射
  save: void; // 保存事件
  rollback: void; // 回滚事件
  validate: void; // 校验事件
  send: void; // 送审事件
} // 接口结束

export class SchedulerToolbar { // 定义工具栏控制类
  private listeners: Map<keyof SchedulerToolbarEvents, Set<() => void>> = new Map(); // 存储事件监听器
  private io: SchedulerIO; // 存储 IO 工具
  private bridge: GanttDataBridge; // 存储数据桥
  private interaction: GanttInteraction; // 存储交互控制器

  public constructor(io: SchedulerIO, bridge: GanttDataBridge, interaction: GanttInteraction) { // 构造函数
    this.io = io; // 保存 IO 工具
    this.bridge = bridge; // 保存数据桥
    this.interaction = interaction; // 保存交互控制器
  } // 构造结束

  public on<K extends keyof SchedulerToolbarEvents>(event: K, listener: () => void): void { // 注册事件回调
    const bucket = this.listeners.get(event) ?? new Set(); // 获取或创建监听集合
    bucket.add(listener); // 添加监听函数
    this.listeners.set(event, bucket); // 回写集合
  } // 方法结束

  public async triggerSave(): Promise<void> { // 触发保存动作
    await this.interaction.save(); // 调用交互层保存
    this.emit('save'); // 广播事件
  } // 方法结束

  public async triggerRollback(args: string[] = ['--latest']): Promise<void> { // 触发回滚动作
    await this.io.runRollback(args); // 调用 IO 执行回滚
    this.emit('rollback'); // 广播事件
  } // 方法结束

  public async triggerValidate(): Promise<void> { // 触发校验动作
    await this.io.runValidate(); // 调用 IO 校验
    this.emit('validate'); // 广播事件
  } // 方法结束

  public async triggerSend(): Promise<void> { // 触发送审动作
    await this.bridge.sendForApproval(); // 调用数据桥推送任务
    this.emit('send'); // 广播事件
  } // 方法结束

  private emit(event: keyof SchedulerToolbarEvents): void { // 内部广播工具
    const bucket = this.listeners.get(event); // 获取监听集合
    bucket?.forEach((listener) => listener()); // 遍历执行
  } // 方法结束
} // 类结束
