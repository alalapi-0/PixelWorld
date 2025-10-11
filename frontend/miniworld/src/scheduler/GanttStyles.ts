export const GANTT_STYLES = { // 定义甘特图的样式常量集合
  timelineHeight: 48, // 时间轴的高度
  rowHeight: 56, // 每一行资源的高度
  rowGap: 8, // 行与行之间的间距
  taskBarHeight: 32, // 任务条的默认高度
  taskPadding: 6, // 任务条内侧的留白
  dependencyStroke: 2, // 依赖线的描边宽度
  dependencyColor: 0x4a90e2, // 依赖线的颜色
  gridColor: 0xe0e0e0, // 网格线的颜色
  backgroundColor: 0x0b0b0f, // 场景背景颜色
  textColor: '#f5f5f5', // 文本渲染的颜色
  tickMinor: 20, // 小刻度间距（像素）
  tickMajor: 100, // 大刻度间距（像素）
  selectionColor: 0xffcc00, // 选择高亮颜色
  progressColor: 0x66bb6a, // 进度条颜色
  overdueColor: 0xef5350, // 超期标记颜色
  approvedColor: 0x42a5f5, // 审批状态颜色
  executingColor: 0xffb300, // 执行状态颜色
  doneColor: 0x7cb342, // 完成状态颜色
  pausedColor: 0x8d6e63, // 暂停状态颜色
} as const; // 使用常量断言确保类型稳定

export type GanttStyles = typeof GANTT_STYLES; // 导出样式类型方便其他模块引用
