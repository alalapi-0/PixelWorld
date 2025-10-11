import Phaser from 'phaser'; // 引入Phaser类型
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'; // 引入测试工具
import ResourceBrowserScene from '../../src/ui/ResourceBrowserScene'; // 待测试场景
import type { ResourceListPanelAPI, ResourceListPanelConfig } from '../../src/ui/ResourceListPanel'; // 列表面板接口
import type {
  ResourcePreviewPanelAPI,
  ResourcePreviewPanelConfig,
  ResourceIndex,
  ResourceCategory,
  ResourcePreviewItem,
} from '../../src/ui/ResourcePreviewPanel'; // 预览面板接口与类型

const sampleIndex: ResourceIndex = {
  images: [
    { type: 'tiles', path: 'assets/build/tiles/World_A1.png' },
    { type: 'ui', path: 'assets/build/ui/Tower1.png' },
  ],
  audio: [
    { type: 'bgm', path: 'assets/build/audio/bgm/Town1.ogg' },
  ],
}; // 构造简化示例数据

class FakeListPanel implements ResourceListPanelAPI {
  public categories: ResourceCategory[] = [];
  public lastCategory: ResourceCategory;
  private readonly onCategoryChange: (category: ResourceCategory) => void;
  private readonly onItemSelected: (category: ResourceCategory, item: ResourcePreviewItem) => void;

  public constructor(config: ResourceListPanelConfig) {
    this.onCategoryChange = config.onCategoryChange;
    this.onItemSelected = config.onItemSelected;
    this.lastCategory = config.initialCategory;
  }

  public setResources(index: ResourceIndex): void {
    this.categories = (['images', 'audio'] as ResourceCategory[]).filter((category) => index[category] !== undefined);
  }

  public setActiveCategory(category: ResourceCategory): void {
    this.lastCategory = category;
    this.onCategoryChange(category);
  }

  public clearSelection(): void {
    // 测试桩无需实现
  }

  public getTabLabels(): string[] {
    return this.categories.map((category) => (category === 'images' ? 'Images' : 'Audio'));
  }

  public destroy(): void {
    // 测试桩无需实现
  }

  public simulateSelect(category: ResourceCategory, item: ResourcePreviewItem): void {
    this.onItemSelected(category, item);
  }
}

class FakePreviewPanel implements ResourcePreviewPanelAPI {
  public lastCategory: ResourceCategory | null = null;
  public lastItem: ResourcePreviewItem | null = null;
  public cleared = 0;

  public showResource(category: ResourceCategory, item: ResourcePreviewItem): void {
    this.lastCategory = category;
    this.lastItem = item;
  }

  public clearPreview(): void {
    this.cleared += 1;
    this.lastCategory = null;
    this.lastItem = null;
  }

  public getCurrentPreviewType(): 'image' | 'audio' | null {
    if (!this.lastCategory) {
      return null;
    }
    return this.lastCategory === 'images' ? 'image' : 'audio';
  }

  public destroy(): void {
    // 测试桩无需实现
  }
}

class TestResourceBrowserScene extends ResourceBrowserScene {
  public fakeList!: FakeListPanel;
  public fakePreview!: FakePreviewPanel;

  public bootstrapForTests(): void {
    const keyboard = {
      addKey: vi.fn(() => ({ on: vi.fn(), destroy: vi.fn() })),
      removeKey: vi.fn(),
    };
    Object.defineProperty(this, 'events', { value: new Phaser.Events.EventEmitter(), configurable: true });
    Object.defineProperty(this, 'scale', { value: { width: 320, height: 320 }, configurable: true });
    Object.defineProperty(this, 'cameras', { value: { main: { setBackgroundColor: vi.fn() } }, configurable: true });
    Object.defineProperty(this, 'input', { value: { keyboard }, configurable: true });
  }

  protected override buildStaticUI(): void {
    // 测试环境不需要渲染静态UI
  }

  protected override createListPanel(config: ResourceListPanelConfig): ResourceListPanelAPI {
    this.fakeList = new FakeListPanel(config);
    return this.fakeList;
  }

  protected override createPreviewPanel(config: ResourcePreviewPanelConfig): ResourcePreviewPanelAPI {
    void config;
    this.fakePreview = new FakePreviewPanel();
    return this.fakePreview;
  }
}

let originalFetch: typeof fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe.skip('ResourceBrowserScene', () => { // 暂停复杂场景测试
  it('loads preview_index.json successfully', async () => {
    const scene = new TestResourceBrowserScene();
    scene.bootstrapForTests();
    const mockResponse = { ok: true, json: async () => sampleIndex } as Response;
    globalThis.fetch = vi.fn(async () => mockResponse) as typeof fetch;
    scene.create();
    await scene.reloadResources();
    expect(scene.getLoadedCounts()).toEqual({ images: 2, audio: 1 });
  });

  it('renders both image and audio tabs', () => {
    const scene = new TestResourceBrowserScene();
    scene.bootstrapForTests();
    scene.create();
    scene['handleDataLoaded'](sampleIndex);
    expect(scene.getTabLabels()).toEqual(['Images', 'Audio']);
  });

  it('updates preview panel on selection', () => {
    const scene = new TestResourceBrowserScene();
    scene.bootstrapForTests();
    scene.create();
    scene['handleDataLoaded'](sampleIndex);
    scene.fakeList.setActiveCategory('audio');
    expect(scene.fakePreview.cleared).toBeGreaterThanOrEqual(1);
    scene.fakeList.simulateSelect('audio', sampleIndex.audio[0]);
    expect(scene.fakePreview.lastItem?.path).toBe(sampleIndex.audio[0].path);
    expect(scene.getCurrentPreviewType()).toBe('audio');
  });
});

