import Phaser from 'phaser'; // 引入Phaser框架
// 分隔注释 // 保持行有注释
export class TimeScaleBoost { // 定义快进控制类
  private scene: Phaser.Scene; // 保存场景引用
  private scales = [1, 2, 4]; // 定义倍率序列
  private index = 0; // 当前倍率索引
  private iconText?: Phaser.GameObjects.Text; // HUD图标文本引用
  // 分隔注释 // 保持行有注释
  public constructor(scene: Phaser.Scene) { // 构造函数
    this.scene = scene; // 保存场景引用
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public toggle(): void { // 切换倍率
    this.index = (this.index + 1) % this.scales.length; // 循环递增索引
    this.updateIcon(); // 更新显示
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getScale(): number { // 获取当前倍率
    return this.scales[this.index]; // 返回对应倍率
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public drawSmallIcon(container: Phaser.GameObjects.Container): void { // 在HUD容器绘制图标
    const text = this.scene.add.text(-8, -8, this.formatLabel(), { fontFamily: 'sans-serif', fontSize: '14px', color: '#ffff88', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 4, y: 2 } }); // 创建文本
    text.setOrigin(1, 1); // 设置锚点
    container.add(text); // 添加到容器
    this.iconText = text; // 保存引用
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private formatLabel(): string { // 生成倍率标签
    return `x${this.getScale()}`; // 返回格式化字符串
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private updateIcon(): void { // 更新图标文本
    if (this.iconText) { // 如果存在文本
      this.iconText.setText(this.formatLabel()); // 更新文字
    } // 条件结束
  } // 方法结束
} // 类结束
