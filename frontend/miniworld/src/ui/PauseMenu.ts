import Phaser from 'phaser'; // 引入Phaser框架

export class PauseMenu { // 定义暂停菜单类
  private container: Phaser.GameObjects.Container; // 保存容器引用
  private visible = false; // 标记是否显示

  public constructor(private scene: Phaser.Scene) { // 构造函数保存场景
    const width = 200; // 定义菜单宽度
    const height = 160; // 定义菜单高度
    this.container = scene.add.container(scene.scale.width / 2 - width / 2, scene.scale.height / 2 - height / 2); // 创建容器
    const bg = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8); // 创建背景矩形
    bg.setStrokeStyle(2, 0xffffff, 0.8); // 设置边框
    this.container.add(bg); // 添加背景
    const title = scene.add.text(width / 2, 24, '暂停菜单', { fontFamily: 'sans-serif', fontSize: '18px', color: '#ffffff' }); // 创建标题
    title.setOrigin(0.5, 0.5); // 标题居中
    this.container.add(title); // 添加标题
    this.addButton(width / 2, 64, '继续游戏', () => this.toggle(false)); // 添加继续按钮
    this.addButton(width / 2, 96, '保存进度', () => scene.game.events.emit('pause:save')); // 添加保存按钮
    this.addButton(width / 2, 128, '返回主菜单', () => scene.game.events.emit('pause:returnMenu')); // 添加回主菜单按钮
    this.container.setVisible(this.visible); // 根据标记设置可见性
  } // 构造函数结束

  private addButton(x: number, y: number, label: string, handler: () => void): void { // 工具方法创建按钮
    const button = this.scene.add.text(x, y, label, { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffeeaa', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 8, y: 4 } }); // 创建文本按钮
    button.setOrigin(0.5, 0.5); // 设置居中
    button.setInteractive({ useHandCursor: true }); // 启用交互
    button.on('pointerdown', handler); // 绑定事件
    this.container.add(button); // 加入容器
  } // 方法结束

  public toggle(force?: boolean): void { // 切换显示方法
    if (typeof force === 'boolean') { // 如果提供布尔参数
      this.visible = force; // 使用传入值
    } else { // 否则
      this.visible = !this.visible; // 直接切换
    } // 条件结束
    this.container.setVisible(this.visible); // 更新可见性
  } // 方法结束
} // 类结束
