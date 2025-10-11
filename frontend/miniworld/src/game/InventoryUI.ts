import Phaser from 'phaser'; // 引入Phaser框架
import { InventorySystem, type Inventory, type ItemStack } from './InventorySystem'; // 引入背包系统
import { BuildFromInventory } from './BuildFromInventory'; // 引入建造逻辑

export class InventoryUI { // 定义背包界面类
  private container: Phaser.GameObjects.Container; // 存储界面容器
  private gridTexts: Phaser.GameObjects.Text[] = []; // 存储格子文本
  private visible = false; // 标记界面是否可见
  private selectedIndex: number | null = null; // 当前选中索引

  public constructor(private scene: Phaser.Scene, private inventory: InventorySystem, private layout: { columns: number; rows: number }, private builder: BuildFromInventory) { // 构造函数保存依赖
    const width = this.layout.columns * 64 + 32; // 计算界面宽度
    const height = this.layout.rows * 48 + 80; // 计算界面高度
    this.container = scene.add.container(scene.scale.width / 2 - width / 2, scene.scale.height / 2 - height / 2); // 创建容器
    const bg = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75); // 创建背景矩形
    bg.setStrokeStyle(2, 0xffffff, 0.8); // 设置边框
    this.container.add(bg); // 将背景加入容器
    const title = scene.add.text(width / 2, 24, '背包', { fontFamily: 'sans-serif', fontSize: '20px', color: '#ffffff' }); // 创建标题文本
    title.setOrigin(0.5, 0.5); // 标题居中
    this.container.add(title); // 将标题加入容器
    this.createGrid(width); // 创建网格文本
    const buildButton = scene.add.text(width - 60, height - 30, '建造', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffee88', backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 8, y: 4 } }); // 创建建造按钮
    buildButton.setOrigin(0.5, 0.5); // 设置按钮居中
    buildButton.setInteractive({ useHandCursor: true }); // 启用交互
    buildButton.on('pointerdown', () => this.triggerBuild()); // 点击触发建造
    this.container.add(buildButton); // 将按钮加入容器
    this.container.setVisible(this.visible); // 根据标记设置可见性
    this.inventory.onChange(() => this.refresh()); // 注册背包更新事件
    this.refresh(); // 初始化界面内容
    this.scene.input.keyboard?.on('keydown-I', () => this.toggle()); // 监听I键切换界面
  } // 构造函数结束

  private createGrid(width: number): void { // 创建网格文本方法
    const startX = 32; // 网格起始X
    const startY = 48; // 网格起始Y
    const cellWidth = (width - 64) / this.layout.columns; // 计算格子宽度
    const cellHeight = 40; // 定义格子高度
    for (let row = 0; row < this.layout.rows; row += 1) { // 遍历行
      for (let col = 0; col < this.layout.columns; col += 1) { // 遍历列
        const index = row * this.layout.columns + col; // 计算索引
        const text = this.scene.add.text(startX + col * cellWidth + cellWidth / 2, startY + row * cellHeight + cellHeight / 2, '空', { fontFamily: 'sans-serif', fontSize: '14px', color: '#ffffff' }); // 创建格子文本
        text.setOrigin(0.5, 0.5); // 文本居中
        text.setInteractive({ useHandCursor: true }); // 启用交互
        text.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.handlePointer(pointer, index)); // 绑定点击事件
        text.on('pointerup', () => this.clearPointer()); // 绑定松开事件
        this.container.add(text); // 将文本加入容器
        this.gridTexts.push(text); // 保存引用
      } // 列遍历结束
    } // 行遍历结束
  } // 方法结束

  private handlePointer(pointer: Phaser.Input.Pointer, index: number): void { // 处理指针按下方法
    if (pointer.rightButtonDown()) { // 如果按下右键
      this.handleSplit(index); // 执行拆分逻辑
      return; // 结束方法
    } // 条件结束
    this.selectedIndex = index; // 更新选中索引
    this.highlightSelection(); // 刷新高亮
  } // 方法结束

  private clearPointer(): void { // 清理指针状态方法
    // 该方法保留以方便未来扩展 // 保留中文注释
  } // 方法结束

  private handleSplit(index: number): void { // 处理拆分方法
    const slot = this.inventory.getInventory().slots[index]; // 获取指定槽位
    if (!slot) { // 如果槽位为空
      return; // 直接返回
    } // 条件结束
    this.inventory.splitStack(slot.id); // 调用背包系统拆分
  } // 方法结束

  private triggerBuild(): void { // 触发建造方法
    if (this.selectedIndex === null) { // 如果没有选中物品
      return; // 直接返回
    } // 条件结束
    const snapshot = this.inventory.getInventory(); // 获取背包快照
    const slot = snapshot.slots[this.selectedIndex]; // 获取选中槽位
    if (!slot) { // 如果槽位为空
      return; // 直接返回
    } // 条件结束
    this.builder.build(slot.id, 1); // 调用建造逻辑
  } // 方法结束

  public toggle(): void { // 切换界面显示方法
    this.visible = !this.visible; // 切换标记
    this.container.setVisible(this.visible); // 更新可见性
  } // 方法结束

  public refresh(): void { // 刷新界面显示方法
    const snapshot: Inventory = this.inventory.getInventory(); // 获取背包快照
    this.gridTexts.forEach((text, index) => { // 遍历文本
      const slot: ItemStack | undefined = snapshot.slots[index]; // 获取对应槽位
      if (slot) { // 如果存在
        text.setText(`${slot.id} x${slot.count}`); // 显示物品信息
      } else { // 如果不存在
        text.setText('空'); // 显示空文本
      } // 条件结束
    }); // 遍历结束
    this.highlightSelection(); // 刷新高亮
  } // 方法结束

  private highlightSelection(): void { // 刷新选中高亮方法
    this.gridTexts.forEach((text, index) => { // 遍历所有格子
      if (this.selectedIndex === index) { // 如果是选中索引
        text.setStyle({ backgroundColor: 'rgba(255,255,0,0.2)' }); // 设置背景颜色
      } else { // 否则
        text.setStyle({ backgroundColor: 'rgba(0,0,0,0)' }); // 恢复背景透明
      } // 条件结束
    }); // 遍历结束
  } // 方法结束
} // 类结束
