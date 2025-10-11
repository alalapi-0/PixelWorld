import Phaser from 'phaser'; // 引入Phaser框架
import { SaveManager, type CharacterDefinition } from '../save/SaveManager'; // 引入存档管理器与类型

export default class CharacterSelectScene extends Phaser.Scene { // 定义角色选择场景类
  private characters: CharacterDefinition[] = []; // 存储角色列表
  private cardWidth = 120; // 角色卡片宽度
  private cardHeight = 140; // 角色卡片高度

  public constructor() { // 构造函数
    super('CharacterSelectScene'); // 调用父类构造并设置场景键名
  } // 构造函数结束

  public async create(): Promise<void> { // 创建生命周期
    const title = this.add.text(this.scale.width / 2, 32, '选择角色', { fontFamily: 'sans-serif', fontSize: '22px', color: '#ffffff' }); // 创建标题文本
    title.setOrigin(0.5, 0.5); // 设置标题居中
    this.characters = await SaveManager.loadCharacters(this.load); // 加载角色配置
    this.renderCards(); // 调用渲染角色卡片方法
  } // 创建生命周期结束

  private renderCards(): void { // 渲染角色卡片方法
    const total = this.characters.length; // 获取角色数量
    if (total === 0) { // 如果没有角色
      const text = this.add.text(this.scale.width / 2, this.scale.height / 2, '没有可用角色', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffaaaa' }); // 创建提示文本
      text.setOrigin(0.5, 0.5); // 居中提示文本
      return; // 结束方法
    } // 条件结束
    const gap = 16; // 定义卡片间隔
    const totalWidth = total * this.cardWidth + (total - 1) * gap; // 计算总宽度
    let startX = (this.scale.width - totalWidth) / 2 + this.cardWidth / 2; // 计算起始X
    const centerY = this.scale.height / 2; // 计算中心Y
    this.characters.forEach((character) => { // 遍历角色列表
      const container = this.add.container(startX, centerY); // 创建容器
      const bg = this.add.rectangle(0, 0, this.cardWidth, this.cardHeight, 0x222222, 0.9); // 创建背景矩形
      bg.setStrokeStyle(2, 0xffffff, 0.8); // 设置描边
      const nameText = this.add.text(0, -this.cardHeight / 2 + 16, character.name, { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffffff' }); // 创建名字文本
      nameText.setOrigin(0.5, 0.5); // 居中文本
      const avatarText = this.add.text(0, 0, character.avatar.replace('images:', ''), { fontFamily: 'sans-serif', fontSize: '12px', color: '#cccccc', wordWrap: { width: this.cardWidth - 16 } }); // 使用文本展示头像信息
      avatarText.setOrigin(0.5, 0.5); // 居中头像信息
      const startPosText = this.add.text(0, this.cardHeight / 2 - 32, `出生(${character.startPos.x},${character.startPos.y})`, { fontFamily: 'sans-serif', fontSize: '12px', color: '#88ffaa' }); // 创建出生坐标文本
      startPosText.setOrigin(0.5, 0.5); // 居中文本
      container.add([bg, nameText, avatarText, startPosText]); // 将元素加入容器
      container.setSize(this.cardWidth, this.cardHeight); // 设置容器尺寸
      container.setInteractive(new Phaser.Geom.Rectangle(-this.cardWidth / 2, -this.cardHeight / 2, this.cardWidth, this.cardHeight), Phaser.Geom.Rectangle.Contains); // 启用容器交互
      container.on('pointerdown', () => void this.handleSelect(character)); // 点击时调用选择处理
      startX += this.cardWidth + gap; // 更新下一个卡片位置
    }); // 遍历结束
  } // 方法结束

  private async handleSelect(character: CharacterDefinition): Promise<void> { // 处理角色选择方法
    await SaveManager.createNewSave(character.id); // 创建角色存档
    this.scene.start('WorldScene'); // 切换到世界场景
  } // 方法结束
} // 类结束
