import Phaser from 'phaser'; // 引入Phaser框架
import BootScene from './scenes/BootScene'; // 引入启动场景
import WorldScene from './scenes/WorldScene'; // 引入世界场景
import UIScene from './scenes/UIScene'; // 引入UI场景
import GlossaryScene from './ui/glossary/GlossaryScene'; // 引入图鉴场景
import AchievementScene from './ui/achievements/AchievementScene'; // 引入成就场景
import ResourceBrowserScene from './ui/ResourceBrowserScene'; // 引入资源浏览器场景
import ResourceManagerScene from './ui/ResourceManagerScene'; // 引入素材管理器场景
import { PIXEL_CONFIG } from './config/pixel'; // 引入像素渲染配置
// 分隔注释 // 保持行有注释
export function createMiniWorldGame(): Phaser.Game { // 导出创建游戏实例的函数
  const config: Phaser.Types.Core.GameConfig = { // 定义游戏配置对象
    type: Phaser.AUTO, // 自动选择渲染方式
    width: 320, // 设置游戏宽度
    height: 320, // 设置游戏高度
    parent: 'app', // 挂载到页面上的节点
    backgroundColor: '#1d1f21', // 设置背景颜色
    scene: [BootScene, WorldScene, UIScene, GlossaryScene, AchievementScene, ResourceBrowserScene, ResourceManagerScene], // 注册场景顺序
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, zoom: 2 }, // 缩放与居中设置
    dom: { createContainer: true }, // 启用DOM容器以嵌入音频控件
    render: {
      pixelArt: true,
      antialias: PIXEL_CONFIG.antialias,
      roundPixels: PIXEL_CONFIG.roundPixels,
      mipmapFilter: PIXEL_CONFIG.mipmap ? Phaser.Textures.FilterMode.LINEAR : Phaser.Textures.FilterMode.NEAREST,
    }, // 像素渲染配置
  }; // 结束配置对象
  return new Phaser.Game(config); // 创建并返回游戏实例
} // 函数结束
