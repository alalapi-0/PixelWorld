// 模块：渲染单层地图并处理角色控制与相机跟随
import * as PIXI from "https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.4.0/pixi.min.mjs"; // 导入 PIXI 库
import { BaseScene } from "../core/scene.js"; // 导入场景基类
import { isDown, onKeyOnce } from "../core/input.js"; // 导入输入工具
import { TileMap } from "../render/tilemap.js"; // 导入瓦片渲染器
import { CharacterSprite } from "../render/character.js"; // 导入角色渲染器
import { MessageBox } from "../ui/message_box.js"; // 导入消息框组件

const BLOCKED_GIDS = new Set([4, 5, 6, 7, 8, 9, 10]); // 定义不可通行的 gid 集合

export class SceneMap extends BaseScene { // 定义地图场景类
  async enter() { // 重写进入逻辑
    this.worldContainer = new PIXI.Container(); // 创建世界容器
    this.stage.addChild(this.worldContainer); // 将世界容器添加到舞台
    const resources = window.__PIXELWORLD_RESOURCES__ || {}; // 获取资源信息
    const response = await fetch(resources.mapPath || "maps/demo_map.json"); // 加载地图数据
    const mapData = await response.json(); // 解析地图 JSON
    const tilesheetTexture = resources.tilesheet ? PIXI.Assets.get("tilesheet") : null; // 获取图块纹理
    this.tilemap = new TileMap(this.app, mapData, { tileSize: this.config.tileSize, tilesheetTexture }); // 创建瓦片地图
    this.worldContainer.addChild(this.tilemap.container); // 将瓦片容器加入世界
    this.player = new CharacterSprite(this.app, this.tilemap, BLOCKED_GIDS, { tileSize: this.config.tileSize }); // 创建玩家角色
    const spawn = this.findSpawnPosition(mapData); // 寻找出生点
    this.spawnPosition = spawn; // 保存出生位置
    this.player.setPosition(spawn.x, spawn.y); // 设置玩家位置
    this.worldContainer.addChild(this.player.container); // 将玩家加入世界
    this.messageBox = new MessageBox(this.app, { width: this.config.width - 40, duration: this.config.messageDuration }); // 创建消息框
    this.messageBox.container.position.set(20, this.config.height - 100); // 设置消息框位置
    this.stage.addChild(this.messageBox.container); // 将消息框加入舞台
    this.elapsedSeconds = 0; // 初始化计时器
    this.welcomeShown = false; // 标记欢迎消息未显示
    onKeyOnce("KeyR", () => { this.resetPlayer(); }); // 注册重置位置回调
  } // 结束进入逻辑

  findSpawnPosition(mapData) { // 定义寻找出生点的方法
    const layer = mapData.layers.find((l) => l.type === "tilelayer"); // 获取瓦片图层
    const walkable = new Set([1, 2, 3]); // 定义可行走 gid 集合
    for (let index = 0; index < layer.data.length; index += 1) { // 遍历所有瓦片
      const gid = layer.data[index]; // 读取当前 gid
      if (walkable.has(gid)) { // 如果可行走
        const gridX = index % mapData.width; // 计算格子 X
        const gridY = Math.floor(index / mapData.width); // 计算格子 Y
        const world = this.tilemap.gridToWorld(gridX, gridY); // 转换为世界坐标
        return { x: world.x + this.config.tileSize / 2, y: world.y + this.config.tileSize * 0.8 }; // 返回偏移后的坐标
      } // 结束判断
    } // 结束循环
    return { x: this.config.tileSize / 2, y: this.config.tileSize / 2 }; // 默认返回左上角
  } // 结束出生点方法

  resetPlayer() { // 定义重置玩家位置的方法
    this.player.setPosition(this.spawnPosition.x, this.spawnPosition.y); // 恢复到出生点
  } // 结束重置方法

  update(delta) { // 重写每帧更新
    const dt = delta / 60; // 将帧增量转换为秒
    const horizontal = (isDown("ArrowRight") ? 1 : 0) - (isDown("ArrowLeft") ? 1 : 0); // 计算横向输入
    const vertical = (isDown("ArrowDown") ? 1 : 0) - (isDown("ArrowUp") ? 1 : 0); // 计算纵向输入
    this.player.setDirection(horizontal, vertical); // 更新角色方向
    this.player.tryMove(dt); // 尝试移动角色
    this.player.update(delta); // 更新角色动画
    if (isDown("KeyR")) { // 如果按住 R 键
      this.resetPlayer(); // 重置玩家位置
    } // 结束重置判断
    this.updateCamera(); // 更新相机位置
    this.messageBox.update(delta); // 更新消息框
    this.elapsedSeconds += dt; // 累计经过时间
    if (!this.welcomeShown && this.elapsedSeconds >= 1) { // 如果达到 1 秒
      this.messageBox.show("欢迎来到 miniWorld", this.config.messageDuration); // 显示欢迎消息
      this.welcomeShown = true; // 标记已显示
    } // 结束欢迎消息判断
  } // 结束更新方法

  updateCamera() { // 定义更新相机的方法
    const viewWidth = this.config.width; // 获取视口宽度
    const viewHeight = this.config.height; // 获取视口高度
    const halfWidth = viewWidth / 2; // 计算半宽
    const halfHeight = viewHeight / 2; // 计算半高
    const mapWidth = this.tilemap.width * this.config.tileSize; // 计算地图宽度像素
    const mapHeight = this.tilemap.height * this.config.tileSize; // 计算地图高度像素
    const targetX = halfWidth - this.player.container.x; // 计算目标相机 X
    const targetY = halfHeight - this.player.container.y; // 计算目标相机 Y
    const minX = Math.min(0, viewWidth - mapWidth); // 计算最小 X 偏移
    const minY = Math.min(0, viewHeight - mapHeight); // 计算最小 Y 偏移
    const clampedX = Math.max(minX, Math.min(0, targetX)); // 限制相机 X 范围
    const clampedY = Math.max(minY, Math.min(0, targetY)); // 限制相机 Y 范围
    this.worldContainer.position.set(clampedX, clampedY); // 更新世界容器位置
  } // 结束相机方法

  async exit() { // 重写退出逻辑
    this.stage.removeChildren(); // 清空舞台节点
  } // 结束退出逻辑
} // 结束地图场景类定义
