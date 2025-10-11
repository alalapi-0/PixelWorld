import Phaser from 'phaser'; // 引入Phaser框架

interface MenuButtonConfig { // 定义菜单按钮配置接口
  label: string; // 按钮文字
  action: () => void; // 点击动作
} // 接口结束

export default class MainMenuScene extends Phaser.Scene { // 定义主菜单场景类
  private buttonSpacing = 48; // 定义按钮间距
  private buttons: Phaser.GameObjects.Text[] = []; // 存放按钮文本数组

  public constructor() { // 构造函数
    super('MainMenuScene'); // 调用父类构造并指定场景键名
  } // 构造函数结束

  public create(): void { // 创建生命周期
    const centerX = this.scale.width / 2; // 计算画面中心X
    const centerY = this.scale.height / 2; // 计算画面中心Y
    const configs: MenuButtonConfig[] = [ // 定义菜单按钮配置数组
      { label: '开始游戏', action: () => this.startGame() }, // 配置开始游戏按钮
      { label: '设置', action: () => this.openSettings() }, // 配置设置按钮
      { label: '退出', action: () => this.quitGame() }, // 配置退出按钮
    ]; // 数组结束
    configs.forEach((config, index) => { // 遍历配置数组
      const button = this.add.text(centerX, centerY + index * this.buttonSpacing, config.label, { fontFamily: 'sans-serif', fontSize: '18px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 12, y: 6 } }); // 创建按钮文本
      button.setOrigin(0.5, 0.5); // 设置文本居中
      button.setInteractive({ useHandCursor: true }); // 启用交互与手型光标
      button.on('pointerover', () => button.setStyle({ color: '#ffee88' })); // 悬停时改变颜色
      button.on('pointerout', () => button.setStyle({ color: '#ffffff' })); // 离开时恢复颜色
      button.on('pointerdown', config.action); // 点击时执行对应动作
      this.buttons.push(button); // 存储按钮引用
    }); // 遍历结束
  } // 创建生命周期结束

  private startGame(): void { // 点击开始游戏时执行
    this.scene.start('CharacterSelectScene'); // 切换到角色选择场景
  } // 方法结束

  private openSettings(): void { // 点击设置时执行
    const popup = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 220, 140, 0x000000, 0.7); // 创建设置背景矩形
    popup.setStrokeStyle(2, 0xffffff, 0.8); // 设置描边
    const text = this.add.text(popup.x, popup.y, '设置占位\n音量：100%\n分辨率：320x320', { fontFamily: 'sans-serif', fontSize: '14px', color: '#ffffff', align: 'center' }); // 创建设置说明文本
    text.setOrigin(0.5, 0.5); // 居中文本
    this.time.delayedCall(1800, () => { popup.destroy(); text.destroy(); }); // 延迟销毁弹窗
  } // 方法结束

  private quitGame(): void { // 点击退出时执行
    if (window && typeof window.close === 'function') { // 检查window.close方法
      window.close(); // 调用window.close尝试关闭窗口
    } // 条件结束
  } // 方法结束
} // 类结束
