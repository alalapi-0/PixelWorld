import Phaser from 'phaser'; // 引入 Phaser 场景基类
import { AgentAPI } from '../build/AgentAPI'; // 引入 AgentAPI 以便推送任务
import { WorkCalendar } from '../time/WorkCalendar'; // 引入工作日历
import { SchedulerIO } from '../config/SchedulerIO'; // 引入排程存储
import { GanttLayout } from './GanttLayout'; // 引入布局计算
import { GanttRender } from './GanttRender'; // 引入渲染器
import { GanttInteraction } from './GanttInteraction'; // 引入交互控制器
import { GanttDataBridge } from './GanttDataBridge'; // 引入数据桥
import { SchedulerToolbar } from '../ui/tools/SchedulerToolbar'; // 引入工具栏
import { HotReloadBus } from '../runtime/HotReloadBus'; // 引入热重载总线

export default class GanttScene extends Phaser.Scene { // 定义甘特场景
  private io!: SchedulerIO; // 存储排程 IO
  private layout!: GanttLayout; // 存储布局计算器
  private renderLayer!: GanttRender; // 存储渲染器
  private interaction!: GanttInteraction; // 存储交互控制器
  private bridge!: GanttDataBridge; // 存储数据桥
  private toolbar!: SchedulerToolbar; // 存储工具栏控制
  private calendar!: WorkCalendar; // 存储工作日历

  public constructor() { // 构造函数
    super('Gantt'); // 指定场景键名
  } // 构造结束

  public create(): void { // 场景创建入口
    this.io = new SchedulerIO(); // 初始化排程 IO
    this.renderLayer = new GanttRender(this); // 创建渲染器
    void this.bootstrap(); // 异步加载排程
  } // 方法结束

  private async bootstrap(): Promise<void> { // 异步初始化逻辑
    const scheduler = await this.io.load(); // 读取排程文件
    this.layout = new GanttLayout(scheduler, { viewportWidth: this.scale.width, viewportHeight: this.scale.height, zoom: 1 }); // 创建布局
    this.renderLayer.draw(this.layout.compute()); // 绘制初始视图
    this.calendar = new WorkCalendar({}); // 创建工作日历
    this.interaction = new GanttInteraction(scheduler, this.layout, this.calendar, this.io); // 创建交互控制器
    this.bridge = new GanttDataBridge(new AgentAPI(), this.io); // 创建数据桥
    this.bridge.setScheduler(scheduler); // 注入排程数据
    this.toolbar = new SchedulerToolbar(this.io, this.bridge, this.interaction); // 创建工具栏控制
    this.registerShortcuts(); // 注册快捷键
    HotReloadBus.on('rulesChanged', () => this.handlePolicyRefresh()); // 监听规则变更事件
    HotReloadBus.on('schedulerChanged', () => void this.reloadScheduler()); // 监听排程文件变更
  } // 方法结束

  private registerShortcuts(): void { // 注册键盘快捷键
    const keyboard = this.input.keyboard; // 获取键盘输入
    if (!keyboard) { // 如果不存在
      return; // 直接返回
    } // 条件结束
    keyboard.on('keydown-S', (event: KeyboardEvent) => { // 监听 S 键
      if (event.ctrlKey) { // 若按下 Ctrl
        event.preventDefault(); // 阻止默认行为
        void this.toolbar.triggerSave(); // 调用保存
      } // 条件结束
    }); // 监听结束
    keyboard.on('keydown-D', (event: KeyboardEvent) => { // 监听 D 键
      if (event.ctrlKey) { // 若按下 Ctrl
        event.preventDefault(); // 阻止默认
        this.interaction.duplicateSelected(); // 调用复制
      } // 条件结束
    }); // 监听结束
    keyboard.on('keydown-DELETE', () => { // 监听 Delete 键
      this.interaction.selectTask(null); // 清除选中
    }); // 监听结束
  } // 方法结束

  private handlePolicyRefresh(): void { // 处理策略文件刷新
    const hint = this.add.text(12, 12, '规则已更新，检查排程', { fontSize: '14px', color: '#ffcc00' }); // 显示提示
    this.time.delayedCall(2000, () => hint.destroy()); // 两秒后移除提示
  } // 方法结束

  private async reloadScheduler(): Promise<void> { // 重新加载排程文件
    const scheduler = await this.io.load(); // 读取最新排程
    this.layout = new GanttLayout(scheduler, { viewportWidth: this.scale.width, viewportHeight: this.scale.height, zoom: 1 }); // 重建布局
    this.bridge.setScheduler(scheduler); // 更新数据桥
    this.interaction = new GanttInteraction(scheduler, this.layout, this.calendar, this.io); // 重建交互控制器
    this.renderLayer.draw(this.layout.compute()); // 重新绘制
  } // 方法结束
} // 类结束
