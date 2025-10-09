import Phaser from 'phaser'; // 引入Phaser框架
// 分隔注释 // 保持行有注释
interface PopupEntry { text: Phaser.GameObjects.Text; life: number; velocity: number; } // 定义飘字条目
// 分隔注释 // 保持行有注释
export class PopupManager { // 定义飘字管理器
  private scene: Phaser.Scene; // 保存场景引用
  private entries: PopupEntry[]; // 保存飘字数组
  // 分隔注释 // 保持行有注释
  public constructor(scene: Phaser.Scene) { // 构造函数
    this.scene = scene; // 保存场景
    this.entries = []; // 初始化数组
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public popup(worldX: number, worldY: number, text: string, color = '#ffffff'): void { // 产生飘字
    const label = this.scene.add.text(worldX, worldY, text, { fontFamily: 'sans-serif', fontSize: '12px', color, stroke: '#000000', strokeThickness: 2 }); // 创建文字对象
    label.setOrigin(0.5, 1); // 设置锚点
    label.setDepth(1100); // 提升层级
    this.entries.push({ text: label, life: 1000, velocity: 40 }); // 将飘字加入数组
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public update(delta: number): void { // 更新飘字动画
    const remain: PopupEntry[] = []; // 初始化剩余数组
    this.entries.forEach((entry) => { // 遍历飘字
      const progress = delta; // 记录本帧增量
      entry.life -= progress; // 减少寿命
      entry.text.y -= (entry.velocity * progress) / 1000; // 向上移动
      entry.text.alpha = Math.max(0, entry.life / 1000); // 根据寿命调整透明度
      if (entry.life > 0) { // 如果仍然存活
        remain.push(entry); // 保留条目
      } else { // 否则
        entry.text.destroy(); // 销毁文字
      } // 条件结束
    }); // 遍历结束
    this.entries = remain; // 更新数组
  } // 方法结束
} // 类结束
