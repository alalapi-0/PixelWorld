import './styles/resource_manager.css'; // 引入样式确保控件风格一致

export type ResourceTypeFilter = 'all' | 'images' | 'audio'; // 定义类型筛选的取值范围

export interface FilterCriteria { // 定义筛选条件接口
  q: string; // 模糊搜索关键词
  type: ResourceTypeFilter; // 类型过滤
  tags: string[]; // 标签过滤
} // 接口结束

export type FilterChangeHandler = (criteria: FilterCriteria) => void; // 定义筛选回调类型

export class FilterPanel { // 定义过滤面板类
  private readonly root: HTMLDivElement; // 根容器
  private readonly searchInput: HTMLInputElement; // 搜索输入框
  private readonly typeSelect: HTMLSelectElement; // 类型选择框
  private readonly tagSelect: HTMLSelectElement; // 标签多选框
  private onChange?: FilterChangeHandler; // 回调引用

  public constructor(container: HTMLElement) { // 构造函数接收父容器
    this.root = document.createElement('div'); // 创建根容器
    this.root.className = 'resource-manager-filter'; // 设定样式类
    container.appendChild(this.root); // 挂载到父容器

    const title = document.createElement('h3'); // 创建标题
    title.textContent = '筛选'; // 设置文本
    this.root.appendChild(title); // 添加到面板

    this.searchInput = document.createElement('input'); // 创建搜索框
    this.searchInput.type = 'search'; // 指定类型
    this.searchInput.placeholder = '搜索名称或路径'; // 设置提示
    this.root.appendChild(this.searchInput); // 添加控件

    this.typeSelect = document.createElement('select'); // 创建类型选择
    const options: Array<{ value: ResourceTypeFilter; label: string }> = [ // 定义选项
      { value: 'all', label: '全部类型' }, // 全部项
      { value: 'images', label: '图像' }, // 图像项
      { value: 'audio', label: '音频' }, // 音频项
    ]; // 数组结束
    options.forEach((entry) => { // 遍历选项
      const option = document.createElement('option'); // 创建option
      option.value = entry.value; // 设置值
      option.textContent = entry.label; // 设置文本
      this.typeSelect.appendChild(option); // 加入下拉框
    }); // 循环结束
    this.root.appendChild(this.typeSelect); // 添加到面板

    const tagLabel = document.createElement('label'); // 创建标签标题
    tagLabel.textContent = '标签筛选'; // 设置文字
    this.root.appendChild(tagLabel); // 添加到面板

    this.tagSelect = document.createElement('select'); // 创建多选框
    this.tagSelect.multiple = true; // 启用多选
    this.tagSelect.size = 6; // 显示六行
    this.root.appendChild(this.tagSelect); // 添加控件

    [this.searchInput, this.typeSelect, this.tagSelect].forEach((element) => { // 绑定事件
      element.addEventListener('input', () => this.emitChange()); // 输入时触发
      element.addEventListener('change', () => this.emitChange()); // 变更时触发
    }); // 循环结束
  } // 构造结束

  public setAvailableTags(tags: string[]): void { // 更新可选标签
    const previousSelection = this.getSelectedTags(); // 记录当前选择
    this.tagSelect.innerHTML = ''; // 清空旧选项
    tags.sort((a, b) => a.localeCompare(b)); // 排序标签
    tags.forEach((tag) => { // 遍历标签
      const option = document.createElement('option'); // 创建option
      option.value = tag; // 设置值
      option.textContent = tag; // 设置文本
      if (previousSelection.includes(tag)) { // 如果之前已选择
        option.selected = true; // 保持选择
      } // 条件结束
      this.tagSelect.appendChild(option); // 添加到多选框
    }); // 循环结束
    this.emitChange(); // 通知外部刷新
  } // 方法结束

  public setOnChange(handler: FilterChangeHandler): void { // 设置回调
    this.onChange = handler; // 存储回调
  } // 方法结束

  public getCriteria(): FilterCriteria { // 获取当前筛选条件
    return { // 返回对象
      q: this.searchInput.value.trim(), // 获取搜索词
      type: this.typeSelect.value as ResourceTypeFilter, // 获取类型选择
      tags: this.getSelectedTags(), // 获取已选标签
    }; // 返回结束
  } // 方法结束

  private getSelectedTags(): string[] { // 内部方法读取多选值
    return Array.from(this.tagSelect.selectedOptions).map((option) => option.value); // 转换为数组
  } // 方法结束

  private emitChange(): void { // 触发回调
    if (this.onChange) { // 确认回调存在
      this.onChange(this.getCriteria()); // 传出当前条件
    } // 条件结束
  } // 方法结束
} // 类结束
