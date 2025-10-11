// 模块：提供简易文本框组件用于显示提示信息
import * as PIXI from "https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.4.0/pixi.min.mjs"; // 导入 PIXI 库

export class MessageBox { // 定义消息框类
  constructor(app, options = {}) { // 构造函数接收应用与可选参数
    this.app = app; // 保存应用引用
    this.width = options.width || app.renderer.width; // 设置文本框宽度
    this.duration = options.duration || 1500; // 设置默认显示时长
    this.container = new PIXI.Container(); // 创建容器
    this.background = new PIXI.Graphics(); // 创建背景图形
    this.text = new PIXI.Text("", { fill: 0xffffff, fontSize: 18, stroke: 0x000000, strokeThickness: 4, wordWrap: true, wordWrapWidth: this.width - 40 }); // 创建文本对象
    this.text.position.set(20, 12); // 设置文本位置
    this.background.beginFill(0x000000, 0.6); // 设置背景颜色
    this.background.drawRoundedRect(0, 0, this.width, 80, 8); // 绘制圆角矩形
    this.background.endFill(); // 完成绘制
    this.container.addChild(this.background); // 将背景添加到容器
    this.container.addChild(this.text); // 将文本添加到容器
    this.container.visible = false; // 初始隐藏
    this.timer = 0; // 初始化计时器
    this.fadeOut = false; // 初始化淡出状态
  } // 结束构造函数

  show(message, duration) { // 定义显示消息的方法
    this.text.text = message; // 更新文本内容
    this.duration = duration || this.duration; // 更新显示时长
    this.timer = 0; // 重置计时器
    this.fadeOut = false; // 重置淡出状态
    this.container.visible = true; // 显示容器
    this.container.alpha = 1; // 重置透明度
  } // 结束显示方法

  update(delta) { // 定义更新方法
    if (!this.container.visible) { // 如果不可见
      return; // 不执行任何逻辑
    } // 结束可见性判断
    this.timer += delta * (1000 / 60); // 将帧增量转换为毫秒并累计
    if (!this.fadeOut && this.timer >= this.duration) { // 如果达到显示时长
      this.fadeOut = true; // 启动淡出
      this.timer = 0; // 重置计时器用于淡出
    } // 结束时长判断
    if (this.fadeOut) { // 如果处于淡出状态
      const fadeProgress = Math.min(1, this.timer / 300); // 计算淡出进度
      this.container.alpha = 1 - fadeProgress; // 更新透明度
      if (fadeProgress >= 1) { // 如果淡出完成
        this.container.visible = false; // 隐藏容器
      } // 结束完成判断
    } // 结束淡出逻辑
  } // 结束更新方法
} // 结束消息框类定义
