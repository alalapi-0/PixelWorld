import { describe, it, expect } from 'vitest'; // 引入测试框架
import { GanttLayout, SchedulerData } from '../../src/scheduler/GanttLayout'; // 引入甘特布局

const scheduler: SchedulerData = { // 定义测试用排程
  version: 1, // 指定版本
  timeScale: 'minutes', // 指定分钟刻度
  startAt: '2025-10-11T08:00:00Z', // 定义起始时间
  rows: [ // 定义资源行
    { id: 'worker-1', label: '工人#1' }, // 第一行
    { id: 'worker-2', label: '工人#2' }, // 第二行
  ], // 行结束
  tasks: [ // 定义任务数组
    { id: 'task-1', type: 'build', title: '建造A', rowId: 'worker-1', start: '2025-10-11T08:30:00Z', durationMin: 60 }, // 第一任务
    { id: 'task-2', type: 'build', title: '建造B', rowId: 'worker-1', start: '2025-10-11T09:15:00Z', durationMin: 30 }, // 第二任务（与任务一重叠）
    { id: 'task-3', type: 'build', title: '建造C', rowId: 'worker-2', start: '2025-10-11T09:00:00Z', durationMin: 45 }, // 第三任务
  ], // 任务结束
}; // 排程结束

describe('GanttLayout', () => { // 描述测试套件
  it('timeToX 与 xToTime 互逆', () => { // 定义互逆测试
    const layout = new GanttLayout(scheduler); // 创建布局实例
    const time = '2025-10-11T10:00:00Z'; // 目标时间
    const x = layout.timeToX(time); // 转换为坐标
    const roundTrip = layout.xToTime(x).toISOString(); // 再转换回时间
    expect(roundTrip).toBe(new Date(time).toISOString()); // 断言互逆
  }); // 测试结束

  it('缩放后坐标变化', () => { // 定义缩放测试
    const layout = new GanttLayout(scheduler, { zoom: 1 }); // 创建默认缩放布局
    const baseX = layout.timeToX('2025-10-11T08:30:00Z'); // 计算初始坐标
    layout.updateOptions({ zoom: 2 }); // 更新缩放
    const zoomedX = layout.timeToX('2025-10-11T08:30:00Z'); // 重新计算坐标
    expect(zoomedX).toBeGreaterThan(baseX); // 期望缩放后坐标变大
  }); // 测试结束

  it('同一行检测重叠', () => { // 定义重叠测试
    const layout = new GanttLayout(scheduler); // 创建布局实例
    const overlaps = layout.detectOverlap('worker-1', 'task-2'); // 检查重叠
    expect(overlaps).toBe(true); // 期望发现重叠
    const separate = layout.detectOverlap('worker-2', 'task-3'); // 检查另一行
    expect(separate).toBe(false); // 期望无重叠
  }); // 测试结束
}); // 套件结束
