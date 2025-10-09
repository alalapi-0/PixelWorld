// 模块：负责检测资源优先级并预加载必要素材
import * as PIXI from "https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.4.0/pixi.min.mjs"; // 导入 PIXI 库
import { BaseScene } from "../core/scene.js"; // 导入场景基类
import { SceneTitle } from "./scene_title.js"; // 导入标题场景

const TILE_PATH = "assets/build/tiles/tilesheet.png"; // 定义图块路径
const PLAYER_TEXTURE_PATH = "assets/build/characters/player.png"; // 定义角色贴图路径
const PLAYER_ANIM_PATH = "assets/build/characters/player.anim.json"; // 定义角色动画数据路径
const USER_MAP_PATH = "maps/user_map.json"; // 定义用户地图路径
const DEMO_MAP_PATH = "maps/demo_map.json"; // 定义演示地图路径

async function checkResource(url) { // 定义辅助函数检测资源可用性
  try { // 尝试访问资源
    const response = await fetch(url, { method: "HEAD" }); // 使用 HEAD 请求探测资源
    if (response.ok) { // 如果响应成功
      return true; // 返回可用
    } // 结束响应判断
  } catch (error) { // 捕获异常
    console.warn("资源探测失败", url, error); // 输出警告信息
  } // 结束异常捕获
  try { // 再次尝试使用 GET
    const response = await fetch(url, { method: "GET" }); // 使用 GET 请求探测资源
    if (response.ok) { // 如果响应成功
      return true; // 返回可用
    } // 结束响应判断
  } catch (error) { // 捕获异常
    console.warn("资源 GET 失败", url, error); // 输出警告信息
  } // 结束异常捕获
  return false; // 默认返回不可用
} // 结束资源检测函数

export class SceneBoot extends BaseScene { // 定义启动场景类
  async enter() { // 重写进入场景逻辑
    const loadingText = new PIXI.Text("加载资源中...", { fill: 0xffffff, fontSize: 24 }); // 创建加载提示文字
    loadingText.anchor.set(0.5); // 设置锚点为中心
    loadingText.position.set(this.config.width / 2, this.config.height / 2); // 放置在屏幕中心
    this.stage.addChild(loadingText); // 添加到舞台
    const tilesAvailable = await checkResource(TILE_PATH); // 检测图块资源
    const playerTextureAvailable = await checkResource(PLAYER_TEXTURE_PATH); // 检测角色贴图
    const playerAnimAvailable = await checkResource(PLAYER_ANIM_PATH); // 检测角色动画
    const userMapAvailable = await checkResource(USER_MAP_PATH); // 检测用户地图
    const selectedMap = userMapAvailable ? USER_MAP_PATH : DEMO_MAP_PATH; // 根据优先级选择地图
    window.__PIXELWORLD_RESOURCES__ = { // 在全局记录资源状态
      tilesheet: tilesAvailable ? TILE_PATH : null, // 保存图块路径或空
      playerTexture: playerTextureAvailable ? PLAYER_TEXTURE_PATH : null, // 保存角色贴图路径或空
      playerAnim: playerAnimAvailable ? PLAYER_ANIM_PATH : null, // 保存角色动画路径或空
      mapPath: selectedMap // 保存选择的地图路径
    }; // 结束全局对象写入
    const assetPromises = []; // 创建预加载任务数组
    if (tilesAvailable) { // 如果图块可用
      PIXI.Assets.add({ alias: "tilesheet", src: TILE_PATH }); // 向资源管理器注册图块
      assetPromises.push(PIXI.Assets.load("tilesheet")); // 添加加载任务
    } // 结束图块判断
    if (playerTextureAvailable) { // 如果角色贴图可用
      PIXI.Assets.add({ alias: "player_texture", src: PLAYER_TEXTURE_PATH }); // 注册角色贴图
      assetPromises.push(PIXI.Assets.load("player_texture")); // 添加加载任务
    } // 结束角色贴图判断
    if (playerAnimAvailable) { // 如果角色动画可用
      assetPromises.push(fetch(PLAYER_ANIM_PATH).then((res) => res.json()).then((json) => { window.__PIXELWORLD_RESOURCES__.playerAnimData = json; })); // 加载动画数据并写入全局
    } // 结束角色动画判断
    await Promise.all(assetPromises); // 等待所有预加载完成
    await this.manager.changeScene(SceneTitle); // 切换到标题场景
  } // 结束进入逻辑
} // 结束启动场景类定义
