import Phaser from 'phaser'; // 引入Phaser框架
import './styles/resource_manager.css'; // 引入素材管理器样式
import type { ResourceIndex, ResourcePreviewItem } from './ResourcePreviewPanel'; // 引入预览索引类型
import { FilterPanel, type FilterCriteria } from './panels/FilterPanel'; // 引入过滤面板
import { ListPanel, type ResourceListItem } from './panels/ListPanel'; // 引入列表面板
import { DetailPanel } from './panels/DetailPanel'; // 引入详情面板
import { MetadataStore, type StoreState } from '../core/MetadataStore'; // 引入元数据存取
import { AiDescribeStub } from '../core/AiDescribeStub'; // 引入AI占位

export interface ResourceManagerItem { // 定义资源管理器条目结构
  key: string; // 唯一键
  type: 'images' | 'audio'; // 分类域
  path: string; // 完整路径
  name: string; // 文件名
  searchText: string; // 搜索字段
} // 接口结束

export function deriveDomain(entry: ResourcePreviewItem): 'images' | 'audio' | null { // 根据条目推断域
  if (/\/audio\//.test(entry.path)) { // 如果路径包含audio
    return 'audio'; // 判定为音频
  } // 条件结束
  if (/\/images\//.test(entry.path)) { // 如果路径包含images
    return 'images'; // 判定为图像
  } // 条件结束
  return null; // 其余情况忽略
} // 函数结束

export function buildManagerItems(index: ResourceIndex, store: MetadataStore): ResourceManagerItem[] { // 从索引构建条目
  const items: ResourceManagerItem[] = []; // 初始化数组
  index.images?.forEach((entry) => { // 遍历图片
    const domain = deriveDomain(entry); // 推断域
    if (domain === 'images') { // 确认域有效
      const key = store.keyOf(entry); // 生成键
      const name = entry.path.split('/').pop() ?? entry.path; // 提取文件名
      items.push({ key, type: domain, path: entry.path, name, searchText: `${name.toLowerCase()} ${entry.path.toLowerCase()}` }); // 加入数组
    } // 条件结束
  }); // 循环结束
  index.audio?.forEach((entry) => { // 遍历音频
    const domain = deriveDomain(entry); // 推断域
    if (domain === 'audio') { // 确认域有效
      const key = store.keyOf(entry); // 生成键
      const name = entry.path.split('/').pop() ?? entry.path; // 提取文件名
      items.push({ key, type: domain, path: entry.path, name, searchText: `${name.toLowerCase()} ${entry.path.toLowerCase()}` }); // 加入数组
    } // 条件结束
  }); // 循环结束
  return items; // 返回结果
} // 函数结束

export function filterManagerItems(items: ResourceManagerItem[], metadata: StoreState, criteria: FilterCriteria): ResourceManagerItem[] { // 根据条件筛选
  return items.filter((item) => { // 使用数组过滤
    if (criteria.type !== 'all' && item.type !== criteria.type) { // 类型不匹配
      return false; // 排除
    } // 条件结束
    if (criteria.q) { // 若有关键字
      const query = criteria.q.toLowerCase(); // 转为小写
      if (!item.searchText.includes(query)) { // 如果不包含
        return false; // 排除
      } // 条件结束
    } // 条件结束
    if (criteria.tags.length > 0) { // 若选择标签
      const tags = metadata.tags[item.key] ?? []; // 获取标签
      const missing = criteria.tags.some((tag) => !tags.includes(tag)); // 判断是否缺少
      if (missing) { // 如果缺少
        return false; // 排除
      } // 条件结束
    } // 条件结束
    return true; // 保留条目
  }); // 过滤结束
} // 函数结束

export default class ResourceManagerScene extends Phaser.Scene { // 定义素材管理器场景
  private filterPanel?: FilterPanel; // 过滤面板引用
  private listPanel?: ListPanel; // 列表面板引用
  private detailPanel?: DetailPanel; // 详情面板引用
  private store!: MetadataStore; // 元数据存储实例
  private aiStub!: AiDescribeStub; // AI占位实例
  private items: ResourceManagerItem[] = []; // 全量条目
  private metadata: StoreState = { tags: {}, descriptions: {}, collections: {} }; // 当前元数据
  private currentSelection: string | null = null; // 当前选中的键
  private domRoot?: Phaser.GameObjects.DOMElement; // DOM容器引用
  private escKey?: Phaser.Input.Keyboard.Key; // ESC键引用

  public constructor() { // 构造函数
    super('ResourceManagerScene'); // 指定场景名称
  } // 构造结束

  public create(): void { // 创建生命周期
    console.info('✅ ResourceManager initialized (text-only)'); // 输出初始化日志
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0.75)'); // 设置背景
    this.createBackdrop(); // 创建背景矩形
    this.store = new MetadataStore(); // 实例化存储
    this.aiStub = new AiDescribeStub(); // 实例化AI占位
    this.buildPanels(); // 构建面板
    this.registerShutdown(); // 注册销毁钩子
    this.setupEscapeKey(); // 绑定ESC
    void this.loadData(); // 异步加载数据
  } // 方法结束

  private createBackdrop(): void { // 创建背景
    const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.6); // 创建矩形
    overlay.setOrigin(0, 0); // 设定原点
  } // 方法结束

  private buildPanels(): void { // 构建面板
    const rootElement = document.createElement('div'); // 创建根DOM
    rootElement.className = 'resource-manager-root'; // 设置样式
    this.domRoot = this.add.dom(0, 0, rootElement); // 创建Phaser DOM元素
    this.domRoot.setOrigin(0, 0); // 设定原点
    this.filterPanel = new FilterPanel(rootElement); // 实例化过滤面板
    this.listPanel = new ListPanel(rootElement, { // 实例化列表面板
      onSelectionChange: (item) => this.handleSelectionChange(item), // 绑定选择回调
      onBulkAddTag: (items, tag) => void this.handleBulkTag(items, tag), // 绑定批量标签
      onBulkAddCollection: (items, collection) => void this.handleBulkCollection(items, collection), // 绑定批量集合
    }); // 构造结束
    this.detailPanel = new DetailPanel(rootElement); // 实例化详情面板
    this.detailPanel.setHandlers({ // 绑定详情回调
      onSave: (payload) => void this.handleSaveMetadata(payload), // 保存回调
      onRequestAi: (item) => this.aiStub.suggestDescription({ type: item.type, path: item.path }), // AI回调
    }); // 设置结束
    this.filterPanel.setOnChange((criteria) => this.applyFilter(criteria)); // 绑定筛选变更
  } // 方法结束

  private async loadData(): Promise<void> { // 异步加载数据
    try { // 捕获异常
      const previewResponse = await fetch('assets/preview_index.json', { method: 'GET', cache: 'no-cache' }); // 读取预览索引
      if (!previewResponse.ok) { // 判断响应
        throw new Error(`preview_index.json ${previewResponse.status}`); // 抛出错误
      } // 条件结束
      const manifest = (await previewResponse.json()) as ResourceIndex; // 解析JSON
      this.metadata = await this.store.loadAll(); // 读取元数据
      console.info('✅ Metadata loaded/saved via JSON'); // 输出日志
      this.items = buildManagerItems(manifest, this.store); // 构建条目
      this.refreshAvailableTags(); // 更新标签选项
      this.applyFilter(this.filterPanel?.getCriteria() ?? { q: '', type: 'all', tags: [] }); // 首次过滤
      console.info('✅ No binary generated'); // 输出无二进制日志
    } catch (error) { // 捕获异常
      console.error('ResourceManagerScene loadData failed', error); // 输出错误
    } // 条件结束
  } // 方法结束

  private refreshAvailableTags(): void { // 更新标签选项
    if (!this.filterPanel) { // 如果面板未创建
      return; // 直接返回
    } // 条件结束
    const tagSet = new Set<string>(); // 创建集合
    Object.values(this.metadata.tags).forEach((tags) => tags.forEach((tag) => tagSet.add(tag))); // 收集标签
    this.filterPanel.setAvailableTags(Array.from(tagSet)); // 更新面板
  } // 方法结束

  private applyFilter(criteria: FilterCriteria): void { // 应用筛选
    const filtered = filterManagerItems(this.items, this.metadata, criteria); // 获取筛选结果
    const listItems: ResourceListItem[] = filtered.map((item) => ({ // 映射列表项
      key: item.key, // 复制键
      type: item.type, // 复制类型
      path: item.path, // 复制路径
      name: item.name, // 复制名称
      tags: this.metadata.tags[item.key] ?? [], // 读取标签
    })); // 映射结束
    this.listPanel?.setItems(listItems); // 更新列表
    if (this.currentSelection) { // 若存在选中
      const stillExists = listItems.find((entry) => entry.key === this.currentSelection); // 查找是否保留
      if (!stillExists) { // 如果不存在
        this.currentSelection = null; // 清空选中
        this.detailPanel?.showItem(null, [], ''); // 清空详情
      } // 条件结束
    } // 条件结束
  } // 方法结束

  private handleSelectionChange(item: ResourceListItem | null): void { // 处理选择变更
    this.currentSelection = item?.key ?? null; // 记录选中键
    const tags = item ? this.metadata.tags[item.key] ?? [] : []; // 获取标签
    const description = item ? this.metadata.descriptions[item.key] ?? '' : ''; // 获取描述
    this.detailPanel?.showItem(item, tags, description); // 更新详情
  } // 方法结束

  private async handleSaveMetadata(payload: { item: ResourceListItem; tags: string[]; description: string }): Promise<void> { // 保存元数据
    this.metadata.tags[payload.item.key] = payload.tags; // 更新标签映射
    this.metadata.descriptions[payload.item.key] = payload.description; // 更新描述映射
    await Promise.all([ // 并行写入
      this.store.saveTags(this.metadata.tags), // 保存标签
      this.store.saveDescriptions(this.metadata.descriptions), // 保存描述
    ]); // Promise结束
    console.info('✅ Metadata loaded/saved via JSON'); // 输出保存日志
    this.refreshAvailableTags(); // 更新标签列表
    this.applyFilter(this.filterPanel?.getCriteria() ?? { q: '', type: 'all', tags: [] }); // 刷新列表
  } // 方法结束

  private async handleBulkTag(items: ResourceListItem[], tag: string): Promise<void> { // 批量添加标签
    items.forEach((item) => { // 遍历条目
      const list = this.metadata.tags[item.key] ?? []; // 获取现有标签
      if (!list.includes(tag)) { // 若不存在
        list.push(tag); // 添加标签
        this.metadata.tags[item.key] = list; // 回写映射
      } // 条件结束
    }); // 循环结束
    await this.store.saveTags(this.metadata.tags); // 保存标签
    console.info('✅ Metadata loaded/saved via JSON'); // 输出保存日志
    this.refreshAvailableTags(); // 更新标签列表
    this.applyFilter(this.filterPanel?.getCriteria() ?? { q: '', type: 'all', tags: [] }); // 刷新列表
  } // 方法结束

  private async handleBulkCollection(items: ResourceListItem[], collection: string): Promise<void> { // 批量加入集合
    const trimmed = collection.trim(); // 处理空格
    if (!trimmed) { // 如果集合名为空
      return; // 直接返回
    } // 条件结束
    const existing = this.metadata.collections[trimmed] ?? []; // 获取现有集合
    const keys = new Set(existing); // 转换为集合
    items.forEach((item) => { // 遍历条目
      if (!keys.has(item.key)) { // 如果集合中没有
        existing.push(item.key); // 添加键
        keys.add(item.key); // 更新集合
      } // 条件结束
    }); // 循环结束
    this.metadata.collections[trimmed] = existing; // 回写集合
    await this.store.saveCollections(this.metadata.collections); // 保存集合
    console.info('✅ Metadata loaded/saved via JSON'); // 输出保存日志
  } // 方法结束

  private registerShutdown(): void { // 注册销毁逻辑
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { // 监听关闭
      this.domRoot?.destroy(); // 销毁DOM容器
      this.domRoot = undefined; // 重置引用
      this.filterPanel = undefined; // 清空面板
      this.listPanel = undefined; // 清空列表
      this.detailPanel = undefined; // 清空详情
      if (this.escKey) { // 如果存在ESC
        this.input.keyboard?.removeKey(this.escKey); // 移除键位
        this.escKey = undefined; // 清空引用
      } // 条件结束
    }); // 事件结束
  } // 方法结束

  private setupEscapeKey(): void { // 设置ESC关闭
    const keyboard = this.input.keyboard; // 获取键盘
    if (!keyboard) { // 若无键盘
      return; // 直接返回
    } // 条件结束
    this.escKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC); // 注册ESC键
    this.escKey.on('down', () => this.exitScene()); // 绑定按下事件
  } // 方法结束

  private exitScene(): void { // 退出场景
    this.scene.stop(); // 停止当前场景
    if (this.scene.isPaused('WorldScene')) { // 如果世界场景被暂停
      this.scene.resume('WorldScene'); // 恢复世界场景
    } else if (!this.scene.isActive('WorldScene')) { // 如果世界场景未激活
      this.scene.start('WorldScene'); // 启动世界场景
    } // 条件结束
  } // 方法结束
} // 类结束
