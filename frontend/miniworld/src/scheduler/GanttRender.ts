import Phaser from 'phaser'; // 引入 Phaser 用于绘制图形
import { LayoutResult, LayoutTask } from './GanttLayout'; // 引入布局结果类型
import { GANTT_STYLES } from './GanttStyles'; // 引入样式常量

export class GanttRender { // 定义甘特图渲染类
  private scene: Phaser.Scene; // 保存场景引用
  private gridLayer: Phaser.GameObjects.Graphics; // 网格图层
  private taskLayer: Phaser.GameObjects.Container; // 任务容器
  private tickLayer: Phaser.GameObjects.Container; // 刻度文字容器
  private dependencyLayer: Phaser.GameObjects.Graphics; // 依赖线图层

  public constructor(scene: Phaser.Scene) { // 构造函数
    this.scene = scene; // 保存场景
    this.gridLayer = scene.add.graphics({ x: 0, y: 0 }); // 创建网格绘制层
    this.taskLayer = scene.add.container(0, 0); // 创建任务容器
    this.tickLayer = scene.add.container(0, 0); // 创建刻度文字容器
    this.dependencyLayer = scene.add.graphics({ x: 0, y: 0 }); // 创建依赖线层
    scene.cameras.main.setBackgroundColor(GANTT_STYLES.backgroundColor); // 设置背景颜色
  } // 构造结束

  public draw(layout: LayoutResult): void { // 主绘制入口
    this.drawGrid(layout); // 绘制网格
    this.drawTasks(layout.tasks); // 绘制任务条
    this.drawDependencies(layout); // 绘制依赖线
  } // 方法结束

  private drawGrid(layout: LayoutResult): void { // 绘制网格背景
    this.gridLayer.clear(); // 清空之前的图形
    this.tickLayer.removeAll(true); // 清除旧刻度文本
    this.gridLayer.lineStyle(1, GANTT_STYLES.gridColor, 0.35); // 设置线条样式
    layout.ticks.forEach((tick) => { // 遍历刻度
      this.gridLayer.beginPath(); // 开始路径
      this.gridLayer.moveTo(tick.x, 0); // 移动到刻度顶端
      this.gridLayer.lineTo(tick.x, this.scene.scale.height); // 画到视口底部
      this.gridLayer.strokePath(); // 完成绘制
      if (tick.major) { // 如果是主刻度
        this.addTickLabel(tick.x, tick.label); // 绘制标签
      } // 条件结束
    }); // 遍历结束
  } // 方法结束

  private addTickLabel(x: number, label: string): void { // 在时间轴上添加文字
    const text = this.scene.add.text(x + 4, 4, label, { fontSize: '12px', color: GANTT_STYLES.textColor }); // 创建文字对象
    this.tickLayer.add(text); // 将文字放入刻度容器
  } // 方法结束

  private drawTasks(tasks: LayoutTask[]): void { // 绘制任务条
    this.taskLayer.removeAll(true); // 清除旧的任务对象
    tasks.forEach((entry) => { // 遍历任务布局
      const color = this.resolveTaskColor(entry); // 计算任务颜色
      const graphics = this.scene.add.graphics({ x: entry.x, y: entry.y }); // 创建图形对象
      graphics.fillStyle(color, 1); // 设置填充颜色
      graphics.fillRoundedRect(0, 0, entry.width, entry.height, 6); // 绘制圆角矩形
      graphics.lineStyle(1, 0x000000, 0.25); // 添加边框线
      graphics.strokeRoundedRect(0, 0, entry.width, entry.height, 6); // 绘制边框
      this.taskLayer.add(graphics); // 将图形加入任务容器
      const label = this.scene.add.text(entry.x + GANTT_STYLES.taskPadding, entry.y + GANTT_STYLES.taskPadding, entry.task.title, { fontSize: '14px', color: GANTT_STYLES.textColor }); // 添加任务标题
      this.taskLayer.add(label); // 将文本加入容器
      if (entry.task.progress !== undefined) { // 如果存在进度
        this.drawProgress(entry); // 绘制进度条
      } // 条件结束
    }); // 结束遍历
  } // 方法结束

  private resolveTaskColor(entry: LayoutTask): number { // 根据任务状态返回颜色
    switch (entry.task.status) { // 根据状态分支
      case 'approved': // 如果是已审批
        return GANTT_STYLES.approvedColor; // 返回审批颜色
      case 'executing': // 如果在执行
        return GANTT_STYLES.executingColor; // 返回执行颜色
      case 'done': // 完成状态
        return GANTT_STYLES.doneColor; // 返回完成颜色
      case 'paused': // 暂停状态
        return GANTT_STYLES.pausedColor; // 返回暂停颜色
      case 'error': // 错误状态
        return GANTT_STYLES.overdueColor; // 使用警告颜色
      default: // 默认情况
        return GANTT_STYLES.progressColor; // 使用计划颜色
    } // 分支结束
  } // 方法结束

  private drawProgress(entry: LayoutTask): void { // 绘制执行进度
    const percentage = Math.max(0, Math.min(1, (entry.task.progress ?? 0) / 100)); // 计算进度比例
    const width = entry.width * percentage; // 计算进度条宽度
    const bar = this.scene.add.graphics({ x: entry.x, y: entry.y + entry.height - 6 }); // 创建进度条图形
    bar.fillStyle(GANTT_STYLES.selectionColor, 0.8); // 设置颜色
    bar.fillRect(0, 0, width, 6); // 绘制矩形
    this.taskLayer.add(bar); // 添加到任务容器
  } // 方法结束

  private drawDependencies(layout: LayoutResult): void { // 绘制依赖线
    this.dependencyLayer.clear(); // 清空旧的依赖
    this.dependencyLayer.lineStyle(GANTT_STYLES.dependencyStroke, GANTT_STYLES.dependencyColor, 1); // 设置线条样式
    layout.tasks.forEach((entry) => { // 遍历任务
      entry.task.dependsOn?.forEach((parentId) => { // 遍历依赖父任务
        const parent = layout.tasks.find((item) => item.task.id === parentId); // 查找父任务布局
        if (!parent) { // 如果没有找到
          return; // 跳过绘制
        } // 条件结束
        this.dependencyLayer.beginPath(); // 开始绘制
        const startX = parent.x + parent.width; // 计算依赖起点 x
        const startY = parent.y + parent.height / 2; // 计算依赖起点 y
        const endX = entry.x; // 依赖终点 x
        const endY = entry.y + entry.height / 2; // 依赖终点 y
        const midX = (startX + endX) / 2; // 计算中间折线位置
        this.dependencyLayer.moveTo(startX, startY); // 移动到起点
        this.dependencyLayer.lineTo(midX, startY); // 水平线到中间
        this.dependencyLayer.lineTo(midX, endY); // 垂直线到终点 y
        this.dependencyLayer.lineTo(endX, endY); // 水平线到终点
        this.dependencyLayer.strokePath(); // 完成折线
        this.drawArrow(endX, endY); // 在末端绘制箭头
      }); // 结束依赖遍历
    }); // 结束任务遍历
  } // 方法结束

  private drawArrow(x: number, y: number): void { // 绘制箭头小三角
    const size = 6; // 箭头尺寸
    this.dependencyLayer.fillStyle(GANTT_STYLES.dependencyColor, 1); // 设置填充颜色
    this.dependencyLayer.beginPath(); // 开始路径
    this.dependencyLayer.moveTo(x, y); // 移动到箭头尖端
    this.dependencyLayer.lineTo(x - size, y - size / 2); // 绘制一侧
    this.dependencyLayer.lineTo(x - size, y + size / 2); // 绘制另一侧
    this.dependencyLayer.closePath(); // 闭合路径
    this.dependencyLayer.fillPath(); // 填充三角形
  } // 方法结束
} // 类结束
