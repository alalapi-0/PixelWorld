import Phaser from 'phaser'; // 引入Phaser框架
import { AutoTextController } from '../ui/AutoTextController'; // 引入自动文本控制器
import { UIVisibilityManager } from '../ui/UIVisibilityManager'; // 引入UI显隐管理器
import { TimeState } from '../systems/TimeSystem'; // 引入时间状态类型
import { TimeScaleBoost } from '../systems/TimeScaleBoost'; // 引入快进系统
import type { Role } from '../build/Permissions'; // 引入角色类型
// 分隔注释 // 保持行有注释
export default class UIScene extends Phaser.Scene { // 定义UI场景
  private autoController!: AutoTextController; // 自动文本控制器引用
  private visibility!: UIVisibilityManager; // UI显隐管理器引用
  private root!: Phaser.GameObjects.Container; // UI根容器
  private timeContainer!: Phaser.GameObjects.Container; // 时间显示容器
  private timeText!: Phaser.GameObjects.Text; // 时间文本
  private speedContainer!: Phaser.GameObjects.Container; // 倍速容器
  private seasonContainer!: Phaser.GameObjects.Container; // 季节容器
  private seasonText!: Phaser.GameObjects.Text; // 季节文本
  private buildInfoText!: Phaser.GameObjects.Text; // 建造状态文本
  private permissionText!: Phaser.GameObjects.Text; // 权限文本
  private agentInfoText!: Phaser.GameObjects.Text; // 审批队列文本
  // 分隔注释 // 保持行有注释
  public constructor() { // 构造函数
    super('UIScene'); // 指定场景键名
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public create(): void { // 场景创建时执行
    this.root = this.add.container(0, 0); // 创建容器
    this.root.setScrollFactor(0); // 固定在屏幕
    this.root.setDepth(1500); // 提升深度
    this.root.setPosition(this.scale.width, this.scale.height); // 放置在右下角
    this.timeContainer = this.add.container(this.scale.width - 12, 12); // 创建时间容器
    this.timeContainer.setScrollFactor(0); // 固定时间容器
    this.timeContainer.setDepth(1500); // 提升时间层级
    this.timeText = this.add.text(0, 0, '06:00', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffffaa', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 4, y: 2 } }); // 创建时间文本
    this.timeText.setOrigin(1, 0); // 设置时间文本锚点
    this.timeContainer.add(this.timeText); // 添加时间文本
    this.speedContainer = this.add.container(0, 24); // 创建倍率容器
    this.timeContainer.add(this.speedContainer); // 添加倍率容器
    this.seasonContainer = this.add.container(12, 12); // 创建季节容器
    this.seasonContainer.setScrollFactor(0); // 固定季节容器
    this.seasonContainer.setDepth(1500); // 提升季节层级
    this.seasonText = this.add.text(0, 0, '春季 第1日', { fontFamily: 'sans-serif', fontSize: '14px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 4, y: 2 } }); // 创建季节文本
    this.seasonText.setOrigin(0, 0); // 设置季节文本锚点
    this.seasonContainer.add(this.seasonText); // 添加季节文本
    this.buildInfoText = this.add.text(8, 48, '建造：未激活', { fontFamily: 'sans-serif', fontSize: '12px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 4, y: 2 } }); // 创建建造信息文本
    this.buildInfoText.setScrollFactor(0); // 固定建造文本位置
    this.buildInfoText.setDepth(1500); // 设置建造文本深度
    this.permissionText = this.add.text(8, 66, '角色：Visitor', { fontFamily: 'sans-serif', fontSize: '12px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 4, y: 2 } }); // 创建权限文本
    this.permissionText.setScrollFactor(0); // 固定权限文本
    this.permissionText.setDepth(1500); // 设置权限文本深度
    this.agentInfoText = this.add.text(8, 84, '待审批：0', { fontFamily: 'sans-serif', fontSize: '12px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 4, y: 2 } }); // 创建审批文本
    this.agentInfoText.setScrollFactor(0); // 固定审批文本
    this.agentInfoText.setDepth(1500); // 设置审批文本深度
    this.autoController = new AutoTextController(this); // 创建自动控制器
    this.autoController.drawSmallIcons(this.root); // 绘制图标
    this.visibility = new UIVisibilityManager(this); // 创建显隐管理器
    this.visibility.setAutoAttach(this.root); // 绑定容器
    this.setupInputs(); // 配置输入
    this.events.emit('ui-ready', this); // 通知外部UI准备完成
  } // 方法结束
  // 分隔注释 // 保持行有注释
  // 分隔注释 // 保持行有注释
  public attachTimeScale(boost: TimeScaleBoost): void { // 附加快进倍率图标
    boost.drawSmallIcon(this.speedContainer); // 调用倍率绘制
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public updateTimeDisplay(state: TimeState, _scale: number): void { // 更新时间显示
    const hour = state.hour.toString().padStart(2, '0'); // 计算小时文本
    const minute = state.minute.toString().padStart(2, '0'); // 计算分钟文本
    this.timeText.setText(`${hour}:${minute}`); // 更新时间文本
    const seasonNames: Record<TimeState['season'], string> = { spring: '春季', summer: '夏季', autumn: '秋季', winter: '冬季' }; // 季节名称映射
    const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']; // 星期名称
    const seasonLabel = seasonNames[state.season]; // 获取季节名称
    const weekLabel = weekNames[state.weekDay] ?? '周?'; // 获取星期标签
    this.seasonText.setText(`第${state.year}年 ${seasonLabel} 第${state.day}日 ${weekLabel}`); // 更新季节文本
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public updateBuildStatus(active: boolean, blueprintName: string): void { // 更新建造状态显示
    this.buildInfoText.setText(active ? `建造：${blueprintName}` : '建造：未激活'); // 更新建造文本
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public updatePermissionRole(role: Role): void { // 更新权限显示
    this.permissionText.setText(`角色：${role}`); // 更新权限文本
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public updateAgentQueue(count: number): void { // 更新审批队列显示
    this.agentInfoText.setText(`待审批：${count}`); // 更新审批文本
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private setupInputs(): void { // 配置输入事件
    this.input.mouse?.disableContextMenu(); // 禁用浏览器右键菜单
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => { // 监听指针按下
      if (pointer.rightButtonDown()) { // 如果右键按下
        this.visibility.toggle(); // 切换显隐
      } // 条件结束
    }); // 监听结束
    const hideKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.H); // 绑定H键
    hideKey?.on('down', (event: KeyboardEvent) => { // 按下时触发
      if (event.shiftKey) { // 如果按下Shift
        this.visibility.toggle(); // 切换显隐
      } // 条件结束
    }); // 监听结束
    const autoKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A); // 绑定A键
    autoKey?.on('down', () => { // 按下时触发
      if (this.autoController.isAuto()) { // 如果已开启自动
        this.autoController.disableAuto(); // 关闭自动
      } else { // 否则
        this.autoController.disableSkip(); // 关闭跳过
        this.autoController.enableAuto(); // 开启自动
      } // 条件结束
    }); // 监听结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getAutoCtrl(): AutoTextController { // 返回自动控制器
    return this.autoController; // 返回引用
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getUIVisibility(): UIVisibilityManager { // 返回显隐管理器
    return this.visibility; // 返回引用
  } // 方法结束
} // 类结束
