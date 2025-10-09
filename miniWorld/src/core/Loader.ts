import Phaser from 'phaser'; // 引入Phaser框架
import { TextureFactory, TilesMeta, SpritesMeta } from './TextureFactory'; // 引入纹理工厂与类型
import { TileType } from '../world/Types'; // 引入地形类型
// 分隔注释 // 保持行有注释
const TILE_SEQUENCE: TileType[] = ['GRASS', 'ROAD', 'TILE_FLOOR', 'WATER', 'LAKE', 'WALL', 'TREE', 'HOUSE', 'ROCK', 'LAVA']; // 定义瓦片顺序常量
const TILE_SHEET_KEY = 'external_tilesheet'; // 定义外部瓦片图集键名
const PLAYER_SHEET_KEY = 'external_player'; // 定义外部角色图集键名
let assetSourceLabel = '占位纹理'; // 默认素材来源标签
// 分隔注释 // 保持行有注释
async function assetExists(url: string): Promise<boolean> { // 判断资源是否存在的辅助函数
  try { // 尝试发起请求
    const response = await fetch(url, { method: 'HEAD' }); // 使用HEAD请求检查资源
    return response.ok; // 返回响应是否成功
  } catch (error) { // 捕获异常
    return false; // 发生异常则视为不存在
  } // 结束异常捕获
} // 函数结束
// 分隔注释 // 保持行有注释
function transferFrame(scene: Phaser.Scene, sheetKey: string, textureKey: string, frameIndex: number): void { // 将图集帧复制为独立纹理
  const sourceTexture = scene.textures.get(sheetKey); // 获取图集纹理
  const frame = sourceTexture.get(frameIndex); // 根据帧序号取得帧对象
  if (!frame) { // 如果帧不存在
    return; // 提前返回
  } // 结束检查
  const canvas = scene.textures.createCanvas(textureKey, frame.width, frame.height); // 创建画布纹理作为目标
  const context = canvas.context; // 获取2D绘图上下文
  context.imageSmoothingEnabled = false; // 禁用平滑确保像素清晰
  context.drawImage(frame.source.image, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, frame.width, frame.height); // 将帧绘制到画布
  canvas.refresh(); // 刷新纹理数据
} // 函数结束
// 分隔注释 // 保持行有注释
async function loadExternalTiles(scene: Phaser.Scene): Promise<boolean> { // 加载外部瓦片素材
  const sheetUrl = '/tiles/tilesheet.png'; // 定义瓦片图集路径
  const exists = await assetExists(sheetUrl); // 检查资源是否存在
  if (!exists) { // 如果不存在
    return false; // 返回失败
  } // 结束检查
  await new Promise<void>((resolve) => { // 创建等待加载完成的Promise
    scene.load.spritesheet(TILE_SHEET_KEY, sheetUrl, { frameWidth: 32, frameHeight: 32 }); // 注册瓦片图集加载
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve()); // 加载完成时解析Promise
    scene.load.start(); // 启动加载流程
  }); // Promise结束
  TILE_SEQUENCE.forEach((type, index) => { // 遍历所有地形类型
    const targetKey = `tile_${type}`; // 生成目标纹理键
    if (scene.textures.exists(targetKey)) { // 如果纹理已存在
      scene.textures.remove(targetKey); // 先移除旧纹理
    } // 结束检查
    transferFrame(scene, TILE_SHEET_KEY, targetKey, index); // 复制对应帧为独立纹理
  }); // 遍历结束
  return true; // 返回加载成功
} // 函数结束
// 分隔注释 // 保持行有注释
async function loadExternalPlayer(scene: Phaser.Scene): Promise<boolean> { // 加载外部角色素材
  const playerUrl = '/characters/player.png'; // 定义角色贴图路径
  const exists = await assetExists(playerUrl); // 检查资源是否存在
  if (!exists) { // 如果不存在
    return false; // 返回失败
  } // 结束检查
  await new Promise<void>((resolve) => { // 创建加载Promise
    scene.load.spritesheet(PLAYER_SHEET_KEY, playerUrl, { frameWidth: 16, frameHeight: 32 }); // 注册角色图集加载
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve()); // 完成时解析Promise
    scene.load.start(); // 启动加载流程
  }); // Promise结束
  if (scene.anims.exists('player_walk')) { // 如果已有玩家动画
    scene.anims.remove('player_walk'); // 移除旧动画
  } // 结束检查
  const texture = scene.textures.get(PLAYER_SHEET_KEY); // 获取外部角色纹理
  const frameTotal = texture.frameTotal; // 获取帧数量
  for (let index = 0; index < frameTotal; index += 1) { // 遍历帧序号
    const frameKey = `player_idle_${index}`; // 生成帧纹理键
    if (scene.textures.exists(frameKey)) { // 如果纹理已存在
      scene.textures.remove(frameKey); // 移除旧纹理
    } // 结束检查
    transferFrame(scene, PLAYER_SHEET_KEY, frameKey, index); // 拷贝帧到独立纹理
  } // 循环结束
  scene.anims.create({ key: 'player_walk', frames: new Array(frameTotal).fill(0).map((_, idx) => ({ key: `player_idle_${idx}` })), frameRate: 6, repeat: -1 }); // 使用外部帧创建动画
  return true; // 返回加载成功
} // 函数结束
// 分隔注释 // 保持行有注释
export async function loadOrFallback(scene: Phaser.Scene): Promise<void> { // 统一加载外部或占位素材
  const tilesMeta: TilesMeta = TextureFactory.loadBuiltinTilesMeta(); // 获取内置瓦片元数据
  const spritesMeta: SpritesMeta = TextureFactory.loadBuiltinSpritesMeta(); // 获取内置角色元数据
  const tilesLoaded = await loadExternalTiles(scene); // 尝试加载外部瓦片
  const playerLoaded = await loadExternalPlayer(scene); // 尝试加载外部角色
  if (!tilesLoaded) { // 如果外部瓦片缺失
    TextureFactory.createTileTextures(scene, tilesMeta); // 生成占位瓦片
  } // 条件结束
  if (!playerLoaded) { // 如果外部角色缺失
    TextureFactory.createPlayerTextures(scene, spritesMeta); // 生成占位角色
  } // 条件结束
  assetSourceLabel = tilesLoaded || playerLoaded ? '外部素材' : '占位纹理'; // 根据加载结果记录来源标签
  scene.registry.set('assetSource', assetSourceLabel); // 将标签写入注册表供HUD使用
} // 函数结束
// 分隔注释 // 保持行有注释
export function getAssetSourceLabel(): string { // 导出素材来源读取函数
  return assetSourceLabel; // 返回当前标签
} // 函数结束
