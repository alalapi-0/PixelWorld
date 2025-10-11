import Phaser from 'phaser'; // 引入Phaser框架
import { InventorySystem, type Inventory } from './InventorySystem'; // 引入背包系统

export class HotbarUI { // 定义快捷栏界面类
  private container: Phaser.GameObjects.Container; // 存储容器引用
  private slotTexts: Phaser.GameObjects.Text[] = []; // 存储文本引用
  private selectedIndex = 0; // 当前选中的快捷栏索引

  public constructor(private scene: Phaser.Scene, private inventory: InventorySystem, private slotCount: number) { // 构造函数保存依赖
    this.container = scene.add.container(16, scene.scale.height - 48); // 创建容器
    const bg = scene.add.rectangle(0, 0, this.slotCount * 44, 40, 0x000000, 0.6); // 创建背景矩形
    bg.setOrigin(0, 0); // 设置原点
    bg.setStrokeStyle(2, 0xffffff, 0.7); // 设置描边
    this.container.add(bg); // 加入容器
    this.createSlots(); // 创建槽位文本
    this.inventory.onChange(() => this.refresh()); // 注册背包监听
    this.refresh(); // 初始刷新
    this.registerKeys(); // 注册数字键切换
  } // 构造函数结束

  private createSlots(): void { // 创建槽位方法
    for (let i = 0; i < this.slotCount; i += 1) { // 遍历槽位数量
      const text = this.scene.add.text(8 + i * 44, 8, `${i + 1}: 空`, { fontFamily: 'sans-serif', fontSize: '14px', color: '#ffffff' }); // 创建文本
      text.setOrigin(0, 0); // 设置原点
      this.container.add(text); // 加入容器
      this.slotTexts.push(text); // 存储引用
    } // 循环结束
  } // 方法结束

  private registerKeys(): void { // 注册快捷键方法
    for (let i = 0; i < this.slotCount; i += 1) { // 遍历槽位
      const keyCode = Phaser.Input.Keyboard.KeyCodes.ONE + i; // 计算按键码
      const key = this.scene.input.keyboard?.addKey(keyCode); // 注册按键
      key?.on('down', () => this.selectSlot(i)); // 绑定按下事件
    } // 循环结束
  } // 方法结束

  private selectSlot(index: number): void { // 选择槽位方法
    this.selectedIndex = index; // 更新索引
    this.highlight(); // 刷新高亮
  } // 方法结束

  public getSelectedItem(): string | undefined { // 获取当前选中物品方法
    const snapshot: Inventory = this.inventory.getInventory(); // 获取背包快照
    const entry = snapshot.slots[indexOrZero(snapshot.slots.length, this.selectedIndex)]; // 获取对应条目
    return entry?.id; // 返回物品ID
  } // 方法结束

  private refresh(): void { // 刷新文本方法
    const snapshot = this.inventory.getInventory(); // 获取背包快照
    this.slotTexts.forEach((text, index) => { // 遍历文本
      const item = snapshot.slots[index]; // 获取槽位物品
      if (item) { // 如果存在
        text.setText(`${index + 1}: ${item.id} x${item.count}`); // 显示物品信息
      } else { // 否则
        text.setText(`${index + 1}: 空`); // 显示空文本
      } // 条件结束
    }); // 遍历结束
    this.highlight(); // 刷新高亮
  } // 方法结束

  private highlight(): void { // 刷新高亮方法
    this.slotTexts.forEach((text, index) => { // 遍历文本
      if (index === this.selectedIndex) { // 如果是选中索引
        text.setStyle({ backgroundColor: 'rgba(255,255,0,0.2)' }); // 设置背景
      } else { // 否则
        text.setStyle({ backgroundColor: 'rgba(0,0,0,0)' }); // 清除背景
      } // 条件结束
    }); // 遍历结束
  } // 方法结束
} // 类结束

function indexOrZero(length: number, index: number): number { // 定义辅助函数确保索引合法
  return index < length ? index : 0; // 如果索引超出则回到0
} // 函数结束
