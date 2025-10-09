import Phaser from 'phaser'; // 引入Phaser框架
import { AutoTextController } from '../ui/AutoTextController'; // 引入自动文本控制器
import { UIVisibilityManager } from '../ui/UIVisibilityManager'; // 引入UI显隐管理器
// 分隔注释 // 保持行有注释
export default class UIScene extends Phaser.Scene { // 定义UI场景
  private autoController!: AutoTextController; // 自动文本控制器引用
  private visibility!: UIVisibilityManager; // UI显隐管理器引用
  private root!: Phaser.GameObjects.Container; // UI根容器
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
    this.autoController = new AutoTextController(this); // 创建自动控制器
    this.autoController.drawSmallIcons(this.root); // 绘制图标
    this.visibility = new UIVisibilityManager(this); // 创建显隐管理器
    this.visibility.setAutoAttach(this.root); // 绑定容器
    this.setupInputs(); // 配置输入
    this.events.emit('ui-ready', this); // 通知外部UI准备完成
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
