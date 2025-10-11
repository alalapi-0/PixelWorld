export interface PathPoint { x: number; y: number; } // 定义路径节点
// 空行用于分隔
export type WalkableChecker = (x: number, y: number) => boolean; // 定义可行走检测函数类型
// 空行用于分隔
export class GridPathing { // 定义网格寻路类
  private isWalkable: WalkableChecker; // 保存可行走检测函数
  public constructor(checker?: WalkableChecker) { // 构造函数
    this.isWalkable = checker ?? (() => true); // 如果未传入则默认全部可行走
  } // 构造结束
  public estimateDistance(from: PathPoint, to: PathPoint): number { // 估算距离
    return Math.abs(from.x - to.x) + Math.abs(from.y - to.y); // 使用曼哈顿距离
  } // 方法结束
  public buildPath(from: PathPoint, to: PathPoint): PathPoint[] { // 构建简单路径
    const path: PathPoint[] = [{ x: from.x, y: from.y }]; // 初始化路径包含起点
    let currentX = from.x; // 当前X坐标
    let currentY = from.y; // 当前Y坐标
    while (currentX !== to.x) { // 沿X轴移动
      currentX += currentX < to.x ? 1 : -1; // 选择方向
      if (!this.isWalkable(currentX, currentY)) { // 检查可行走
        break; // 阻塞时停止
      } // 条件结束
      path.push({ x: currentX, y: currentY }); // 将新节点写入路径
    } // 循环结束
    while (currentY !== to.y) { // 沿Y轴移动
      currentY += currentY < to.y ? 1 : -1; // 选择方向
      if (!this.isWalkable(currentX, currentY)) { // 检查可行走
        break; // 阻塞时停止
      } // 条件结束
      path.push({ x: currentX, y: currentY }); // 写入路径
    } // 循环结束
    return path; // 返回路径序列
  } // 方法结束
} // 类结束
