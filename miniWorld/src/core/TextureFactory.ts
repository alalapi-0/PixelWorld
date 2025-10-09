import Phaser from 'phaser'; // 引入Phaser框架
import tilesMetaData from '../../assets/placeholders/tiles.meta.json'; // 引入瓦片占位元数据
import spritesMetaData from '../../assets/placeholders/sprites.meta.json'; // 引入角色占位元数据
// 分隔注释 // 保持行有注释
export type TilesMeta = Record<string, { color: string; detail: string }>; // 定义瓦片元数据类型
export type SpritesMeta = { player: { width: number; height: number; colors: string[] } }; // 定义角色元数据类型
// 分隔注释 // 保持行有注释
export class TextureFactory { // 导出纹理工厂类
  public static createTileTextures(scene: Phaser.Scene, meta: TilesMeta): void { // 创建瓦片纹理方法
    const size = 32; // 定义瓦片尺寸
    Object.entries(meta).forEach(([key, value]) => { // 遍历每个瓦片定义
      const textureKey = `tile_${key}`; // 生成纹理键名
      if (scene.textures.exists(textureKey)) { // 如果纹理已存在
        scene.textures.remove(textureKey); // 先移除旧纹理
      } // 结束存在判断
      const canvas = scene.textures.createCanvas(textureKey, size, size); // 创建画布纹理
      const context = canvas.context; // 获取2D上下文
      context.imageSmoothingEnabled = false; // 禁用平滑确保像素风
      context.fillStyle = value.color; // 设置主色
      context.fillRect(0, 0, size, size); // 填充背景色
      context.fillStyle = value.detail; // 设置细节色
      context.fillRect(4, 4, 8, 8); // 绘制左上角细节
      context.fillRect(size - 12, size - 12, 8, 8); // 绘制右下角细节
      context.fillRect(size / 2 - 2, size / 2 - 2, 4, 4); // 绘制中心像素
      canvas.refresh(); // 刷新纹理数据
    }); // 结束遍历
  } // 方法结束

  public static createPlayerTextures(scene: Phaser.Scene, meta: SpritesMeta): void { // 创建玩家纹理方法
    const baseKey = 'player_idle'; // 定义基础纹理键
    const frameCount = 2; // 定义帧数量
    const width = meta.player.width; // 读取宽度
    const height = meta.player.height; // 读取高度
    for (let i = 0; i < frameCount; i += 1) { // 遍历每帧
      const textureKey = `${baseKey}_${i}`; // 组合帧纹理键
      if (scene.textures.exists(textureKey)) { // 检查纹理是否存在
        scene.textures.remove(textureKey); // 移除旧纹理
      } // 结束检查
      const canvas = scene.textures.createCanvas(textureKey, width, height); // 创建画布纹理
      const context = canvas.context; // 获取2D上下文
      context.imageSmoothingEnabled = false; // 禁用平滑
      context.fillStyle = meta.player.colors[0]; // 使用第一种颜色填充背景
      context.fillRect(0, 0, width, height); // 填充整个人物轮廓
      context.fillStyle = meta.player.colors[1]; // 使用第二种颜色绘制衣服
      context.fillRect(2, height / 2, width - 4, height / 2 - 2); // 绘制下半部分服装
      context.fillStyle = meta.player.colors[2]; // 使用第三种颜色绘制细节
      context.fillRect(width / 2 - 2, 6, 4, 4); // 绘制面部特征
      context.fillRect(4 + i, height - 6, width / 2 - 4, 4); // 绘制左腿随帧摆动
      context.fillRect(width / 2 + i, height - 6, width / 2 - 4, 4); // 绘制右腿随帧摆动
      canvas.refresh(); // 刷新纹理
    } // 结束循环
    if (!scene.anims.exists('player_walk')) { // 检查动画是否已存在
      scene.anims.create({ // 创建玩家行走动画
        key: 'player_walk', // 动画键名
        frames: [{ key: `${baseKey}_0` }, { key: `${baseKey}_1` }], // 动画帧数组
        frameRate: 6, // 帧率设置
        repeat: -1, // 循环播放
      }); // 完成动画创建
    } // 动画检查结束
  } // 方法结束

  public static loadBuiltinTilesMeta(): TilesMeta { // 加载内置瓦片元数据
    return tilesMetaData as TilesMeta; // 返回类型断言后的数据
  } // 方法结束

  public static loadBuiltinSpritesMeta(): SpritesMeta { // 加载内置角色元数据
    return spritesMetaData as SpritesMeta; // 返回类型断言后的数据
  } // 方法结束
} // 类结束
