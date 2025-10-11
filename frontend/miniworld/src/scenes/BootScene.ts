import Phaser from 'phaser'; // 引入Phaser框架
import { loadOrFallback } from '../core/Loader'; // 引入资源加载器
// 分隔注释 // 保持行有注释
export default class BootScene extends Phaser.Scene { // 定义启动场景
  private loadingLabel?: Phaser.GameObjects.Text; // 存储加载文本引用
  // 分隔注释 // 保持行有注释
  public constructor() { // 构造函数
    super('BootScene'); // 调用父类并设定场景键名
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public preload(): void { // 预加载阶段
    this.loadingLabel = this.add.text(160, 160, '加载中...', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffffff' }); // 创建加载文本
    this.loadingLabel.setOrigin(0.5); // 设置文本居中
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public async create(): Promise<void> { // 创建阶段
    await loadOrFallback(this); // 执行资源加载
    if (this.loadingLabel) { // 如果存在文本
      this.loadingLabel.setText('加载完成'); // 更新文案
    } // 条件结束
    const requested = (window as typeof window & { __MINIWORLD_START_SCENE__?: string }).__MINIWORLD_START_SCENE__;
    const normalized = requested?.toLowerCase() ?? '';
    let target: string = 'WorldScene';
    if (normalized === 'resourcebrowser' || normalized === 'resourcebrowserscene') {
      target = 'ResourceBrowserScene';
    }
    this.scene.start(target); // 根据参数切换到目标场景
  } // 方法结束
} // 类结束
