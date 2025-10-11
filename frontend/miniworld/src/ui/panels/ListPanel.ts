import './styles/resource_manager.css'; // 引入样式确保布局一致

export interface ResourceListItem { // 定义列表项数据结构
  key: string; // 唯一键值
  type: 'images' | 'audio'; // 资源域
  path: string; // 完整路径
  name: string; // 文件名
  tags: string[]; // 已有标签
} // 接口结束

export interface ListPanelHandlers { // 定义事件回调
  onSelectionChange: (item: ResourceListItem | null) => void; // 单选变化
  onBulkAddTag: (items: ResourceListItem[], tag: string) => void; // 批量添加标签
  onBulkAddCollection: (items: ResourceListItem[], collection: string) => void; // 批量加入集合
} // 接口结束

export class ListPanel { // 定义列表面板类
  private readonly root: HTMLDivElement; // 根容器
  private readonly actions: HTMLDivElement; // 批量操作容器
  private readonly scroll: HTMLDivElement; // 滚动区域
  private items: ResourceListItem[] = []; // 当前列表数据
  private selectedKeys: Set<string> = new Set(); // 当前选中项集合
  private activeKey: string | null = null; // 用于高亮的主选项

  public constructor(container: HTMLElement, private readonly handlers: ListPanelHandlers) { // 构造函数
    this.root = document.createElement('div'); // 创建根容器
    this.root.className = 'resource-manager-list'; // 应用样式
    container.appendChild(this.root); // 挂载到父容器

    const header = document.createElement('div'); // 创建标题容器
    header.textContent = '资源列表'; // 设置标题
    this.root.appendChild(header); // 添加到面板

    this.actions = document.createElement('div'); // 创建操作区域
    this.actions.className = 'resource-manager-actions'; // 设置样式
    this.root.appendChild(this.actions); // 添加到面板

    const tagButton = document.createElement('button'); // 创建批量标签按钮
    tagButton.textContent = '批量添加标签'; // 设置文本
    tagButton.addEventListener('click', () => this.requestBulkTag()); // 绑定点击事件
    this.actions.appendChild(tagButton); // 添加按钮

    const collectionButton = document.createElement('button'); // 创建批量集合按钮
    collectionButton.textContent = '批量加入集合'; // 设置文本
    collectionButton.addEventListener('click', () => this.requestBulkCollection()); // 绑定事件
    this.actions.appendChild(collectionButton); // 添加按钮

    this.scroll = document.createElement('div'); // 创建滚动容器
    this.scroll.className = 'resource-manager-list-scroll'; // 设置样式
    this.root.appendChild(this.scroll); // 添加到面板
  } // 构造结束

  public setItems(items: ResourceListItem[]): void { // 更新列表数据
    this.items = items; // 存储数据
    const existing = new Set(this.selectedKeys); // 保留当前选择
    this.selectedKeys = new Set(items.filter((item) => existing.has(item.key)).map((item) => item.key)); // 交叉保留
    if (this.activeKey && !this.selectedKeys.has(this.activeKey)) { // 如果当前高亮不在列表
      this.activeKey = null; // 重置主选项
    } // 条件结束
    this.render(); // 重新渲染
  } // 方法结束

  public getSelectedItems(): ResourceListItem[] { // 暴露当前选中项
    return this.items.filter((item) => this.selectedKeys.has(item.key)); // 根据集合过滤
  } // 方法结束

  public clearSelection(): void { // 清空选择
    this.selectedKeys.clear(); // 清除集合
    this.activeKey = null; // 重置主选
    this.render(); // 刷新界面
    this.handlers.onSelectionChange(null); // 通知外部
  } // 方法结束

  private render(): void { // 渲染列表
    this.scroll.innerHTML = ''; // 清空旧内容
    this.items.forEach((item) => { // 遍历资源
      const row = document.createElement('div'); // 创建行
      row.className = 'resource-manager-row'; // 设置样式
      if (item.key === this.activeKey) { // 如果为主选项
        row.classList.add('active'); // 添加高亮
      } // 条件结束

      const checkbox = document.createElement('input'); // 创建复选框
      checkbox.type = 'checkbox'; // 设置类型
      checkbox.checked = this.selectedKeys.has(item.key); // 恢复选中状态
      checkbox.addEventListener('change', () => { // 监听变化
        if (checkbox.checked) { // 如果勾选
          this.selectedKeys.add(item.key); // 加入集合
        } else { // 否则
          this.selectedKeys.delete(item.key); // 移除集合
        } // 条件结束
        this.handlers.onSelectionChange(this.resolveActiveItem()); // 通知外部当前主选
      }); // 事件结束
      row.appendChild(checkbox); // 添加复选框

      const name = document.createElement('div'); // 创建名称元素
      name.textContent = item.name; // 显示文件名
      name.style.flex = '1'; // 占据剩余空间
      row.appendChild(name); // 添加名称

      const typeBadge = document.createElement('span'); // 创建类型徽章
      typeBadge.className = 'resource-manager-badge'; // 设置样式
      typeBadge.textContent = item.type === 'audio' ? '音频' : '图像'; // 设置文本
      row.appendChild(typeBadge); // 添加徽章

      const tagBadge = document.createElement('span'); // 创建标签数量徽章
      tagBadge.className = 'resource-manager-badge'; // 设置样式
      tagBadge.textContent = `${item.tags.length} 标签`; // 显示数量
      row.appendChild(tagBadge); // 添加徽章

      row.addEventListener('click', () => { // 监听整行点击
        this.activeKey = item.key; // 设置主选项
        this.selectedKeys.add(item.key); // 确保选中
        this.handlers.onSelectionChange(item); // 通知外部
        this.render(); // 重新渲染以更新高亮
      }); // 事件结束

      this.scroll.appendChild(row); // 将行加入列表
    }); // 循环结束
  } // 方法结束

  private resolveActiveItem(): ResourceListItem | null { // 根据activeKey返回对象
    if (!this.activeKey) { // 如果尚未设置主选项
      return null; // 返回空
    } // 条件结束
    return this.items.find((item) => item.key === this.activeKey) ?? null; // 查找对应项
  } // 方法结束

  private requestBulkTag(): void { // 处理批量标签请求
    const items = this.getSelectedItems(); // 获取选中项
    if (items.length === 0) { // 无选择时
      alert('请先选择要标记的资源'); // 提示用户
      return; // 终止
    } // 条件结束
    const tag = window.prompt('输入要添加的标签'); // 弹出输入框
    if (!tag) { // 若未输入
      return; // 直接返回
    } // 条件结束
    this.handlers.onBulkAddTag(items, tag.trim()); // 调用回调
  } // 方法结束

  private requestBulkCollection(): void { // 处理批量集合请求
    const items = this.getSelectedItems(); // 获取选中项
    if (items.length === 0) { // 无选择时
      alert('请先选择要加入集合的资源'); // 提示用户
      return; // 终止
    } // 条件结束
    const name = window.prompt('输入集合名称'); // 弹出输入框
    if (!name) { // 若未输入
      return; // 直接返回
    } // 条件结束
    this.handlers.onBulkAddCollection(items, name.trim()); // 调用回调
  } // 方法结束
} // 类结束
