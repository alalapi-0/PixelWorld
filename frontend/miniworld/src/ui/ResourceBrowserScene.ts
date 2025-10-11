import Phaser from 'phaser'; // 引入Phaser以构建场景
import { ResourceListPanel, type ResourceListPanelAPI, type ResourceListPanelConfig } from './ResourceListPanel'; // 引入左侧列表面板
import {
  ResourcePreviewPanel,
  type ResourcePreviewPanelAPI,
  type ResourcePreviewPanelConfig,
  type ResourceIndex,
  type ResourceCategory,
  type ResourcePreviewItem,
} from './ResourcePreviewPanel'; // 引入右侧预览面板与共享类型

/**
 * 资源浏览器场景：读取 preview_index.json 后，将音频与图片资源以纯阅读模式展示。
 * 场景仅根据文件路径创建预览，不生成或导出任何二进制数据。
 */
export default class ResourceBrowserScene extends Phaser.Scene {
  private listPanel!: ResourceListPanelAPI; // 左侧列表面板
  private previewPanel!: ResourcePreviewPanelAPI; // 右侧预览面板
  private resources: ResourceIndex = { images: [], audio: [] }; // 缓存JSON数据
  private currentCategory: ResourceCategory = 'images'; // 当前激活的类别
  private escKey?: Phaser.Input.Keyboard.Key; // ESC关闭快捷键

  public constructor() {
    super('ResourceBrowserScene'); // 注册场景键名
  }

  /**
   * Phaser 创建阶段：初始化界面、注册事件并开始异步加载 JSON。
   */
  public create(): void {
    console.info('✅ ResourceBrowserScene initialized'); // 按验收标准输出日志
    this.buildStaticUI(); // 渲染背景与说明文本
    this.listPanel = this.createListPanel(this.createListPanelConfig()); // 创建列表面板
    this.previewPanel = this.createPreviewPanel(this.createPreviewPanelConfig()); // 创建预览面板
    this.registerShutdownHooks(); // 绑定销毁钩子
    this.setupCloseShortcut(); // 绑定ESC退出
    void this.reloadResources(); // 异步加载JSON索引
  }

  /**
   * 将 preview_index.json 重新加载一遍，可供测试调用。
   */
  public async reloadResources(): Promise<void> {
    try {
      const response = await fetch('assets/preview_index.json'); // 读取JSON
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = (await response.json()) as ResourceIndex; // 解析JSON
      this.handleDataLoaded(data); // 更新面板
      console.info(`✅ preview_index.json loaded (${this.resources.images.length} images, ${this.resources.audio.length} audio)`);
      console.info('✅ Text-only operations, no binary generated');
    } catch (error) {
      console.error('ResourceBrowserScene failed to load preview_index.json', error);
    }
  }

  /**
   * 提供给测试的便捷访问方法，返回当前资源数量。
   */
  public getLoadedCounts(): { images: number; audio: number } {
    return { images: this.resources.images.length, audio: this.resources.audio.length };
  }

  /**
   * 返回当前标签文本，便于测试验证。
   */
  public getTabLabels(): string[] {
    return this.listPanel?.getTabLabels() ?? [];
  }

  /**
   * 返回当前预览类型。
   */
  public getCurrentPreviewType(): 'image' | 'audio' | null {
    return this.previewPanel?.getCurrentPreviewType() ?? null;
  }

  /**
   * 将加载好的数据写入状态并刷新界面。
   */
  protected handleDataLoaded(data: ResourceIndex): void {
    this.resources = {
      images: data.images ?? [],
      audio: data.audio ?? [],
    };
    this.listPanel.setResources(this.resources);
    this.listPanel.setActiveCategory(this.currentCategory);
  }

  /**
   * 创建背景、说明文字等静态元素。
   */
  protected buildStaticUI(): void {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0.75)'); // 半透明背景
    const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7);
    overlay.setOrigin(0, 0);

    const title = this.add.text(16, 12, '资源浏览器', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#ffffff',
    });
    const hint = this.add.text(16, 36, '左侧选择资源，右侧预览；按 ESC 返回世界。', {
      fontFamily: 'sans-serif',
      fontSize: '12px',
      color: '#cccccc',
    });
    hint.setWordWrapWidth(this.scale.width - 32);
    hint.setLineSpacing(4);
  }

  /**
   * 构造列表面板配置，集中管理布局参数。
   */
  private createListPanelConfig(): ResourceListPanelConfig {
    return {
      scene: this,
      bounds: { x: 16, y: 64, width: 140, height: this.scale.height - 80 },
      initialCategory: this.currentCategory,
      onCategoryChange: (category) => this.handleCategoryChange(category),
      onItemSelected: (category, item) => this.handleItemSelected(category, item),
    };
  }

  /**
   * 构造预览面板配置。
   */
  private createPreviewPanelConfig(): ResourcePreviewPanelConfig {
    const leftWidth = 140 + 16 * 2;
    return {
      scene: this,
      bounds: { x: leftWidth, y: 64, width: this.scale.width - leftWidth - 16, height: this.scale.height - 80 },
    };
  }

  /**
   * 创建列表面板，可被测试类覆盖以替换实现。
   */
  protected createListPanel(config: ResourceListPanelConfig): ResourceListPanelAPI {
    return new ResourceListPanel(config);
  }

  /**
   * 创建预览面板，可被测试类覆盖以替换实现。
   */
  protected createPreviewPanel(config: ResourcePreviewPanelConfig): ResourcePreviewPanelAPI {
    return new ResourcePreviewPanel(config);
  }

  /**
   * 标签切换时的回调：记录当前类别并清空预览。
   */
  private handleCategoryChange(category: ResourceCategory): void {
    this.currentCategory = category;
    this.previewPanel.clearPreview();
  }

  /**
   * 用户选择资源时的回调：触发预览展示。
   */
  private handleItemSelected(category: ResourceCategory, item: ResourcePreviewItem): void {
    this.currentCategory = category;
    this.previewPanel.showResource(category, item);
  }

  /**
   * 绑定 ESC 按键用于关闭场景。
   */
  private setupCloseShortcut(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }
    this.escKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.escKey.on('down', () => {
      this.exitScene();
    });
  }

  /**
   * 注册场景销毁钩子，清理子组件与键位。
   */
  private registerShutdownHooks(): void {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.listPanel?.destroy();
      this.previewPanel?.destroy();
      if (this.escKey) {
        this.input.keyboard?.removeKey(this.escKey);
        this.escKey = undefined;
      }
    });
  }

  /**
   * 退出场景并恢复或启动世界场景。
   */
  private exitScene(): void {
    this.scene.stop();
    if (this.scene.isPaused('WorldScene')) {
      this.scene.resume('WorldScene');
    } else if (!this.scene.isActive('WorldScene')) {
      this.scene.start('WorldScene');
    }
  }
}

