import { createMiniWorldGame } from './game'; // 引入创建游戏的方法

declare global {
  interface Window {
    __MINIWORLD_START_SCENE__?: string; // 通过URL参数指定的启动场景
  }
}

// 解析URL参数，允许通过 ?scene=ResourceBrowser 等形式直接打开特定界面
const params = new URLSearchParams(window.location.search);
const requestedScene = params.get('scene');
if (requestedScene) {
  window.__MINIWORLD_START_SCENE__ = requestedScene;
}

createMiniWorldGame(); // 立即创建游戏实例

