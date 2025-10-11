import Phaser from 'phaser'; // 引入Phaser框架
import { PlayerEntity } from './PlayerEntity'; // 引入玩家实体类

export class PlayerController { // 定义玩家控制器类
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys; // 键盘方向键引用
  private speed = 80; // 玩家基础移动速度

  public constructor(private scene: Phaser.Scene, private player: PlayerEntity) { // 构造函数保存场景与实体
    this.cursors = scene.input.keyboard?.createCursorKeys() ?? scene.input.keyboard!.createCursorKeys(); // 创建方向键映射
  } // 构造函数结束

  public update(delta: number): void { // 每帧更新方法
    const container = this.player.getContainer(); // 获取玩家容器
    const velocity = new Phaser.Math.Vector2(0, 0); // 创建速度向量
    if (this.cursors.left?.isDown) { // 检查左方向键
      velocity.x -= 1; // 减少X方向
    } // 条件结束
    if (this.cursors.right?.isDown) { // 检查右方向键
      velocity.x += 1; // 增加X方向
    } // 条件结束
    if (this.cursors.up?.isDown) { // 检查上方向键
      velocity.y -= 1; // 减少Y方向
    } // 条件结束
    if (this.cursors.down?.isDown) { // 检查下方向键
      velocity.y += 1; // 增加Y方向
    } // 条件结束
    if (velocity.lengthSq() > 0) { // 如果存在输入
      velocity.normalize(); // 归一化速度
      const distance = (this.speed * delta) / 1000; // 计算本帧位移
      container.x += velocity.x * distance; // 更新X坐标
      container.y += velocity.y * distance; // 更新Y坐标
    } // 条件结束
  } // 方法结束
} // 类结束
