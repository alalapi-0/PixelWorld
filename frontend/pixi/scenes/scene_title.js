// 模块：显示标题界面并等待玩家开始游戏
import * as PIXI from "https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.4.0/pixi.min.mjs"; // 导入 PIXI 库
import { BaseScene } from "../core/scene.js"; // 导入场景基类
import { onKeyOnce, isDown } from "../core/input.js"; // 导入输入工具
import { SceneMap } from "./scene_map.js"; // 导入地图场景

export class SceneTitle extends BaseScene { // 定义标题场景类
  async enter() { // 重写进入场景逻辑
    const title = new PIXI.Text("miniWorld", { fill: 0xffffff, fontSize: 48, fontWeight: "bold" }); // 创建标题文字
    title.anchor.set(0.5); // 设置锚点为中心
    title.position.set(this.config.width / 2, this.config.height / 2 - 40); // 放置在屏幕偏上位置
    this.stage.addChild(title); // 添加标题到舞台
    const hint = new PIXI.Text("按 Enter 开始", { fill: 0xdddddd, fontSize: 24 }); // 创建提示文字
    hint.anchor.set(0.5); // 设置提示锚点
    hint.position.set(this.config.width / 2, this.config.height / 2 + 20); // 放置在标题下方
    this.stage.addChild(hint); // 添加提示到舞台
    this.started = false; // 初始化场景切换标记
    this.enterCallback = () => { // 定义进入地图的闭包
      if (!this.started) { // 如果尚未进入地图
        this.started = true; // 标记已开始
        this.manager.changeScene(SceneMap); // 切换到地图场景
      } // 结束标记判断
    }; // 定义进入地图的回调
    onKeyOnce("Enter", this.enterCallback); // 注册一次性回调
  } // 结束进入逻辑

  update() { // 重写每帧更新
    if (!this.started && isDown("Enter")) { // 如果按下 Enter 且尚未开始
      this.enterCallback(); // 触发进入地图逻辑
    } // 结束判断
  } // 结束更新逻辑

  async exit() { // 重写退出逻辑
    // 标题场景在切换时由场景管理器清空舞台
  } // 结束退出逻辑
} // 结束标题场景类定义
