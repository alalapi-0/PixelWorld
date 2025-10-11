import Phaser from 'phaser'; // 引入Phaser以创建预览所需的图像与DOM元素
import './styles/resource_browser.css'; // 引入专用样式，确保音频控件样式统一

/**
 * 资源类别区分：图片与音频。统一使用字符串字面量便于类型推断。
 */
export type ResourceCategory = 'images' | 'audio';

/**
 * JSON 中每个条目的最小结构，仅包含类型标签与资源路径。
 */
export interface ResourcePreviewItem {
  type: string;
  path: string;
}

/**
 * assets/preview_index.json 的整体结构定义。仅保留 audio 与 images 两个键。
 */
export interface ResourceIndex {
  images: ResourcePreviewItem[];
  audio: ResourcePreviewItem[];
}

/**
 * 预览面板构造所需配置：包含场景引用与面板布局矩形。
 */
export interface ResourcePreviewPanelConfig {
  scene: Phaser.Scene;
  bounds: { x: number; y: number; width: number; height: number };
}

/**
 * 对外暴露的接口，供场景或测试替换。
 */
export interface ResourcePreviewPanelAPI {
  showResource(category: ResourceCategory, item: ResourcePreviewItem): void; // 展示指定资源
  clearPreview(): void; // 清空预览
  getCurrentPreviewType(): 'image' | 'audio' | null; // 返回当前预览类型
  destroy(): void; // 销毁内部对象
}

/**
 * 右侧预览面板：图片通过 Phaser 图像对象展示，音频则使用 DOM 音频控件。
 * 不进行任何二进制导出，仅根据路径引用资源。
 */
export class ResourcePreviewPanel implements ResourcePreviewPanelAPI {
  private readonly scene: Phaser.Scene; // 保存场景引用
  private readonly bounds: { x: number; y: number; width: number; height: number }; // 区域定义
  private readonly root: Phaser.GameObjects.Container; // 根容器
  private readonly background: Phaser.GameObjects.Rectangle; // 背景矩形
  private readonly pathText: Phaser.GameObjects.Text; // 显示路径的文本
  private readonly typeText: Phaser.GameObjects.Text; // 显示类型标签
  private currentImage?: Phaser.GameObjects.Image; // 当前展示的图片
  private audioDom?: Phaser.GameObjects.DOMElement; // 使用DOMElement承载音频控件
  private audioElement?: HTMLAudioElement; // 真正的音频元素
  private readonly textureKeyMap: Map<string, string> = new Map(); // 记录路径与纹理键映射
  private currentPreviewType: 'image' | 'audio' | null = null; // 当前展示类型
  private currentPath: string | null = null; // 当前展示资源路径

  public constructor(config: ResourcePreviewPanelConfig) {
    this.scene = config.scene;
    this.bounds = config.bounds;

    this.root = this.scene.add.container(this.bounds.x, this.bounds.y); // 创建容器
    this.background = this.scene.add.rectangle(0, 0, this.bounds.width, this.bounds.height, 0x000000, 0.55);
    this.background.setOrigin(0, 0);
    this.background.setStrokeStyle(1, 0xffffff, 0.2);
    this.root.add(this.background);

    this.pathText = this.scene.add.text(8, 8, '选择资源以查看预览', {
      fontFamily: 'sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      wordWrap: { width: this.bounds.width - 16 },
    });
    this.root.add(this.pathText);

    this.typeText = this.scene.add.text(8, 40, '', {
      fontFamily: 'sans-serif',
      fontSize: '12px',
      color: '#ffeeaa',
    });
    this.root.add(this.typeText);
  }

  /**
   * 将指定资源显示在预览区域，根据类别选择对应的处理方式。
   */
  public showResource(category: ResourceCategory, item: ResourcePreviewItem): void {
    if (category === 'images') {
      this.showImage(item);
    } else {
      this.showAudio(item);
    }
  }

  /**
   * 清空预览内容：销毁图片并暂停音频。
   */
  public clearPreview(): void {
    this.clearImage();
    this.hideAudio();
    this.pathText.setText('选择资源以查看预览');
    this.typeText.setText('');
    this.currentPreviewType = null;
    this.currentPath = null;
  }

  /**
   * 返回当前预览类型，主要用于单元测试。
   */
  public getCurrentPreviewType(): 'image' | 'audio' | null {
    return this.currentPreviewType;
  }

  /**
   * 销毁所有创建的对象与 DOM 元素。
   */
  public destroy(): void {
    this.clearImage();
    this.hideAudio(true);
    this.pathText.destroy();
    this.typeText.destroy();
    this.background.destroy();
    this.root.destroy();
  }

  /**
   * 图片预览：按需加载并缩放到面板内。
   */
  private showImage(item: ResourcePreviewItem): void {
    this.hideAudio(); // 切换到图片时暂停音频
    const key = this.getTextureKey(item.path);
    if (this.scene.textures.exists(key)) {
      this.displayImage(key, item);
      return;
    }

    if (this.scene.load.isLoading()) {
      this.scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        if (this.scene.textures.exists(key)) {
          this.displayImage(key, item);
        } else {
          this.showImage(item);
        }
      });
      return;
    }

    this.scene.load.image(key, item.path); // 动态加载图片
    const onFileComplete = (loadedKey: string, fileType: string) => {
      if (loadedKey === key && fileType === 'image') {
        this.scene.load.off(Phaser.Loader.Events.FILE_COMPLETE, onFileComplete);
        this.displayImage(key, item);
      }
    };
    this.scene.load.on(Phaser.Loader.Events.FILE_COMPLETE, onFileComplete);
    this.scene.load.start();
  }

  /**
   * 使用已加载的纹理创建图片对象，并根据面板尺寸调整缩放。
   */
  private displayImage(textureKey: string, item: ResourcePreviewItem): void {
    this.clearImage();
    const image = this.scene.add.image(this.bounds.width / 2, this.bounds.height / 2 + 20, textureKey);
    image.setOrigin(0.5, 0.5);
    this.root.add(image);

    const texture = this.scene.textures.get(textureKey);
    const source = texture.getSourceImage() as { width: number; height: number };
    const maxWidth = this.bounds.width - 24;
    const maxHeight = this.bounds.height - 96;
    const width = source?.width ?? maxWidth;
    const height = source?.height ?? maxHeight;
    const scale = Math.min(maxWidth / width, maxHeight / height, 1);
    image.setScale(scale);

    this.currentImage = image;
    this.updateLabels(item, '图像');
    this.currentPreviewType = 'image';
    this.currentPath = item.path;
  }

  /**
   * 预览音频：创建或更新 HTMLAudioElement，并通过 DOMElement 嵌入场景。
   */
  private showAudio(item: ResourcePreviewItem): void {
    this.clearImage();
    const { element, dom } = this.ensureAudioElement();
    element.pause();
    element.src = item.path;
    element.load();
    dom.setVisible(true);
    this.updateLabels(item, '音频');
    this.currentPreviewType = 'audio';
    this.currentPath = item.path;
  }

  /**
   * 更新顶部文本，显示路径和类型。
   */
  private updateLabels(item: ResourcePreviewItem, typeLabel: string): void {
    this.pathText.setText(`路径：${item.path}`);
    this.typeText.setText(`类型：${typeLabel} / ${item.type}`);
  }

  /**
   * 确保音频 DOMElement 已创建，如未创建则生成新的元素并添加到场景。
   */
  private ensureAudioElement(): { element: HTMLAudioElement; dom: Phaser.GameObjects.DOMElement } {
    if (this.audioElement && this.audioDom) {
      return { element: this.audioElement, dom: this.audioDom };
    }
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.preload = 'none';
    audio.controlsList = 'nodownload noplaybackrate';
    audio.classList.add('resource-browser-audio');

    const dom = this.scene.add.dom(this.bounds.width / 2, this.bounds.height - 40, audio);
    dom.setOrigin(0.5, 0.5);
    this.root.add(dom);

    this.audioElement = audio;
    this.audioDom = dom;
    return { element: audio, dom };
  }

  /**
   * 暂停并隐藏音频播放控件，若 force 为 true 则彻底销毁。
   */
  private hideAudio(force = false): void {
    if (!this.audioElement || !this.audioDom) {
      return;
    }
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    if (force) {
      this.audioDom.destroy();
      this.audioElement = undefined;
      this.audioDom = undefined;
    } else {
      this.audioDom.setVisible(false);
    }
  }

  /**
   * 清理当前图片对象。
   */
  private clearImage(): void {
    if (this.currentImage) {
      this.currentImage.destroy();
      this.currentImage = undefined;
    }
  }

  /**
   * 根据路径生成或获取纹理键，避免重复加载。
   */
  private getTextureKey(path: string): string {
    const existing = this.textureKeyMap.get(path);
    if (existing) {
      return existing;
    }
    const key = `resource-preview-${this.textureKeyMap.size}`;
    this.textureKeyMap.set(path, key);
    return key;
  }

  /**
   * 返回当前正在展示的资源路径，供调试或测试使用。
   */
  public getCurrentPath(): string | null {
    return this.currentPath;
  }
}

