import Phaser from 'phaser'; // 引入Phaser框架
import { loadGlossary, getCategories, getEntriesByCat, GlossaryCategory, GlossaryEntry } from './GlossaryStore'; // 引入图鉴数据接口
// 分隔注释 // 保持行有注释
export default class GlossaryScene extends Phaser.Scene { // 定义图鉴场景
  private categoryTexts: Phaser.GameObjects.Text[] = []; // 保存分类文本
  private entryTexts: Phaser.GameObjects.Text[] = []; // 保存条目文本
  private descriptionText?: Phaser.GameObjects.Text; // 描述文本引用
  private selectedCategoryId: string | null = null; // 当前选择的分类
  private selectedEntryId: string | null = null; // 当前选择的条目
  // 分隔注释 // 保持行有注释
  public constructor() { // 构造函数
    super('GlossaryScene'); // 调用父类构造并指定键名
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public create(): void { // 场景创建时调用
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0.6)'); // 设置背景色
    const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.6); // 创建半透明背景
    overlay.setOrigin(0, 0); // 设置原点
    overlay.setScrollFactor(0); // 避免跟随相机
    overlay.setDepth(10); // 设置深度
    this.setupEscKey(); // 配置退出键
    void this.prepareData(); // 异步准备数据
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private setupEscKey(): void { // 配置Esc退出
    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC); // 绑定Esc键
    escKey?.on('down', () => { // 按下时触发
      this.scene.stop(); // 停止当前场景
      this.scene.resume('WorldScene'); // 恢复世界场景
    }); // 监听结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private async prepareData(): Promise<void> { // 异步准备数据
    await loadGlossary(this); // 加载图鉴数据
    const cats = getCategories(); // 读取分类
    this.selectedCategoryId = cats[0]?.id ?? null; // 默认选中第一个分类
    if (this.selectedCategoryId) { // 如果存在分类
      const entries = getEntriesByCat(this.selectedCategoryId); // 获取条目
      this.selectedEntryId = entries[0]?.id ?? null; // 默认选中第一个条目
    } // 条件结束
    this.renderUI(); // 渲染界面
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private renderUI(): void { // 渲染界面内容
    this.renderCategories(); // 渲染分类列表
    this.renderEntries(); // 渲染条目列表
    this.renderDescription(); // 渲染描述
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private renderCategories(): void { // 渲染分类列表
    this.categoryTexts.forEach((text) => text.destroy()); // 清理旧文本
    this.categoryTexts = []; // 重置数组
    const cats = getCategories(); // 获取分类
    const startX = 40; // 左列X坐标
    const startY = 60; // 左列起始Y
    const lineHeight = 24; // 行间距
    cats.forEach((cat: GlossaryCategory, index) => { // 遍历分类
      const label = this.add.text(startX, startY + index * lineHeight, cat.name, { fontFamily: 'sans-serif', fontSize: '14px', color: '#ffeeaa' }); // 创建文本
      label.setInteractive({ useHandCursor: true }); // 启用交互
      label.on('pointerdown', () => { // 点击事件
        this.selectedCategoryId = cat.id; // 更新分类选择
        const entries = getEntriesByCat(cat.id); // 读取条目
        this.selectedEntryId = entries[0]?.id ?? null; // 更新条目选择
        this.renderUI(); // 重新渲染
      }); // 事件结束
      if (cat.id === this.selectedCategoryId) { // 如果为当前选择
        label.setStyle({ color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.15)' }); // 高亮显示
      } // 条件结束
      this.categoryTexts.push(label); // 保存引用
    }); // 遍历结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private renderEntries(): void { // 渲染条目列表
    this.entryTexts.forEach((text) => text.destroy()); // 清理旧文本
    this.entryTexts = []; // 重置数组
    if (!this.selectedCategoryId) { // 如果没有分类
      return; // 不继续
    } // 条件结束
    const list = getEntriesByCat(this.selectedCategoryId); // 获取条目列表
    const startX = 220; // 条目列表X坐标
    const startY = 60; // 条目列表起始Y
    const lineHeight = 24; // 行间距
    list.forEach((entry: GlossaryEntry, index) => { // 遍历条目
      const label = this.add.text(startX, startY + index * lineHeight, entry.name, { fontFamily: 'sans-serif', fontSize: '14px', color: '#cce0ff' }); // 创建条目文本
      label.setData('entryId', entry.id); // 记录条目ID
      label.setInteractive({ useHandCursor: true }); // 启用交互
      label.on('pointerdown', () => { // 点击事件
        this.selectedEntryId = entry.id; // 设置当前条目
        this.renderDescription(); // 更新描述
        this.updateEntryHighlight(); // 更新高亮
      }); // 事件结束
      this.entryTexts.push(label); // 保存引用
    }); // 遍历结束
    this.updateEntryHighlight(); // 初始高亮
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private updateEntryHighlight(): void { // 更新条目高亮
    this.entryTexts.forEach((label) => { // 遍历文本
      const entryId = label.getData('entryId') as string | undefined; // 读取条目ID
      if (entryId && entryId === this.selectedEntryId) { // 如果匹配当前条目
        label.setStyle({ color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.15)' }); // 设置高亮
      } else { // 否则
        label.setStyle({ color: '#cce0ff', backgroundColor: undefined }); // 恢复默认
      } // 条件结束
    }); // 遍历结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private renderDescription(): void { // 渲染条目描述
    this.descriptionText?.destroy(); // 清理旧描述
    if (!this.selectedCategoryId || !this.selectedEntryId) { // 如果缺少选择
      return; // 直接返回
    } // 条件结束
    const list = getEntriesByCat(this.selectedCategoryId); // 获取当前分类条目
    const entry = list.find((item) => item.id === this.selectedEntryId); // 查找当前条目
    if (!entry) { // 如果没有找到
      return; // 直接返回
    } // 条件结束
    const text = `${entry.name}\n\n${entry.desc}`; // 拼接描述文本
    this.descriptionText = this.add.text(420, 60, text, { fontFamily: 'sans-serif', fontSize: '14px', color: '#ffffff', wordWrap: { width: 220 } }); // 创建描述文本
  } // 方法结束
} // 类结束
