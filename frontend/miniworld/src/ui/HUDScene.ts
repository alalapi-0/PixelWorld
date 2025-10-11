import Phaser from 'phaser'; // 引入Phaser框架
import { SaveManager } from '../save/SaveManager'; // 引入存档管理器

export default class HUDScene extends Phaser.Scene { // 定义HUD场景类
  private timeText!: Phaser.GameObjects.Text; // 保存时间文本引用
  private avatarText!: Phaser.GameObjects.Text; // 保存头像文本引用

  public constructor() { // 构造函数
    super('HUDScene'); // 调用父类构造并指定场景键名
  } // 构造结束

  public create(): void { // 创建生命周期
    this.timeText = this.add.text(12, 8, '时间：--:--', { fontFamily: 'sans-serif', fontSize: '14px', color: '#ffffff' }); // 创建时间文本
    this.timeText.setDepth(2000); // 设置深度
    const save = SaveManager.loadLatestSave(); // 读取当前存档
    const avatarLabel = save ? save.player.id : '未选择'; // 获取角色ID
    this.avatarText = this.add.text(12, 28, `角色：${avatarLabel}`, { fontFamily: 'sans-serif', fontSize: '14px', color: '#ffee88' }); // 创建角色文本
    this.avatarText.setDepth(2000); // 设置深度
    const inventoryButton = this.add.text(this.scale.width - 60, 12, '背包(I)', { fontFamily: 'sans-serif', fontSize: '12px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.4)', padding: { x: 6, y: 4 } }); // 创建背包按钮
    inventoryButton.setOrigin(0.5, 0); // 设置按钮原点
    inventoryButton.setInteractive({ useHandCursor: true }); // 启用交互
    inventoryButton.on('pointerdown', () => this.game.events.emit('hud:toggleInventory')); // 点击时发送事件
    const buildButton = this.add.text(this.scale.width - 60, 36, '建造(U)', { fontFamily: 'sans-serif', fontSize: '12px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.4)', padding: { x: 6, y: 4 } }); // 创建建造按钮
    buildButton.setOrigin(0.5, 0); // 设置原点
    buildButton.setInteractive({ useHandCursor: true }); // 启用交互
    buildButton.on('pointerdown', () => this.game.events.emit('hud:enterBuild')); // 点击发送建造事件
    this.input.keyboard?.on('keydown-I', () => this.game.events.emit('hud:toggleInventory')); // 监听I键
    this.input.keyboard?.on('keydown-U', () => this.game.events.emit('hud:enterBuild')); // 监听U键
    this.input.keyboard?.on('keydown-ESC', () => this.game.events.emit('hud:openPause')); // 监听ESC键
    this.game.events.on('time:update', (label: string) => this.updateTime(label)); // 监听时间事件
  } // 创建生命周期结束

  private updateTime(label: string): void { // 更新时间显示方法
    this.timeText.setText(`时间：${label}`); // 更新文本内容
  } // 方法结束
} // 类结束
