// 模块：封装 PIXI 应用创建与场景切换逻辑
import * as PIXI from "https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.4.0/pixi.min.mjs"; // 导入 PIXI 库
import { BaseScene } from "./scene.js"; // 导入场景基类

class AppManager { // 定义应用管理器类
  constructor(config) { // 构造函数接收配置
    this.config = config; // 保存配置引用
    this.app = new PIXI.Application({ width: config.width, height: config.height, background: 0x000000, resolution: 1, autoDensity: false, antialias: false }); // 创建 PIXI 应用实例
    this.stage = this.app.stage; // 记录舞台引用
    this.currentScene = null; // 当前场景初始为空
    this.container = document.getElementById("game-root"); // 获取页面容器
    this.container.innerHTML = ""; // 清空容器内容
    this.container.appendChild(this.app.view); // 将画布挂载到容器
    this.app.ticker.add((delta) => this.update(delta)); // 每帧调用更新方法
    window.addEventListener("resize", () => this.handleResize()); // 监听窗口大小变化
    this.handleResize(); // 初始化时执行一次自适应
  } // 结束构造函数

  async changeScene(SceneClass, ...args) { // 异步方法用于切换场景
    if (this.currentScene) { // 如果存在旧场景
      await this.currentScene.exit(); // 调用旧场景退出逻辑
      this.stage.removeChildren(); // 清空舞台子节点
    } // 结束旧场景处理
    const scene = new SceneClass(this, ...args); // 创建新场景实例
    if (!(scene instanceof BaseScene)) { // 校验场景类型
      throw new Error("场景必须继承 BaseScene"); // 抛出错误提醒
    } // 结束类型校验
    this.currentScene = scene; // 记录当前场景
    await this.currentScene.enter(); // 调用场景进入逻辑
  } // 结束场景切换方法

  update(delta) { // 定义每帧更新方法
    if (this.currentScene) { // 如果当前场景存在
      this.currentScene.update(delta); // 调用场景更新逻辑
    } // 结束存在判断
  } // 结束更新方法

  handleResize() { // 定义窗口自适应方法
    const baseWidth = this.config.width; // 读取基础宽度
    const baseHeight = this.config.height; // 读取基础高度
    const scaleX = Math.floor(window.innerWidth / baseWidth); // 计算横向整数缩放
    const scaleY = Math.floor(window.innerHeight / baseHeight); // 计算纵向整数缩放
    const scale = Math.max(1, Math.min(scaleX || 0, scaleY || 0)); // 选择合适的缩放倍数
    const view = this.app.view; // 获取画布元素
    view.style.width = `${baseWidth * scale}px`; // 设置画布显示宽度
    view.style.height = `${baseHeight * scale}px`; // 设置画布显示高度
    view.style.imageRendering = "pixelated"; // 开启像素化渲染
  } // 结束自适应方法
} // 结束应用管理器类定义

export async function createAppManager(config) { // 导出异步工厂函数
  const manager = new AppManager(config); // 创建管理器实例
  return manager; // 返回管理器
} // 结束工厂函数
