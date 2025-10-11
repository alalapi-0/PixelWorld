import Phaser from 'phaser'; // 引入Phaser框架
import { QuestStore } from '../quest/QuestStore'; // 引入任务存储
import { QuestDef, QuestProgress, Step } from '../quest/QuestTypes'; // 引入任务类型
// 分隔注释 // 保持行有注释
type JournalTab = 'active' | 'completed'; // 定义标签类型
// 分隔注释 // 保持行有注释
interface JournalEntry { def: QuestDef; prog: QuestProgress; } // 定义列表项结构
// 分隔注释 // 保持行有注释
export class QuestJournal extends Phaser.GameObjects.Container { // 定义任务日志界面容器
  private store: QuestStore; // 保存任务存储引用
  private currentTab: JournalTab = 'active'; // 当前选中的标签
  private currentList: JournalEntry[] = []; // 当前列表数据
  private selectedIndex = 0; // 当前选中的索引
  private isVisible = false; // 是否显示
  private listTexts: Phaser.GameObjects.Text[] = []; // 列表文本数组
  private detailText!: Phaser.GameObjects.Text; // 详情文本引用
  private rewardText!: Phaser.GameObjects.Text; // 奖励文本引用
  private tabTexts!: { active: Phaser.GameObjects.Text; completed: Phaser.GameObjects.Text }; // 标签文本引用
  private hintText!: Phaser.GameObjects.Text; // 底部提示文本
  private handlers: Array<{ key: Phaser.Input.Keyboard.Key; handler: () => void }> = []; // 键盘事件记录
  // 分隔注释 // 保持行有注释
  public constructor(scene: Phaser.Scene, store: QuestStore) { // 构造函数
    super(scene, scene.scale.width / 2, scene.scale.height / 2); // 调用父类并居中
    this.store = store; // 保存任务存储
    this.setDepth(1800); // 设置较高深度
    this.setScrollFactor(0); // 固定在屏幕中心
    this.scene.add.existing(this); // 将容器加入场景
    this.buildLayout(); // 构建界面
    this.setVisible(false); // 初始隐藏
  } // 构造结束
  // 分隔注释 // 保持行有注释
  private buildLayout(): void { // 构建界面布局
    const bg = this.scene.add.rectangle(0, 0, 540, 360, 0x000000, 0.75); // 创建背景
    bg.setOrigin(0.5, 0.5); // 设置锚点
    this.add(bg); // 加入容器
    const frame = this.scene.add.rectangle(0, 0, 540, 360); // 创建边框
    frame.setStrokeStyle(2, 0xffffff, 0.8); // 设置描边
    frame.setOrigin(0.5, 0.5); // 设置锚点
    this.add(frame); // 加入容器
    const activeTab = this.scene.add.text(-220, -150, '进行中', { fontFamily: 'sans-serif', fontSize: '18px', color: '#ffffff' }); // 创建进行中标签
    activeTab.setOrigin(0, 0); // 设置锚点
    const completedTab = this.scene.add.text(-120, -150, '已完成', { fontFamily: 'sans-serif', fontSize: '18px', color: '#aaaaaa' }); // 创建已完成标签
    completedTab.setOrigin(0, 0); // 设置锚点
    this.add(activeTab); // 加入容器
    this.add(completedTab); // 加入容器
    this.tabTexts = { active: activeTab, completed: completedTab }; // 保存引用
    for (let i = 0; i < 8; i += 1) { // 循环创建列表
      const itemText = this.scene.add.text(-240, -110 + i * 32, '', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.1)', padding: { x: 6, y: 4 } }); // 创建列表项文本
      itemText.setOrigin(0, 0); // 设置锚点
      this.add(itemText); // 添加到容器
      this.listTexts.push(itemText); // 存储引用
    } // 循环结束
    this.detailText = this.scene.add.text(-40, -110, '', { fontFamily: 'sans-serif', fontSize: '14px', color: '#ffffff', wordWrap: { width: 240 }, lineSpacing: 6 }); // 创建详情文本
    this.detailText.setOrigin(0, 0); // 设置锚点
    this.add(this.detailText); // 加入容器
    this.rewardText = this.scene.add.text(-40, 60, '', { fontFamily: 'sans-serif', fontSize: '14px', color: '#ffdd88', wordWrap: { width: 240 }, lineSpacing: 4 }); // 创建奖励文本
    this.rewardText.setOrigin(0, 0); // 设置锚点
    this.add(this.rewardText); // 加入容器
    this.hintText = this.scene.add.text(-240, 140, '↑↓ 切换任务 / Tab 切换标签 / T 或 Enter 追踪 / Esc 关闭', { fontFamily: 'sans-serif', fontSize: '12px', color: '#cccccc' }); // 创建提示文本
    this.hintText.setOrigin(0, 0); // 设置锚点
    this.add(this.hintText); // 加入容器
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private refreshTabStyle(): void { // 更新标签样式
    this.tabTexts.active.setColor(this.currentTab === 'active' ? '#ffdd66' : '#ffffff'); // 根据当前标签设置颜色
    this.tabTexts.completed.setColor(this.currentTab === 'completed' ? '#ffdd66' : '#aaaaaa'); // 更新完成标签颜色
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private buildList(): void { // 重建列表数据
    const visible = this.store.listVisible(); // 获取可见任务
    if (this.currentTab === 'active') { // 如果当前是进行中
      this.currentList = visible.filter((entry) => entry.prog.status === 'active'); // 过滤进行中任务
    } else { // 否则
      this.currentList = visible.filter((entry) => entry.prog.status === 'completed'); // 过滤已完成任务
    } // 条件结束
    if (this.selectedIndex >= this.currentList.length) { // 如果选中越界
      this.selectedIndex = Math.max(0, this.currentList.length - 1); // 调整索引
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private updateListTexts(): void { // 更新列表显示
    for (let i = 0; i < this.listTexts.length; i += 1) { // 遍历列表文本
      const item = this.listTexts[i]; // 当前文本
      const entry = this.currentList[i]; // 当前数据
      if (!entry) { // 如果没有数据
        item.setText(''); // 清空文本
        item.setBackgroundColor('rgba(0,0,0,0)'); // 清除背景
        continue; // 跳过
      } // 条件结束
      const trackedMark = entry.prog.tracked ? '★' : ' '; // 判断是否追踪
      const prefix = i === this.selectedIndex ? '▶' : ' '; // 选中箭头
      item.setText(`${prefix}[${trackedMark}] ${entry.def.title}`); // 设置文本内容
      item.setBackgroundColor(i === this.selectedIndex ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'); // 设置背景
    } // 循环结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private formatCurrentStep(entry: JournalEntry): string { // 构建当前步骤描述
    if (entry.prog.status === 'completed') { // 如果任务已完成
      return '状态：已完成'; // 返回完成文本
    } // 条件结束
    const step = entry.def.steps[entry.prog.currentStepIndex]; // 读取当前步骤
    if (!step) { // 如果没有步骤
      return '状态：等待后续步骤'; // 返回占位文本
    } // 条件结束
    let progressLine = step.title; // 初始化描述
    if (step.type === 'collect') { // 如果是收集
      const current = entry.prog.counters[step.id] ?? 0; // 当前数量
      const target = step.count ?? 1; // 目标数量
      progressLine += ` ${Math.min(current, target)}/${target}`; // 拼接数量
    } else if (step.type === 'talk' && step.npcId) { // 对话步骤
      progressLine += `（与 ${step.npcId} 交谈）`; // 拼接提示
    } else if (step.type === 'reach' && step.targetX !== undefined && step.targetY !== undefined) { // 抵达步骤
      progressLine += `（前往 ${step.targetX}, ${step.targetY}）`; // 拼接坐标
    } // 条件结束
    return `当前步骤：${progressLine}`; // 返回描述
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private formatRewards(entry: JournalEntry): string { // 构建奖励描述
    if (!entry.def.rewards) { // 如果没有奖励
      return '奖励：无'; // 返回无奖励
    } // 条件结束
    const parts: string[] = []; // 初始化描述数组
    if (entry.def.rewards.gold) { // 如果有金币
      parts.push(`金币 ${entry.def.rewards.gold}`); // 添加金币信息
    } // 条件结束
    if (entry.def.rewards.items && entry.def.rewards.items.length > 0) { // 如果有物品
      const itemText = entry.def.rewards.items.map((item) => `${item.name}x${item.count}`).join('、'); // 拼接物品
      parts.push(`物品 ${itemText}`); // 添加物品信息
    } // 条件结束
    if (entry.def.rewards.achievement) { // 如果有成就
      parts.push(`成就 ${entry.def.rewards.achievement}`); // 添加成就信息
    } // 条件结束
    return `奖励：${parts.join(' / ')}`; // 返回组合文本
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private updateDetail(): void { // 更新详情显示
    const entry = this.currentList[this.selectedIndex]; // 获取当前选中项
    if (!entry) { // 如果没有选中项
      this.detailText.setText(''); // 清空详情
      this.rewardText.setText(''); // 清空奖励
      return; // 结束
    } // 条件结束
    const lines: string[] = []; // 初始化文本数组
    lines.push(`任务：${entry.def.title}`); // 添加标题
    lines.push(entry.def.desc); // 添加描述
    lines.push(this.formatCurrentStep(entry)); // 添加步骤
    this.detailText.setText(lines.join('\n')); // 更新详情文本
    this.rewardText.setText(this.formatRewards(entry)); // 更新奖励文本
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private moveSelection(offset: number): void { // 调整选中索引
    if (this.currentList.length === 0) { // 如果列表为空
      return; // 不处理
    } // 条件结束
    this.selectedIndex = (this.selectedIndex + offset + this.currentList.length) % this.currentList.length; // 使用环绕索引
    this.updateListTexts(); // 更新列表显示
    this.updateDetail(); // 更新详情
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private toggleTab(): void { // 切换标签
    this.currentTab = this.currentTab === 'active' ? 'completed' : 'active'; // 在两个标签之间切换
    this.selectedIndex = 0; // 重置选中
    this.refreshTabStyle(); // 更新标签颜色
    this.rebuild(); // 重新构建列表
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private toggleTrack(): void { // 切换追踪状态
    const entry = this.currentList[this.selectedIndex]; // 获取当前项
    if (!entry) { // 如果不存在
      return; // 直接返回
    } // 条件结束
    if (entry.prog.status !== 'active') { // 如果不是进行中
      return; // 不允许追踪
    } // 条件结束
    this.store.toggleTrack(entry.def.id); // 调用存储切换追踪
    this.rebuild(); // 刷新界面
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private rebuild(): void { // 重建列表与详情
    this.buildList(); // 构建列表数据
    this.updateListTexts(); // 更新列表显示
    this.updateDetail(); // 更新详情
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private registerKeys(): void { // 注册键盘事件
    const keyboard = this.scene.input.keyboard; // 获取键盘对象
    if (!keyboard) { // 如果不存在键盘
      return; // 直接返回
    } // 条件结束
    const map = keyboard.addKeys({ up: Phaser.Input.Keyboard.KeyCodes.UP, down: Phaser.Input.Keyboard.KeyCodes.DOWN, tab: Phaser.Input.Keyboard.KeyCodes.TAB, esc: Phaser.Input.Keyboard.KeyCodes.ESC, enter: Phaser.Input.Keyboard.KeyCodes.ENTER, T: Phaser.Input.Keyboard.KeyCodes.T }) as Record<string, Phaser.Input.Keyboard.Key>; // 创建按键映射
    const bind = (key: Phaser.Input.Keyboard.Key, handler: () => void): void => { // 定义绑定函数
      const wrapped = (): void => { // 包装处理器
        handler(); // 执行逻辑
      }; // 包装结束
      key.on('down', wrapped); // 绑定事件
      this.handlers.push({ key, handler: wrapped }); // 保存处理器
    }; // 函数结束
    bind(map.up, () => this.moveSelection(-1)); // 绑定向上
    bind(map.down, () => this.moveSelection(1)); // 绑定向下
    bind(map.tab, () => this.toggleTab()); // 绑定切换标签
    bind(map.enter, () => this.toggleTrack()); // 绑定回车追踪
    bind(map.T, () => this.toggleTrack()); // 绑定T追踪
    bind(map.esc, () => this.close()); // 绑定Esc关闭
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private removeKeys(): void { // 移除键盘事件
    this.handlers.forEach(({ key, handler }) => { // 遍历记录
      key.off('down', handler); // 解除绑定
    }); // 遍历结束
    this.handlers = []; // 清空数组
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public open(): void { // 打开界面
    if (this.isVisible) { // 如果已打开
      return; // 不重复处理
    } // 条件结束
    this.isVisible = true; // 更新状态
    this.setVisible(true); // 显示容器
    this.refreshTabStyle(); // 更新标签样式
    this.rebuild(); // 构建列表
    this.registerKeys(); // 注册输入
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public close(): void { // 关闭界面
    if (!this.isVisible) { // 如果已关闭
      return; // 不处理
    } // 条件结束
    this.isVisible = false; // 更新状态
    this.setVisible(false); // 隐藏容器
    this.removeKeys(); // 移除输入
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public isOpen(): boolean { // 查询是否打开
    return this.isVisible; // 返回状态
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public refresh(): void { // 对外刷新界面
    this.refreshTabStyle(); // 更新标签样式
    this.rebuild(); // 重新构建数据
  } // 方法结束
} // 类结束
