import Phaser from 'phaser'; // 引入Phaser框架
import { SaveManager } from '../save/SaveManager'; // 引入存档管理器

export class PlayerEntity { // 定义玩家实体类
  private container: Phaser.GameObjects.Container; // 存放玩家容器引用
  private sprite: Phaser.GameObjects.Sprite; // 存放玩家精灵引用

  public constructor(private scene: Phaser.Scene, texture: string, startX: number, startY: number) { // 构造函数同时保存场景与初始参数
    this.container = scene.add.container(startX, startY); // 创建容器并定位
    this.sprite = scene.add.sprite(0, 0, texture); // 创建精灵
    this.sprite.setOrigin(0.5, 1); // 设置锚点到底部
    this.container.add(this.sprite); // 将精灵加入容器
    this.container.setDepth(900); // 设置默认深度
  } // 构造函数结束

  public getContainer(): Phaser.GameObjects.Container { // 获取容器方法
    return this.container; // 返回容器引用
  } // 方法结束

  public setPosition(x: number, y: number): void { // 设置位置方法
    this.container.setPosition(x, y); // 更新容器位置
    SaveManager.updatePlayerPosition(x, y); // 同步存档位置
  } // 方法结束

  public playAnimation(key: string): void { // 播放动画方法
    this.sprite.play({ key, repeat: -1 }, true); // 播放循环动画
  } // 方法结束
} // 类结束
