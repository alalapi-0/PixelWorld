import './styles/resource_manager.css'; // 引入样式文件
import type { ResourceListItem } from './ListPanel'; // 引入列表项类型供复用

export interface DetailPanelHandlers { // 定义回调接口
  onSave: (payload: { item: ResourceListItem; tags: string[]; description: string }) => void; // 保存元数据
  onRequestAi: (item: ResourceListItem) => Promise<string>; // 请求AI建议
} // 接口结束

export class DetailPanel { // 定义详情面板类
  private readonly root: HTMLDivElement; // 根容器
  private readonly title: HTMLHeadingElement; // 标题元素
  private readonly preview: HTMLDivElement; // 预览容器
  private readonly tagList: HTMLDivElement; // 标签列表容器
  private readonly tagInput: HTMLInputElement; // 标签输入框
  private readonly descriptionArea: HTMLTextAreaElement; // 描述文本域
  private readonly saveButton: HTMLButtonElement; // 保存按钮
  private readonly aiButton: HTMLButtonElement; // AI按钮
  private currentItem: ResourceListItem | null = null; // 当前条目
  private currentTags: string[] = []; // 当前标签
  private handlers?: DetailPanelHandlers; // 回调引用

  public constructor(container: HTMLElement) { // 构造函数
    this.root = document.createElement('div'); // 创建根容器
    this.root.className = 'resource-manager-detail'; // 设置样式
    container.appendChild(this.root); // 挂载面板

    this.title = document.createElement('h3'); // 创建标题
    this.title.textContent = '请选择资源'; // 初始文案
    this.root.appendChild(this.title); // 添加标题

    this.preview = document.createElement('div'); // 创建预览容器
    this.preview.className = 'resource-manager-preview'; // 设置样式
    this.root.appendChild(this.preview); // 添加容器

    const tagSection = document.createElement('div'); // 创建标签区域
    const tagHeader = document.createElement('div'); // 创建标签标题
    tagHeader.textContent = '标签'; // 设置文本
    tagSection.appendChild(tagHeader); // 添加标题

    this.tagList = document.createElement('div'); // 创建标签列表
    this.tagList.className = 'resource-manager-tag-list'; // 设置样式
    tagSection.appendChild(this.tagList); // 添加列表

    const tagInputRow = document.createElement('div'); // 创建输入行
    tagInputRow.style.display = 'flex'; // 使用flex
    tagInputRow.style.gap = '6px'; // 设置间距
    this.tagInput = document.createElement('input'); // 创建输入框
    this.tagInput.placeholder = '输入新标签后回车'; // 设置提示
    this.tagInput.addEventListener('keydown', (event) => { // 绑定键盘事件
      if (event.key === 'Enter') { // 判断是否回车
        event.preventDefault(); // 阻止默认行为
        this.appendTagFromInput(); // 添加标签
      } // 条件结束
    }); // 事件结束
    tagInputRow.appendChild(this.tagInput); // 添加输入框

    const tagAddButton = document.createElement('button'); // 创建添加按钮
    tagAddButton.textContent = '添加'; // 设置文本
    tagAddButton.addEventListener('click', () => this.appendTagFromInput()); // 绑定点击
    tagInputRow.appendChild(tagAddButton); // 添加按钮

    tagSection.appendChild(tagInputRow); // 将输入行加入区域
    this.root.appendChild(tagSection); // 添加整个标签区域

    const descriptionLabel = document.createElement('label'); // 创建描述标题
    descriptionLabel.textContent = '描述'; // 设置文本
    this.root.appendChild(descriptionLabel); // 添加标题

    this.descriptionArea = document.createElement('textarea'); // 创建描述输入
    this.descriptionArea.rows = 6; // 设置行数
    this.root.appendChild(this.descriptionArea); // 添加文本域

    const buttonRow = document.createElement('div'); // 创建按钮行
    buttonRow.style.display = 'flex'; // 使用flex
    buttonRow.style.gap = '8px'; // 设置间距

    this.saveButton = document.createElement('button'); // 创建保存按钮
    this.saveButton.textContent = '保存元数据'; // 设置文本
    this.saveButton.addEventListener('click', () => this.handleSave()); // 绑定点击
    buttonRow.appendChild(this.saveButton); // 添加按钮

    this.aiButton = document.createElement('button'); // 创建AI按钮
    this.aiButton.textContent = 'AI 建议（离线规则）'; // 设置文本
    this.aiButton.addEventListener('click', () => this.handleAi()); // 绑定点击
    buttonRow.appendChild(this.aiButton); // 添加按钮

    this.root.appendChild(buttonRow); // 添加按钮行
  } // 构造结束

  public setHandlers(handlers: DetailPanelHandlers): void { // 注入回调
    this.handlers = handlers; // 存储回调
  } // 方法结束

  public showItem(item: ResourceListItem | null, tags: string[], description: string): void { // 展示条目
    this.currentItem = item; // 保存引用
    this.currentTags = [...tags]; // 复制标签
    if (!item) { // 若为空
      this.title.textContent = '请选择资源'; // 更新标题
      this.preview.innerHTML = '<span>暂无预览</span>'; // 显示提示
      this.renderTags(); // 渲染空标签
      this.descriptionArea.value = ''; // 清空描述
      return; // 结束
    } // 条件结束
    this.title.textContent = `${item.type.toUpperCase()} · ${item.path}`; // 更新标题
    this.renderPreview(item); // 渲染预览
    this.renderTags(); // 渲染标签
    this.descriptionArea.value = description; // 设置描述
  } // 方法结束

  private renderPreview(item: ResourceListItem): void { // 渲染预览
    this.preview.innerHTML = ''; // 清空旧内容
    if (item.type === 'images') { // 如果是图像
      const img = document.createElement('img'); // 创建图片
      img.src = item.path; // 指定路径
      img.alt = item.name; // 设置提示
      this.preview.appendChild(img); // 添加图片
    } else { // 否则视为音频
      const audio = document.createElement('audio'); // 创建音频控件
      audio.controls = true; // 启用控制条
      audio.src = item.path; // 指定路径
      this.preview.appendChild(audio); // 添加控件
    } // 条件结束
  } // 方法结束

  private renderTags(): void { // 渲染标签列表
    this.tagList.innerHTML = ''; // 清空容器
    this.currentTags.forEach((tag) => { // 遍历标签
      const tagItem = document.createElement('div'); // 创建标签元素
      tagItem.className = 'resource-manager-tag'; // 设置样式
      const text = document.createElement('span'); // 创建文本节点
      text.textContent = tag; // 设置文本
      tagItem.appendChild(text); // 添加文本
      const remove = document.createElement('button'); // 创建删除按钮
      remove.textContent = '×'; // 设置符号
      remove.addEventListener('click', () => { // 绑定点击
        this.currentTags = this.currentTags.filter((entry) => entry !== tag); // 移除标签
        this.renderTags(); // 重新渲染
      }); // 事件结束
      tagItem.appendChild(remove); // 添加按钮
      this.tagList.appendChild(tagItem); // 将标签加入列表
    }); // 循环结束
  } // 方法结束

  private appendTagFromInput(): void { // 通过输入框添加标签
    const value = this.tagInput.value.trim(); // 读取输入
    if (!value) { // 如果为空
      return; // 直接返回
    } // 条件结束
    if (!this.currentTags.includes(value)) { // 如果尚未存在
      this.currentTags.push(value); // 添加标签
      this.renderTags(); // 刷新列表
    } // 条件结束
    this.tagInput.value = ''; // 清空输入框
  } // 方法结束

  private handleSave(): void { // 处理保存操作
    if (!this.currentItem || !this.handlers) { // 若缺少条目或回调
      return; // 直接返回
    } // 条件结束
    const payload = { // 组装数据
      item: this.currentItem, // 当前条目
      tags: [...this.currentTags], // 当前标签
      description: this.descriptionArea.value.trim(), // 描述文本
    }; // 对象结束
    this.handlers.onSave(payload); // 调用回调
  } // 方法结束

  private async handleAi(): Promise<void> { // 处理AI建议
    if (!this.currentItem || !this.handlers) { // 若缺少必要信息
      return; // 直接返回
    } // 条件结束
    const suggestion = await this.handlers.onRequestAi(this.currentItem); // 调用外部AI
    if (suggestion) { // 如果返回文本
      this.descriptionArea.value = suggestion; // 填充描述
    } // 条件结束
  } // 方法结束
} // 类结束
