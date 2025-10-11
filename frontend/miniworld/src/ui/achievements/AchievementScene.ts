import Phaser from 'phaser'; // 引入Phaser框架
import { AchievementManager } from './AchievementManager'; // 引入成就管理器
// 分隔注释 // 保持行有注释
interface SceneData { manager: AchievementManager; } // 定义初始化数据结构
// 分隔注释 // 保持行有注释
export default class AchievementScene extends Phaser.Scene { // 定义成就列表场景
  private manager?: AchievementManager; // 保存成就管理器引用
  private items: Phaser.GameObjects.Text[] = []; // 保存文本对象
  // 分隔注释 // 保持行有注释
  public constructor() { // 构造函数
    super('AchievementScene'); // 指定场景键
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public init(data: SceneData): void { // 初始化阶段获取数据
    this.manager = data.manager; // 保存成就管理器
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public create(): void { // 场景创建时调用
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0.6)'); // 设置背景色
    const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.6); // 创建半透明遮罩
    overlay.setOrigin(0, 0); // 设置原点
    overlay.setScrollFactor(0); // 固定位置
    overlay.setDepth(10); // 设置深度
    this.setupEscKey(); // 配置退出键
    this.renderList(); // 渲染成就列表
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private setupEscKey(): void { // 配置Esc退出
    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC); // 绑定按键
    escKey?.on('down', () => { // 按下时触发
      this.scene.stop(); // 停止当前场景
      this.scene.resume('WorldScene'); // 恢复世界场景
    }); // 监听结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private renderList(): void { // 渲染成就列表
    this.items.forEach((text) => text.destroy()); // 清理旧文本
    this.items = []; // 重置数组
    if (!this.manager) { // 如果缺少管理器
      return; // 不继续
    } // 条件结束
    const all = this.manager.all(); // 获取成就列表
    const startX = 60; // 文本起始X
    const startY = 60; // 文本起始Y
    const blockHeight = 48; // 每项高度
    all.forEach((entry, index) => { // 遍历成就
      const status = entry.unlocked ? '已解锁' : '未解锁'; // 计算状态文本
      const color = entry.unlocked ? '#a0ffa0' : '#cccccc'; // 根据状态选择颜色
      const content = `${entry.name} - ${status}\n${entry.desc}`; // 拼接显示文本
      const label = this.add.text(startX, startY + index * blockHeight, content, { fontFamily: 'sans-serif', fontSize: '14px', color, wordWrap: { width: 360 } }); // 创建文本
      this.items.push(label); // 保存引用
    }); // 遍历结束
  } // 方法结束
} // 类结束
