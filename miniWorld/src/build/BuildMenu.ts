import Phaser from 'phaser'; // 引入Phaser用于界面组件
import { Inventory } from '../systems/Inventory'; // 引入背包系统
import { Blueprints, Blueprint } from './Blueprints'; // 引入蓝图管理器
// 分隔注释 // 保持行有注释
export class BuildMenu extends Phaser.GameObjects.Container { // 定义建造菜单类
  private blueprints: Blueprints; // 保存蓝图引用
  private inventory: Inventory; // 保存背包引用
  private active = false; // 标记是否处于建造模式
  private index = 0; // 当前蓝图索引
  private panel: Phaser.GameObjects.Rectangle; // 背景面板
  private titleText: Phaser.GameObjects.Text; // 蓝图名称文本
  private costTexts: Phaser.GameObjects.Text[] = []; // 材料文本数组
  private statusText: Phaser.GameObjects.Text; // 状态提示文本
  private instructionText: Phaser.GameObjects.Text; // 操作提示文本
  private keyHandler?: (event: KeyboardEvent) => void; // 键盘事件处理器
  private wheelHandler?: (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[], deltaX: number, deltaY: number) => void; // 滚轮处理器
  public constructor(scene: Phaser.Scene, blueprints: Blueprints, inventory: Inventory) { // 构造函数
    super(scene, 12, 12); // 调用父类并设置初始位置
    this.blueprints = blueprints; // 保存蓝图引用
    this.inventory = inventory; // 保存背包引用
    this.setScrollFactor(0); // 固定在屏幕位置
    this.setDepth(1400); // 设置渲染深度
    this.panel = scene.add.rectangle(0, 0, 220, 160, 0x334455, 0.8); // 创建背景面板
    this.panel.setOrigin(0, 0); // 设置面板锚点
    this.add(this.panel); // 将面板加入容器
    this.titleText = scene.add.text(8, 8, '蓝图', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffffff' }); // 创建标题文本
    this.add(this.titleText); // 加入容器
    this.statusText = scene.add.text(8, 36, '', { fontFamily: 'sans-serif', fontSize: '12px', color: '#ff6666' }); // 创建状态文本
    this.add(this.statusText); // 加入容器
    this.instructionText = scene.add.text(8, 140, 'U 退出 / 滚轮切换 / 数字选择 / Z 放置 / 右键拆除', { fontFamily: 'sans-serif', fontSize: '12px', color: '#ddf0ff' }); // 创建操作提示
    this.instructionText.setOrigin(0, 1); // 设置提示锚点
    this.add(this.instructionText); // 加入容器
    this.setVisible(false); // 初始隐藏
    scene.add.existing(this); // 将容器添加到场景
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public enter(): void { // 进入建造模式
    if (this.active) { // 若已激活
      return; // 直接返回
    } // 条件结束
    this.active = true; // 标记为激活
    this.setVisible(true); // 显示界面
    this.refreshCostTexts(); // 刷新材料列表
    this.keyHandler = (event: KeyboardEvent) => this.handleKey(event); // 定义键盘处理器
    this.scene.input.keyboard?.on('keydown', this.keyHandler); // 监听键盘
    this.wheelHandler = (_pointer, _objects, _dx, dy) => { // 定义滚轮处理器
      if (dy > 0) { // 如果向下滚动
        this.next(); // 切换到下一个
      } else if (dy < 0) { // 如果向上滚动
        this.prev(); // 切换到上一个
      } // 条件结束
    }; // 处理器结束
    this.scene.input.on('wheel', this.wheelHandler); // 注册滚轮事件
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public exit(): void { // 退出建造模式
    if (!this.active) { // 如果未激活
      return; // 直接返回
    } // 条件结束
    this.active = false; // 更新状态
    this.setVisible(false); // 隐藏界面
    if (this.keyHandler) { // 如果存在键盘处理器
      this.scene.input.keyboard?.off('keydown', this.keyHandler); // 移除监听
      this.keyHandler = undefined; // 清空引用
    } // 条件结束
    if (this.wheelHandler) { // 如果存在滚轮处理器
      this.scene.input.off('wheel', this.wheelHandler); // 移除监听
      this.wheelHandler = undefined; // 清空引用
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public currentBlueprint(): Blueprint { // 获取当前蓝图
    const list = this.blueprints.all(); // 获取蓝图列表
    if (list.length === 0) { // 如果列表为空
      throw new Error('No blueprint available'); // 抛出异常提醒
    } // 条件结束
    const idx = Phaser.Math.Clamp(this.index, 0, list.length - 1); // 计算安全索引
    return list[idx]; // 返回蓝图
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public selectIndex(i: number): void { // 根据索引选择蓝图
    const list = this.blueprints.all(); // 获取列表
    if (list.length === 0) { // 如果无蓝图
      return; // 直接返回
    } // 条件结束
    const clamped = Phaser.Math.Wrap(i, 0, list.length); // 包裹索引
    this.index = clamped; // 更新索引
    this.refreshCostTexts(); // 刷新显示
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public next(): void { // 切换到下一个蓝图
    this.selectIndex(this.index + 1); // 使用索引方法
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public prev(): void { // 切换到上一个蓝图
    this.selectIndex(this.index - 1); // 使用索引方法
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public isActive(): boolean { // 查询是否激活
    return this.active; // 返回状态
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public refresh(): void { // 提供外部刷新接口
    this.refreshCostTexts(); // 调用内部刷新
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public setStatus(message: string): void { // 更新状态文本
    this.statusText.setText(message); // 设置文本
    this.statusText.setColor(message ? '#ff8888' : '#88ff88'); // 根据是否有文本调整颜色
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private handleKey(event: KeyboardEvent): void { // 键盘事件处理
    if (!this.active) { // 如果未激活
      return; // 忽略输入
    } // 条件结束
    if (event.code.startsWith('Digit')) { // 若按下数字键
      const digit = Number.parseInt(event.code.replace('Digit', ''), 10); // 解析数字
      if (!Number.isNaN(digit) && digit > 0) { // 判断有效
        this.selectIndex(digit - 1); // 切换到对应蓝图
      } // 条件结束
    } else if (event.code === 'ArrowRight') { // 右箭头
      this.next(); // 下一个蓝图
    } else if (event.code === 'ArrowLeft') { // 左箭头
      this.prev(); // 上一个蓝图
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private refreshCostTexts(): void { // 刷新材料显示
    const list = this.blueprints.all(); // 获取蓝图列表
    this.costTexts.forEach((text) => text.destroy()); // 销毁旧文本
    this.costTexts = []; // 清空数组
    if (list.length === 0) { // 如果没有蓝图
      this.titleText.setText('无蓝图'); // 更新标题
      return; // 直接返回
    } // 条件结束
    const blueprint = this.currentBlueprint(); // 获取当前蓝图
    this.titleText.setText(`当前：${blueprint.name}`); // 更新标题
    blueprint.cost.forEach((cost, idx) => { // 遍历材料
      const enough = this.inventory.has(cost.id, cost.count); // 判断材料是否足够
      const text = this.scene.add.text(8, 60 + idx * 18, `${cost.name} x${cost.count}`, { fontFamily: 'sans-serif', fontSize: '12px', color: enough ? '#88ff88' : '#ff6666' }); // 创建材料文本
      this.add(text); // 加入容器
      this.costTexts.push(text); // 存储引用
    }); // 遍历结束
    if (blueprint.cost.length === 0) { // 如果无材料
      const text = this.scene.add.text(8, 60, '无需材料', { fontFamily: 'sans-serif', fontSize: '12px', color: '#88ff88' }); // 创建提示
      this.add(text); // 添加
      this.costTexts.push(text); // 记录
    } // 条件结束
    this.setStatus(''); // 清空状态
  } // 方法结束
} // 类结束
