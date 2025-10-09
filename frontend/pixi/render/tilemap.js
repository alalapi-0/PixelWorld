// 模块：根据地图数据渲染瓦片并提供坐标转换工具
import * as PIXI from "https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.4.0/pixi.min.mjs"; // 导入 PIXI 库

const TILE_COLORS = { // 定义占位瓦片颜色映射
  1: 0x4caf50, // 草地颜色
  2: 0xbdb76b, // 道路颜色
  3: 0xc0c0c0, // 瓷砖地颜色
  4: 0x1e88e5, // 水面颜色
  5: 0x1565c0, // 湖泊颜色
  6: 0x6d4c41, // 墙壁颜色
  7: 0x2e7d32, // 树木颜色
  8: 0x8d6e63, // 房屋颜色
  9: 0x757575, // 岩石颜色
  10: 0xff5722 // 岩浆颜色
}; // 结束颜色映射

export class TileMap { // 定义瓦片地图类
  constructor(app, mapData, options = {}) { // 构造函数接收应用与地图数据
    this.app = app; // 保存 PIXI 应用引用
    this.mapData = mapData; // 保存地图数据
    this.tileSize = options.tileSize || 32; // 保存瓦片尺寸
    this.container = new PIXI.Container(); // 创建容器用于承载瓦片
    this.tilesheetTexture = options.tilesheetTexture || null; // 保存图集纹理
    this.layerData = this.extractLayerData(mapData); // 提取图层数据
    this.width = mapData.width; // 保存地图宽度（格）
    this.height = mapData.height; // 保存地图高度（格）
    if (this.tilesheetTexture) { // 如果存在真实图集
      this.buildFromTilesheet(); // 使用图集渲染
    } else { // 否则使用占位图
      this.buildProcedural(); // 使用程序化渲染
    } // 结束渲染分支
  } // 结束构造函数

  extractLayerData(mapData) { // 定义方法提取图层数据
    if (!mapData.layers || mapData.layers.length === 0) { // 如果没有图层
      throw new Error("地图数据缺少图层"); // 抛出错误
    } // 结束校验
    const layer = mapData.layers.find((l) => l.type === "tilelayer"); // 查找瓦片图层
    if (!layer) { // 如果找不到
      throw new Error("地图数据缺少瓦片图层"); // 抛出错误
    } // 结束校验
    return layer.data; // 返回图层数据数组
  } // 结束图层提取方法

  buildFromTilesheet() { // 定义使用图集渲染的方法
    const baseTexture = this.tilesheetTexture.baseTexture || this.tilesheetTexture; // 获取基础纹理
    const tileWidth = this.tileSize; // 获取瓦片宽度
    const tileHeight = this.tileSize; // 获取瓦片高度
    const columns = Math.floor(baseTexture.width / tileWidth); // 计算图集中列数
    this.layerData.forEach((gid, index) => { // 遍历每个瓦片
      if (gid === 0) { // 如果为空瓦片
        return; // 跳过
      } // 结束空瓦片判断
      const tileIndex = gid - 1; // 计算从零开始的索引
      const column = tileIndex % columns; // 计算所在列
      const row = Math.floor(tileIndex / columns); // 计算所在行
      const frame = new PIXI.Rectangle(column * tileWidth, row * tileHeight, tileWidth, tileHeight); // 创建裁剪区域
      const texture = new PIXI.Texture(baseTexture, frame); // 基于裁剪区域创建纹理
      const sprite = new PIXI.Sprite(texture); // 创建精灵
      const gridX = index % this.width; // 计算格子 X
      const gridY = Math.floor(index / this.width); // 计算格子 Y
      sprite.position.set(gridX * tileWidth, gridY * tileHeight); // 设置精灵位置
      this.container.addChild(sprite); // 添加到容器
    }); // 结束遍历
  } // 结束图集渲染方法

  buildProcedural() { // 定义程序化渲染方法
    const renderer = this.app.renderer; // 获取渲染器
    const textures = new Map(); // 创建纹理缓存
    this.layerData.forEach((gid, index) => { // 遍历瓦片数据
      if (gid === 0) { // 如果为空瓦片
        return; // 跳过
      } // 结束判断
      if (!textures.has(gid)) { // 如果纹理尚未生成
        const graphics = new PIXI.Graphics(); // 创建绘图对象
        graphics.beginFill(TILE_COLORS[gid] || 0xffffff); // 设置填充颜色
        graphics.drawRect(0, 0, this.tileSize, this.tileSize); // 绘制矩形瓦片
        graphics.endFill(); // 结束填充
        graphics.lineStyle(1, 0x000000, 0.1); // 设置简单纹理描边
        graphics.moveTo(0, 0); // 移动到起点
        graphics.lineTo(this.tileSize, this.tileSize); // 绘制对角线
        const texture = renderer.generateTexture(graphics); // 生成纹理
        textures.set(gid, texture); // 缓存纹理
      } // 结束纹理生成
      const sprite = new PIXI.Sprite(textures.get(gid)); // 创建精灵
      const gridX = index % this.width; // 计算格子 X
      const gridY = Math.floor(index / this.width); // 计算格子 Y
      sprite.position.set(gridX * this.tileSize, gridY * this.tileSize); // 设置精灵位置
      this.container.addChild(sprite); // 添加到容器
    }); // 结束遍历
  } // 结束程序化渲染方法

  gidAtWorld(x, y) { // 定义根据世界坐标获取 gid 的方法
    const grid = this.worldToGrid(x, y); // 将世界坐标转换为格子坐标
    return this.gidAtGrid(grid.gx, grid.gy); // 返回格子对应的 gid
  } // 结束世界坐标查询

  gidAtGrid(gx, gy) { // 定义根据格子坐标获取 gid 的方法
    if (gx < 0 || gy < 0 || gx >= this.width || gy >= this.height) { // 如果超出范围
      return 0; // 返回空 gid
    } // 结束越界判断
    const index = gy * this.width + gx; // 计算一维索引
    return this.layerData[index] || 0; // 返回对应的 gid
  } // 结束格子坐标查询

  worldToGrid(x, y) { // 定义世界坐标到格子坐标的转换
    const gx = Math.floor(x / this.tileSize); // 计算格子 X
    const gy = Math.floor(y / this.tileSize); // 计算格子 Y
    return { gx, gy }; // 返回坐标对象
  } // 结束世界转格子

  gridToWorld(gx, gy) { // 定义格子坐标到世界坐标的转换
    const x = gx * this.tileSize; // 计算世界 X
    const y = gy * this.tileSize; // 计算世界 Y
    return { x, y }; // 返回坐标对象
  } // 结束格子转世界
} // 结束瓦片地图类定义
