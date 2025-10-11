import Phaser from 'phaser'; // 引入Phaser框架

const TITLE_TEXT = 'PixelWorld 原型'; // 定义标题文本常量
const PROMPT_TEXT = '按任意键继续'; // 定义提示文本常量

export default class TitleScene extends Phaser.Scene { // 定义标题场景类
  private promptText?: Phaser.GameObjects.Text; // 存放提示文本引用
  private logoText?: Phaser.GameObjects.Text; // 存放LOGO文本引用

  public constructor() { // 构造函数
    super('TitleScene'); // 调用父类构造并设置场景键名
  } // 构造函数结束

  public create(): void { // 创建生命周期
    const centerX = this.scale.width / 2; // 计算画面中心X
    const centerY = this.scale.height / 2; // 计算画面中心Y
    this.logoText = this.add.text(centerX, centerY - 32, TITLE_TEXT, { fontFamily: 'sans-serif', fontSize: '32px', color: '#ffffff' }); // 创建LOGO文本
    this.logoText.setOrigin(0.5, 0.5); // 设置LOGO文本居中
    this.promptText = this.add.text(centerX, centerY + 32, PROMPT_TEXT, { fontFamily: 'sans-serif', fontSize: '16px', color: '#dddddd' }); // 创建提示文本
    this.promptText.setOrigin(0.5, 0.5); // 设置提示文本居中
    this.input.keyboard?.on('keydown', () => this.goToMenu()); // 监听按键进入菜单
    this.input.once('pointerdown', () => this.goToMenu()); // 监听鼠标点击进入菜单
  } // 创建生命周期结束

  private goToMenu(): void { // 跳转主菜单的私有方法
    if (this.scene.isActive('MainMenuScene')) { // 检查主菜单是否已激活
      return; // 如果已激活则直接返回
    } // 条件语句结束
    this.scene.start('MainMenuScene'); // 切换到主菜单场景
  } // 方法结束
} // 类结束
