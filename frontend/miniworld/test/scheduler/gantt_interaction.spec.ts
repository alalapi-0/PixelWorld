import { describe, it, expect, vi } from 'vitest'; // 引入测试工具
import { WorkCalendar } from '../../src/time/WorkCalendar'; // 引入工作日历
import { GanttLayout, SchedulerData } from '../../src/scheduler/GanttLayout'; // 引入布局类型
import { GanttInteraction } from '../../src/scheduler/GanttInteraction'; // 引入交互控制器
import type { SchedulerIO } from '../../src/config/SchedulerIO'; // 引入 IO 类型

const scheduler: SchedulerData = { // 定义测试排程
  version: 1, // 版本号
  timeScale: 'minutes', // 时间刻度
  startAt: '2025-10-11T08:00:00Z', // 起始时间
  rows: [{ id: 'worker-1', label: '工人#1' }], // 定义资源行
  tasks: [ // 定义任务
    { id: 'task-1', type: 'build', title: '建造A', rowId: 'worker-1', start: '2025-10-11T08:00:00Z', durationMin: 30 }, // 初始任务
  ], // 任务列表结束
}; // 排程结束

describe('GanttInteraction', () => { // 描述测试套件
  const io = { save: vi.fn().mockResolvedValue(undefined) } as unknown as SchedulerIO; // 创建保存的假对象
  const layout = new GanttLayout(scheduler); // 创建布局实例
  const calendar = new WorkCalendar({ workHours: '08:00-18:00' }); // 创建工作日历
  const interaction = new GanttInteraction(scheduler, layout, calendar, io); // 创建交互控制器

  it('拖拽会吸附到半小时', () => { // 定义拖拽测试
    interaction.dragTask('task-1', 20); // 向后拖拽20分钟
    const updated = scheduler.tasks[0].start; // 读取更新后的开始
    expect(updated).toBe('2025-10-11T08:30:00.000Z'); // 期望吸附到08:30
  }); // 测试结束

  it('调整持续时间会更新字段', () => { // 定义持续时间测试
    interaction.resizeTask('task-1', 30); // 增加30分钟
    expect(scheduler.tasks[0].durationMin).toBe(60); // 期望变为60分钟
  }); // 测试结束

  it('连接与断开依赖', () => { // 定义依赖测试
    scheduler.tasks.push({ id: 'task-2', type: 'build', title: '建造B', rowId: 'worker-1', start: '2025-10-11T09:00:00Z', durationMin: 30 }); // 添加第二任务
    interaction.connectDependency('task-1', 'task-2'); // 建立依赖
    expect(scheduler.tasks[1].dependsOn).toEqual(['task-1']); // 期望依赖成立
    interaction.disconnectDependency('task-1', 'task-2'); // 移除依赖
    expect(scheduler.tasks[1].dependsOn).toBeUndefined(); // 期望依赖被移除
  }); // 测试结束

  it('保存会调用 IO', async () => { // 定义保存测试
    await interaction.save(); // 调用保存
    expect(io.save).toHaveBeenCalled(); // 期望触发保存
  }); // 测试结束
}); // 套件结束
