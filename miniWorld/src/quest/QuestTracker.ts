import Phaser from 'phaser'; // 引入Phaser框架
import { QuestStore } from './QuestStore'; // 引入任务存储
import { Step } from './QuestTypes'; // 引入步骤类型
// 分隔注释 // 保持行有注释
function angleToArrow(angle: number): string { // 将角度转换为箭头字符
  const normalized = (angle + Math.PI * 2) % (Math.PI * 2); // 将角度归一化到0-2π
  const sector = Math.round(normalized / (Math.PI / 4)) % 8; // 将角度划分为八个方向
  const arrows = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗']; // 定义方向字符
  return arrows[sector]; // 返回对应字符
} // 函数结束
// 分隔注释 // 保持行有注释
export class QuestTracker { // 定义任务追踪显示类
  private scene: Phaser.Scene; // 保存场景引用
  private store: QuestStore; // 保存任务存储引用
  private hintContainer: Phaser.GameObjects.Container; // 保存提示容器
  private infoText?: Phaser.GameObjects.Text; // 保存提示文本引用
  private playerGetter?: () => { x: number; y: number }; // 玩家位置获取函数
  private npcLocator?: (npcId: string) => { x: number; y: number } | undefined; // NPC位置查询函数
  // 分隔注释 // 保持行有注释
  public constructor(scene: Phaser.Scene, store: QuestStore) { // 构造函数
    this.scene = scene; // 保存场景
    this.store = store; // 保存存储
    this.hintContainer = this.scene.add.container(0, 0); // 创建容器
    this.hintContainer.setDepth(1300); // 提升渲染深度
    this.hintContainer.setScrollFactor(0); // 固定在屏幕上
    this.hintContainer.setVisible(false); // 初始隐藏
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public setPlayer(getPos: () => { x: number; y: number }): void { // 设置玩家位置获取函数
    this.playerGetter = getPos; // 保存函数引用
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public setNpcLocator(locator: (npcId: string) => { x: number; y: number } | undefined): void { // 设置NPC位置查询函数
    this.npcLocator = locator; // 保存函数引用
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private ensureText(): Phaser.GameObjects.Text { // 确保提示文本存在
    if (!this.infoText) { // 如果尚未创建
      this.infoText = this.scene.add.text(0, 0, '', { fontFamily: 'sans-serif', fontSize: '14px', color: '#ffffaa', backgroundColor: 'rgba(0,0,0,0.6)', padding: { x: 6, y: 4 } }); // 创建文本
      this.infoText.setOrigin(0, 0); // 设置锚点
      this.hintContainer.add(this.infoText); // 添加到容器
    } // 条件结束
    return this.infoText; // 返回文本对象
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private buildCollectText(step: Step, progressValue: number): string { // 生成收集任务提示文本
    const target = step.count ?? 1; // 读取目标数量
    return `追踪：${step.title} ${Math.min(progressValue, target)}/${target}`; // 返回格式化文本
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private buildDirectionText(step: Step, questTitle: string, player: { x: number; y: number }, target: { x: number; y: number }): string { // 生成方向提示文本
    const dx = target.x - player.x; // 计算水平差值
    const dy = target.y - player.y; // 计算垂直差值
    const distance = Math.hypot(dx, dy); // 计算距离
    const arrow = angleToArrow(Math.atan2(dy, dx)); // 计算箭头方向
    return `追踪：${questTitle} ${arrow} ${step.title} 距离${distance.toFixed(1)}格`; // 返回格式化文本
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public update(): void { // 每帧更新提示
    if (!this.playerGetter) { // 如果未设置玩家获取器
      this.clear(); // 清理提示
      return; // 结束
    } // 条件结束
    const tracked = this.store.listVisible().filter((entry) => entry.prog.status === 'active' && entry.prog.tracked); // 筛选被追踪的任务
    if (tracked.length === 0) { // 如果没有追踪任务
      this.clear(); // 清理提示
      return; // 结束
    } // 条件结束
    const targetQuest = tracked[0]; // 使用首个被追踪任务
    const step = targetQuest.def.steps[targetQuest.prog.currentStepIndex]; // 获取当前步骤
    if (!step) { // 如果步骤不存在
      this.clear(); // 清理提示
      return; // 结束
    } // 条件结束
    const text = this.ensureText(); // 确保文本存在
    const player = this.playerGetter(); // 获取玩家位置
    if (step.type === 'collect') { // 如果是收集步骤
      const progressValue = targetQuest.prog.counters[step.id] ?? 0; // 读取当前计数
      text.setText(this.buildCollectText(step, progressValue)); // 更新文本内容
      this.hintContainer.setPosition(16, this.scene.scale.height - 64); // 将容器放置在屏幕下方
      this.hintContainer.setVisible(true); // 显示容器
      return; // 结束
    } // 条件结束
    let targetPos: { x: number; y: number } | undefined; // 声明目标位置
    if (step.type === 'reach' && step.targetX !== undefined && step.targetY !== undefined) { // 如果是抵达步骤
      targetPos = { x: step.targetX, y: step.targetY }; // 使用步骤目标
    } else if (step.type === 'talk' && step.npcId) { // 如果是对话步骤
      targetPos = this.npcLocator?.(step.npcId); // 尝试查询NPC位置
    } // 条件结束
    if (!targetPos) { // 如果无法确定目标
      text.setText(`追踪：${targetQuest.def.title} ${step.title} 目标未知`); // 显示占位文本
      this.hintContainer.setPosition(16, 48); // 放置在上方
      this.hintContainer.setVisible(true); // 显示容器
      return; // 结束
    } // 条件结束
    text.setText(this.buildDirectionText(step, targetQuest.def.title, player, targetPos)); // 更新方向文本
    this.hintContainer.setPosition(16, 48); // 将容器放置在上方
    this.hintContainer.setVisible(true); // 显示容器
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public clear(): void { // 清除提示
    if (this.infoText) { // 如果文本存在
      this.infoText.setText(''); // 清空内容
    } // 条件结束
    this.hintContainer.setVisible(false); // 隐藏容器
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public destroy(): void { // 销毁提示容器
    this.clear(); // 先清空显示
    this.hintContainer.destroy(true); // 销毁容器及其子对象
    this.infoText = undefined; // 清除文本引用
  } // 方法结束
} // 类结束
