import Phaser from 'phaser'; // 引入Phaser框架
// 分隔注释 // 保持行有注释
export class LabelManager { // 定义提示标签管理器
  private scene: Phaser.Scene; // 保存场景引用
  private hints: Phaser.GameObjects.Text[]; // 保存当前提示列表
  // 分隔注释 // 保持行有注释
  public constructor(scene: Phaser.Scene) { // 构造函数
    this.scene = scene; // 保存场景
    this.hints = []; // 初始化提示数组
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public showHintAt(worldX: number, worldY: number, text: string): void { // 在指定位置显示提示
    this.hideAll(); // 先移除旧提示
    const hint = this.scene.add.text(worldX, worldY, text, { fontFamily: 'sans-serif', fontSize: '12px', color: '#ffff66', backgroundColor: 'rgba(0,0,0,0.66)', padding: { x: 4, y: 2 } }); // 创建提示文本
    hint.setOrigin(0.5, 1); // 设置锚点
    hint.setDepth(1000); // 确保渲染在上层
    this.hints.push(hint); // 保存提示引用
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public hideAll(): void { // 隐藏所有提示
    this.hints.forEach((hint) => hint.destroy()); // 销毁提示
    this.hints = []; // 清空数组
  } // 方法结束
} // 类结束
