// 引入事件总线以触发手动热重载
import { emitAutoChanged } from '../../runtime/HotReloadBus'; // 使用热重载事件工具函数
// 引入批量加载器以便手动刷新数据
import { fetchAllAuto } from '../../config/AutoDataLoader'; // 使用批量加载函数

// 定义面板更新状态的接口
export interface HotbarStatus { // 描述面板可展示的状态信息
  blueprintVersion: string; // 蓝图版本号
  shopVersion: string; // 商店版本号
  questVersion: string; // 任务版本号
  lastChangedAt?: number; // 最近变更时间戳
  changedFiles?: string[]; // 最近变更文件列表
} // 接口结束

// 定义面板按钮回调接口
export interface HotbarDevPanelCallbacks { // 描述可注入的按钮回调
  onReload?: () => Promise<void> | void; // 手动重载回调
  onRollback?: () => Promise<void> | void; // 回滚回调
} // 接口结束

// 开发者面板实现，位于右上角显示热重载信息
export class HotbarDevPanel { // 声明开发者面板类
  private container: HTMLDivElement | null = null; // 保存根容器引用
  private status: HotbarStatus | null = null; // 保存当前状态
  private callbacks: HotbarDevPanelCallbacks; // 保存回调集合

  // 构造函数允许注入自定义回调
  public constructor(callbacks: HotbarDevPanelCallbacks = {}) { // 定义构造函数
    this.callbacks = callbacks; // 保存回调引用
  } // 构造结束

  // 将面板渲染到页面上
  public mount(): void { // 定义挂载方法
    if (typeof document === 'undefined') { // 若不存在文档对象
      return; // 直接返回
    } // 分支结束
    if (this.container) { // 若已挂载
      return; // 避免重复创建
    } // 分支结束
    const root = document.createElement('div'); // 创建容器元素
    root.style.position = 'fixed'; // 固定定位
    root.style.top = '12px'; // 顶部间距
    root.style.right = '12px'; // 右侧间距
    root.style.zIndex = '2000'; // 提升层级
    root.style.background = 'rgba(0, 0, 0, 0.7)'; // 设置背景色
    root.style.color = '#ffffff'; // 设置文字颜色
    root.style.fontSize = '12px'; // 设置字体大小
    root.style.padding = '8px'; // 设置内边距
    root.style.borderRadius = '6px'; // 设置圆角
    root.style.fontFamily = 'monospace'; // 使用等宽字体

    const title = document.createElement('div'); // 创建标题元素
    title.textContent = 'Auto Hot Reload'; // 设置标题文本
    title.style.fontWeight = 'bold'; // 加粗标题
    title.style.marginBottom = '4px'; // 设置下边距
    root.appendChild(title); // 将标题加入容器

    const statusLine = document.createElement('div'); // 创建状态行
    statusLine.dataset['role'] = 'status'; // 标记数据属性
    root.appendChild(statusLine); // 添加状态行

    const changedLine = document.createElement('div'); // 创建变更行
    changedLine.dataset['role'] = 'changed'; // 标记数据属性
    root.appendChild(changedLine); // 添加变更行

    const buttonRow = document.createElement('div'); // 创建按钮行
    buttonRow.style.marginTop = '6px'; // 设置上边距
    buttonRow.style.display = 'flex'; // 使用flex布局
    buttonRow.style.gap = '4px'; // 设置按钮间距
    root.appendChild(buttonRow); // 添加按钮行

    const reloadButton = document.createElement('button'); // 创建重载按钮
    reloadButton.textContent = '⟳ 热重载'; // 设置按钮文本
    reloadButton.style.cursor = 'pointer'; // 设置鼠标指针
    reloadButton.onclick = () => this.handleReload(); // 绑定点击事件
    buttonRow.appendChild(reloadButton); // 添加按钮

    const rollbackButton = document.createElement('button'); // 创建回滚按钮
    rollbackButton.textContent = '⏪ 回滚'; // 设置按钮文本
    rollbackButton.style.cursor = 'pointer'; // 设置鼠标指针
    rollbackButton.onclick = () => this.handleRollback(); // 绑定点击事件
    buttonRow.appendChild(rollbackButton); // 添加按钮

    document.body.appendChild(root); // 将容器添加到页面
    this.container = root; // 保存容器引用
    this.render(); // 初次渲染状态
  } // 方法结束

  // 更新面板状态
  public update(status: HotbarStatus): void { // 定义状态更新方法
    this.status = status; // 保存最新状态
    this.render(); // 重新渲染
  } // 方法结束

  // 内部方法：渲染面板内容
  private render(): void { // 定义渲染方法
    if (!this.container) { // 若尚未挂载
      return; // 直接返回
    } // 分支结束
    const statusLine = this.container.querySelector('div[data-role="status"]'); // 获取状态行
    const changedLine = this.container.querySelector('div[data-role="changed"]'); // 获取变更行
    if (statusLine && this.status) { // 若状态存在
      statusLine.textContent = `BP ${this.status.blueprintVersion} | Shop ${this.status.shopVersion} | Quest ${this.status.questVersion}`; // 更新状态文本
    } else if (statusLine) { // 若无状态
      statusLine.textContent = '等待数据'; // 显示占位文本
    } // 分支结束
    if (changedLine && this.status?.changedFiles?.length) { // 若有变更列表
      const time = this.status.lastChangedAt ? new Date(this.status.lastChangedAt).toLocaleTimeString() : '未知时间'; // 格式化时间
      changedLine.textContent = `${time}: ${this.status.changedFiles.join(', ')}`; // 显示文件列表
    } else if (changedLine) { // 若无变更信息
      changedLine.textContent = '暂无变更'; // 显示占位
    } // 分支结束
  } // 方法结束

  // 处理重载按钮点击
  private async handleReload(): Promise<void> { // 定义重载按钮处理函数
    if (this.callbacks.onReload) { // 若注入了自定义回调
      await this.callbacks.onReload(); // 调用回调
      return; // 结束流程
    } // 分支结束
    await fetchAllAuto(); // 触发一次批量加载以确保文件被读取
    emitAutoChanged({ changed: ['manual'], timestamp: Date.now() }); // 使用总线广播事件
  } // 方法结束

  // 处理回滚按钮点击
  private async handleRollback(): Promise<void> { // 定义回滚按钮处理函数
    if (this.callbacks.onRollback) { // 若注入自定义回调
      await this.callbacks.onRollback(); // 调用回调
      return; // 结束流程
    } // 分支结束
    console.warn('[HotbarDevPanel] rollback callback not configured'); // 输出警告提示未配置回调
  } // 方法结束
} // 类结束
