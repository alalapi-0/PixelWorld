// 模块：根据资源构建玩家角色精灵并处理移动与动画
import * as PIXI from "https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.4.0/pixi.min.mjs"; // 导入 PIXI 库

export class CharacterSprite { // 定义角色精灵类
  constructor(app, tilemap, blockedGids, options = {}) { // 构造函数接收应用、地图与阻挡集合
    this.app = app; // 保存应用引用
    this.tilemap = tilemap; // 保存地图引用
    this.blockedGids = blockedGids; // 保存阻挡集合
    this.tileSize = options.tileSize || 32; // 设置瓦片尺寸
    this.speed = options.speed || this.tileSize * 4; // 设置移动速度
    this.direction = { x: 0, y: 0 }; // 初始化方向向量
    this.animations = {}; // 初始化动画集合
    this.currentKey = "idle"; // 当前动画键
    this.container = new PIXI.Container(); // 创建容器承载精灵
    this.sprite = this.createSprite(); // 创建具体精灵
    this.sprite.anchor.set(0.5, 0.9); // 设置角色锚点
    this.container.addChild(this.sprite); // 将精灵加入容器
  } // 结束构造函数

  createSprite() { // 定义创建精灵的方法
    const resources = window.__PIXELWORLD_RESOURCES__ || {}; // 读取全局资源信息
    if (resources.playerTexture && resources.playerAnimData) { // 如果存在真实素材
      return this.createFromSpriteSheet(resources.playerAnimData); // 使用雪碧图创建
    } // 结束真实素材判断
    return this.createProceduralSprite(); // 否则创建占位小人
  } // 结束创建精灵方法

  createFromSpriteSheet(animData) { // 定义使用雪碧图的创建逻辑
    const baseTexture = PIXI.Assets.get("player_texture"); // 获取已加载的角色贴图
    const frameWidth = animData.frame_width || this.tileSize; // 读取帧宽
    const frameHeight = animData.frame_height || this.tileSize; // 读取帧高
    const fps = animData.fps || 8; // 读取帧率
    const columns = Math.floor(baseTexture.width / frameWidth); // 计算列数
    const totalFrames = animData.total_frames || (columns * Math.floor(baseTexture.height / frameHeight)); // 估算帧数
    const animations = animData.animations || { down: [0, 1, 2, 1], left: [3, 4, 5, 4], right: [6, 7, 8, 7], up: [9, 10, 11, 10], idle: [0] }; // 获取动画映射
    Object.entries(animations).forEach(([key, frames]) => { // 遍历每个动画
      this.animations[key] = frames.map((frameIndex) => { // 将帧索引映射为纹理
        const index = Math.min(frameIndex, totalFrames - 1); // 限制索引范围
        const column = index % columns; // 计算所在列
        const row = Math.floor(index / columns); // 计算所在行
        const rect = new PIXI.Rectangle(column * frameWidth, row * frameHeight, frameWidth, frameHeight); // 创建裁剪区域
        return new PIXI.Texture(baseTexture, rect); // 返回纹理
      }); // 结束帧映射
    }); // 结束动画遍历
    const animated = new PIXI.AnimatedSprite(this.animations.idle || [new PIXI.Texture(baseTexture, new PIXI.Rectangle(0, 0, frameWidth, frameHeight))]); // 创建动画精灵
    animated.animationSpeed = fps / 60; // 设置动画速度
    animated.play(); // 开启动画
    return animated; // 返回动画精灵
  } // 结束雪碧图创建方法

  createProceduralSprite() { // 定义程序化小人创建逻辑
    const renderer = this.app.renderer; // 获取渲染器
    const colors = [0xfff176, 0x90caf9]; // 定义身体与衣服颜色
    const textures = {}; // 准备方向纹理集合
    const directions = ["idle", "down", "up", "left", "right"]; // 需要的方向列表
    directions.forEach((dir, index) => { // 遍历方向
      const graphics = new PIXI.Graphics(); // 创建绘图对象
      graphics.beginFill(colors[0]); // 绘制头部颜色
      graphics.drawCircle(this.tileSize / 2, this.tileSize / 4, this.tileSize / 4); // 绘制头部
      graphics.endFill(); // 完成头部绘制
      graphics.beginFill(colors[1]); // 绘制身体颜色
      graphics.drawRoundedRect(this.tileSize / 4, this.tileSize / 3, this.tileSize / 2, this.tileSize * 0.55, 4); // 绘制身体
      graphics.endFill(); // 完成身体绘制
      graphics.lineStyle(2, 0xffffff, 0.6); // 绘制手臂轮廓
      const offset = Math.sin(index) * this.tileSize * 0.05; // 通过索引制造摆动
      graphics.moveTo(this.tileSize / 4, this.tileSize * 0.6); // 移动到左臂起点
      graphics.lineTo(this.tileSize / 8, this.tileSize * 0.8 + offset); // 绘制左臂
      graphics.moveTo(this.tileSize * 0.75, this.tileSize * 0.6); // 移动到右臂起点
      graphics.lineTo(this.tileSize * 0.9, this.tileSize * 0.8 - offset); // 绘制右臂
      graphics.lineStyle(2, 0x000000, 0.6); // 绘制腿部轮廓
      graphics.moveTo(this.tileSize * 0.4, this.tileSize * 0.85); // 移动到左腿起点
      graphics.lineTo(this.tileSize * 0.35, this.tileSize); // 绘制左腿
      graphics.moveTo(this.tileSize * 0.6, this.tileSize * 0.85); // 移动到右腿起点
      graphics.lineTo(this.tileSize * 0.65, this.tileSize); // 绘制右腿
      textures[dir] = [renderer.generateTexture(graphics)]; // 生成纹理
    }); // 结束方向遍历
    this.animations = textures; // 保存动画纹理
    const sprite = new PIXI.Sprite(textures.idle[0]); // 创建静态精灵
    return sprite; // 返回精灵
  } // 结束程序化创建方法

  setDirection(dx, dy) { // 定义设置方向的方法
    this.direction.x = dx; // 保存 X 分量
    this.direction.y = dy; // 保存 Y 分量
    const key = this.resolveDirectionKey(dx, dy); // 根据方向计算动画键
    if (this.currentKey !== key && this.animations[key]) { // 如果动画需要切换
      this.currentKey = key; // 更新当前键
      if (this.sprite instanceof PIXI.AnimatedSprite) { // 如果是动画精灵
        this.sprite.textures = this.animations[key]; // 更新纹理序列
        this.sprite.play(); // 播放动画
      } else { // 如果是普通精灵
        this.sprite.texture = this.animations[key][0]; // 替换纹理
      } // 结束类型判断
    } // 结束切换判断
  } // 结束设置方向方法

  resolveDirectionKey(dx, dy) { // 定义辅助方法转换方向键
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) { // 如果接近静止
      return "idle"; // 返回待机
    } // 结束静止判断
    if (Math.abs(dx) > Math.abs(dy)) { // 如果横向占主导
      return dx > 0 ? "right" : "left"; // 返回左右方向
    } // 结束横向判断
    return dy > 0 ? "down" : "up"; // 返回上下方向
  } // 结束辅助方法

  setPosition(x, y) { // 定义设置角色位置的方法
    this.container.position.set(x, y); // 更新容器位置
  } // 结束位置设置方法

  tryMove(deltaTime) { // 定义尝试移动的方法
    const magnitude = Math.hypot(this.direction.x, this.direction.y); // 计算方向向量长度
    if (magnitude === 0) { // 如果没有移动
      return; // 直接返回
    } // 结束静止判断
    const normX = this.direction.x / magnitude; // 归一化 X 分量
    const normY = this.direction.y / magnitude; // 归一化 Y 分量
    const distance = this.speed * deltaTime; // 计算移动距离
    const targetX = this.container.x + normX * distance; // 计算目标 X
    const targetY = this.container.y + normY * distance; // 计算目标 Y
    if (this.canMoveTo(targetX, targetY)) { // 如果目标可行走
      this.container.position.set(targetX, targetY); // 更新位置
      return; // 结束移动
    } // 结束整体碰撞判断
    const fallbackX = this.container.x + normX * distance; // 计算仅横向位移
    if (this.canMoveTo(fallbackX, this.container.y)) { // 如果横向可行
      this.container.x = fallbackX; // 更新横向
    } // 结束横向检查
    const fallbackY = this.container.y + normY * distance; // 计算仅纵向位移
    if (this.canMoveTo(this.container.x, fallbackY)) { // 如果纵向可行
      this.container.y = fallbackY; // 更新纵向
    } // 结束纵向检查
  } // 结束尝试移动方法

  canMoveTo(x, y) { // 定义碰撞检测方法
    const offsets = [ // 定义采样偏移列表
      { x: 0, y: 0 }, // 中心点
      { x: this.tileSize * 0.25, y: this.tileSize * 0.1 }, // 右前方
      { x: -this.tileSize * 0.25, y: this.tileSize * 0.1 }, // 左前方
      { x: this.tileSize * 0.2, y: this.tileSize * -0.2 }, // 右后方
      { x: -this.tileSize * 0.2, y: this.tileSize * -0.2 } // 左后方
    ]; // 结束偏移列表
    for (const offset of offsets) { // 遍历采样点
      const gid = this.tilemap.gidAtWorld(x + offset.x, y + offset.y); // 获取采样点所在瓦片 gid
      if (this.blockedGids.has(gid)) { // 如果瓦片被阻挡
        return false; // 返回不可移动
      } // 结束阻挡判断
    } // 结束循环
    return true; // 所有采样点均可通过
  } // 结束碰撞检测方法

  update(delta) { // 定义更新动画的方法
    if (this.sprite instanceof PIXI.AnimatedSprite) { // 如果是动画精灵
      this.sprite.update(delta); // 更新动画时间
    } // 结束类型判断
  } // 结束更新方法
} // 结束角色精灵类定义
