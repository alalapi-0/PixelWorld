import Phaser from 'phaser'; // 引入Phaser框架
// 分隔注释 // 保持行有注释
export class UIVisibilityManager { // 定义UI可见性管理器
  private scene: Phaser.Scene; // 保存场景引用
  private target: Phaser.GameObjects.Container | Phaser.GameObjects.Layer | null = null; // 保存需要控制的容器
  private hidden = false; // 记录当前是否隐藏
  // 分隔注释 // 保持行有注释
  public constructor(scene: Phaser.Scene) { // 构造函数
    this.scene = scene; // 保存场景
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public setAutoAttach(container: Phaser.GameObjects.Container | Phaser.GameObjects.Layer): void { // 注册需要控制的容器
    this.target = container; // 保存容器
    this.target.setAlpha(this.hidden ? 0 : 1); // 根据状态设置透明度
    this.target.setVisible(!this.hidden); // 根据状态设置可见性
    this.target.setActive(!this.hidden); // 根据状态设置活动性
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public hideAll(durationMs = 240): void { // 渐隐隐藏所有UI
    if (!this.target || this.hidden) { // 如果没有容器或已经隐藏
      return; // 不进行操作
    } // 条件结束
    const container = this.target; // 缓存容器
    this.scene.tweens.killTweensOf(container); // 停止旧补间
    container.setVisible(true); // 确保可见以执行动画
    container.setActive(true); // 确保容器处于活动
    this.hidden = true; // 标记隐藏状态
    this.scene.tweens.add({ // 创建补间
      targets: container, // 指定目标
      alpha: 0, // 渐隐到0
      duration: durationMs, // 动画时长
      onComplete: () => { // 动画完成回调
        container.setVisible(false); // 彻底隐藏
        container.setActive(false); // 停止响应
      }, // 回调结束
    }); // 补间结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public showAll(durationMs = 240): void { // 渐显显示所有UI
    if (!this.target || !this.hidden) { // 如果没有容器或已经显示
      return; // 不进行操作
    } // 条件结束
    const container = this.target; // 缓存容器
    this.scene.tweens.killTweensOf(container); // 停止旧补间
    container.setVisible(true); // 确保可见
    container.setActive(true); // 确保可以响应
    container.setAlpha(0); // 重置透明度
    this.hidden = false; // 标记显示状态
    this.scene.tweens.add({ // 创建补间
      targets: container, // 指定目标
      alpha: 1, // 渐显到1
      duration: durationMs, // 动画时长
    }); // 补间结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public toggle(): void { // 切换显示状态
    if (this.hidden) { // 如果当前隐藏
      this.showAll(); // 调用显示
    } else { // 否则
      this.hideAll(); // 调用隐藏
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public isHidden(): boolean { // 查询当前是否隐藏
    return this.hidden; // 返回隐藏状态
  } // 方法结束
} // 类结束
