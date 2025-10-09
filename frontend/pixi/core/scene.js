// 模块：定义场景基类供所有具体场景继承
export class BaseScene { // 导出场景基类
  constructor(manager) { // 构造函数接收应用管理器
    this.manager = manager; // 保存管理器引用
    this.app = manager.app; // 保存 PIXI 应用引用
    this.stage = manager.stage; // 保存舞台引用
    this.ticker = manager.app.ticker; // 保存计时器引用
    this.config = manager.config; // 保存配置引用
  } // 结束构造函数

  async enter() { // 定义进入场景的异步钩子
    // 子类可重写进入逻辑
  } // 结束 enter 方法

  async exit() { // 定义退出场景的异步钩子
    // 子类可重写退出逻辑
  } // 结束 exit 方法

  update(delta) { // 定义每帧更新钩子
    // 子类可重写更新逻辑
  } // 结束 update 方法
} // 结束基类定义
