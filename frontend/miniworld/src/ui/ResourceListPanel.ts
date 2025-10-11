import Phaser from 'phaser'; // 引入Phaser框架供类型与运行时使用
import type { ResourceCategory, ResourceIndex, ResourcePreviewItem } from './ResourcePreviewPanel'; // 引入共享类型，保持数据结构一致

/**
 * 定义左侧列表面板创建所需的配置。包含基本布局信息以及事件回调。
 * scene       -> 当前所属的场景实例，便于创建文本与容器。
 * bounds      -> 面板的矩形区域，使用像素坐标描述。
 * initialCategory -> 初始选中的类别（images 或 audio）。
 * onCategoryChange -> 当用户切换标签页时触发。
 * onItemSelected   -> 当用户点击具体资源文件时触发。
 */
export interface ResourceListPanelConfig {
  scene: Phaser.Scene;
  bounds: { x: number; y: number; width: number; height: number };
  initialCategory: ResourceCategory;
  onCategoryChange: (category: ResourceCategory) => void;
  onItemSelected: (category: ResourceCategory, item: ResourcePreviewItem) => void;
}

/**
 * 定义面板对外暴露的最小接口，方便测试替换或模拟。
 */
export interface ResourceListPanelAPI {
  setResources(index: ResourceIndex): void; // 传入解析好的索引数据
  setActiveCategory(category: ResourceCategory): void; // 切换当前标签
  clearSelection(): void; // 清空当前选择
  getTabLabels(): string[]; // 返回当前标签文本，用于测试验证
  destroy(): void; // 销毁内部生成的Phaser对象
}

/**
 * 列表面板负责展示两类资源（图片 / 音频）的文件名，
 * 并在用户选择时通过回调通知场景。所有显示元素使用Phaser文本与容器生成，
 * 不缓存或修改二进制文件，仅依赖 JSON 数据中的路径。
 */
export class ResourceListPanel implements ResourceListPanelAPI {
  private readonly scene: Phaser.Scene; // 保存场景引用方便创建元素
  private readonly bounds: { x: number; y: number; width: number; height: number }; // 面板区域
  private readonly onCategoryChange: (category: ResourceCategory) => void; // 标签切换回调
  private readonly onItemSelected: (category: ResourceCategory, item: ResourcePreviewItem) => void; // 项目选择回调
  private readonly root: Phaser.GameObjects.Container; // 根容器用于整体控制
  private readonly tabTexts: { category: ResourceCategory; label: Phaser.GameObjects.Text }[] = []; // 标签文本集合
  private entryTexts: Phaser.GameObjects.Text[] = []; // 文件名文本集合
  private resources: ResourceIndex = { images: [], audio: [] }; // 当前资源索引
  private activeCategory: ResourceCategory; // 当前激活的类别
  private selectedPath: string | null = null; // 当前选中的资源路径

  public constructor(config: ResourceListPanelConfig) {
    this.scene = config.scene;
    this.bounds = config.bounds;
    this.onCategoryChange = config.onCategoryChange;
    this.onItemSelected = config.onItemSelected;
    this.activeCategory = config.initialCategory;

    // 创建根容器并配置基础外观
    this.root = this.scene.add.container(this.bounds.x, this.bounds.y); // 创建容器
    const bg = this.scene.add.rectangle(0, 0, this.bounds.width, this.bounds.height, 0x000000, 0.55); // 背景矩形
    bg.setOrigin(0, 0); // 左上角为原点
    bg.setStrokeStyle(1, 0xffffff, 0.2); // 轻微描边便于区分
    this.root.add(bg); // 背景加入容器

    // 面板标题
    const title = this.scene.add.text(8, 8, '资源类别', {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      color: '#ffeeaa',
    }); // 添加标题
    this.root.add(title);

    this.createTabs(); // 初始化标签
  }

  /**
   * 根据当前数据创建 Images 与 Audio 两个标签，并绑定点击事件。
   */
  private createTabs(): void {
    const tabNames: { category: ResourceCategory; label: string }[] = [
      { category: 'images', label: 'Images' },
      { category: 'audio', label: 'Audio' },
    ];
    const startX = 8; // 标签起始X
    const startY = 32; // 标签起始Y
    const gap = 70; // 标签间隔

    tabNames.forEach((tab, index) => {
      const text = this.scene.add.text(startX + index * gap, startY, tab.label, {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color: '#cccccc',
      }); // 创建标签文本
      text.setInteractive({ useHandCursor: true }); // 开启交互
      text.on('pointerdown', () => {
        if (this.activeCategory !== tab.category) {
          this.setActiveCategory(tab.category); // 切换类别
        }
      }); // 点击事件
      this.root.add(text); // 添加到容器
      this.tabTexts.push({ category: tab.category, label: text }); // 保存引用
    });
    this.updateTabStyles(); // 初始化高亮样式
  }

  /**
   * 更新标签高亮状态，确保当前类别以亮色显示。
   */
  private updateTabStyles(): void {
    this.tabTexts.forEach((entry) => {
      if (entry.category === this.activeCategory) {
        entry.label.setStyle({ color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.15)' });
      } else {
        entry.label.setStyle({ color: '#cccccc', backgroundColor: undefined });
      }
    });
  }

  /**
   * 将解析后的资源索引传入面板，随后刷新列表。
   */
  public setResources(index: ResourceIndex): void {
    this.resources = index;
    this.renderList(); // 刷新当前列表
  }

  /**
   * 刷新当前类别对应的文件名列表。
   */
  private renderList(): void {
    this.entryTexts.forEach((text) => text.destroy()); // 清理旧文本
    this.entryTexts = []; // 重置列表

    const list = this.resources[this.activeCategory] ?? []; // 读取当前类别数组
    const startX = 8;
    const startY = 64;
    const lineHeight = 20;

    list.forEach((item, index) => {
      const fileName = item.path.split('/').pop() ?? item.path; // 提取文件名
      const label = this.scene.add.text(startX, startY + index * lineHeight, fileName, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#aaddff',
      }); // 创建文件名文本
      label.setInteractive({ useHandCursor: true }); // 开启点击
      label.on('pointerdown', () => {
        this.selectedPath = item.path; // 记录当前选择
        this.updateEntryStyles(); // 更新高亮
        this.onItemSelected(this.activeCategory, item); // 通知上层
      });
      label.setData('path', item.path); // 保存路径便于后续高亮
      this.root.add(label); // 加入容器
      this.entryTexts.push(label); // 保存引用
    });
    this.updateEntryStyles(); // 初次渲染时同步样式
  }

  /**
   * 更新文件名列表的高亮状态。
   */
  private updateEntryStyles(): void {
    this.entryTexts.forEach((label) => {
      const path = label.getData('path') as string | undefined;
      if (path && path === this.selectedPath) {
        label.setStyle({ color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.15)' });
      } else {
        label.setStyle({ color: '#aaddff', backgroundColor: undefined });
      }
    });
  }

  /**
   * 切换标签时调用，触发回调并刷新列表。
   */
  public setActiveCategory(category: ResourceCategory): void {
    this.activeCategory = category;
    this.selectedPath = null; // 清空选中状态
    this.updateTabStyles(); // 更新标签高亮
    this.renderList(); // 刷新列表内容
    this.onCategoryChange(category); // 通知场景
  }

  /**
   * 清空选中状态并刷新高亮。
   */
  public clearSelection(): void {
    this.selectedPath = null;
    this.updateEntryStyles();
  }

  /**
   * 返回标签文本内容，主要用于单元测试校验标签生成是否正确。
   */
  public getTabLabels(): string[] {
    return this.tabTexts.map((entry) => entry.label.text);
  }

  /**
   * 销毁面板内部生成的所有对象，避免内存泄露。
   */
  public destroy(): void {
    this.entryTexts.forEach((text) => text.destroy());
    this.tabTexts.forEach((entry) => entry.label.destroy());
    this.root.destroy();
  }
}

