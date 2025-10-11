import policyConfig from '../../assets/agents/policies.json'; // 引入默认策略
import { parseCommandScript } from './CommandDSL'; // 引入命令解析器
import { AgentAPI, AgentTask } from '../build/AgentAPI'; // 引入任务队列
import { AgentLog } from './AgentLog'; // 引入日志系统
import { Command, CommandPolicy, InboxEntry, InboxIssue, InboxSubmitResult } from './CommandTypes'; // 引入类型定义
// 空行用于分隔
interface CommandWithLine { command: Command; line: number; } // 定义带行号命令
// 空行用于分隔
function isInZone(x: number, y: number, policy: CommandPolicy): boolean { // 判断坐标是否在禁区
  return policy.forbiddenZones.some((zone) => x >= zone.x1 && x <= zone.x2 && y >= zone.y1 && y <= zone.y2); // 判断是否落入矩形
} // 函数结束
// 空行用于分隔
function convertCommand(command: Command, line: number, issues: InboxIssue[]): CommandWithLine[] { // 将命令展开为基本命令
  if (command.kind !== 'build_line') { // 如果不是线建造
    return [{ command, line }]; // 直接返回原命令
  } // 条件结束
  const results: CommandWithLine[] = []; // 初始化结果数组
  if (command.from.x !== command.to.x && command.from.y !== command.to.y) { // 检查是否非轴对齐
    issues.push({ line, message: '仅支持水平或垂直建造线', command }); // 记录问题
    return results; // 返回空列表
  } // 条件结束
  const stepX = command.from.x === command.to.x ? 0 : command.from.x < command.to.x ? 1 : -1; // 计算X方向步长
  const stepY = command.from.y === command.to.y ? 0 : command.from.y < command.to.y ? 1 : -1; // 计算Y方向步长
  let cursorX = command.from.x; // 当前X
  let cursorY = command.from.y; // 当前Y
  results.push({ command: { kind: 'build', blueprintId: command.blueprintId, at: { x: cursorX, y: cursorY } }, line }); // 添加起点命令
  while (cursorX !== command.to.x || cursorY !== command.to.y) { // 循环直到终点
    cursorX += stepX; // 沿X移动
    cursorY += stepY; // 沿Y移动
    results.push({ command: { kind: 'build', blueprintId: command.blueprintId, at: { x: cursorX, y: cursorY } }, line }); // 添加沿线命令
  } // 循环结束
  return results; // 返回展开后的命令
} // 函数结束
// 空行用于分隔
function toAgentTask(command: Command): AgentTask | null { // 将命令转换为任务
  if (command.kind === 'build') { // 建造命令
    return { type: 'build', x: command.at.x, y: command.at.y, blueprintId: command.blueprintId, cost: command.costOverride }; // 返回建造任务
  } // 条件结束
  if (command.kind === 'collect') { // 采集命令
    return { type: 'collect', itemId: command.itemId, count: command.count, from: command.from, to: command.to }; // 返回采集任务
  } // 条件结束
  if (command.kind === 'haul') { // 搬运命令
    return { type: 'haul', itemId: command.itemId, count: command.count, from: command.from, to: command.to }; // 返回搬运任务
  } // 条件结束
  return null; // 其他情况返回空
} // 函数结束
// 空行用于分隔
export class CommanderInbox { // 定义指令收件箱
  private api: AgentAPI; // 任务队列引用
  private log: AgentLog; // 日志引用
  private policy: CommandPolicy; // 策略配置
  private recent: number[] = []; // 近期提交时间戳
  public constructor(api: AgentAPI, log: AgentLog, policy?: CommandPolicy) { // 构造函数
    this.api = api; // 保存队列
    this.log = log; // 保存日志
    this.policy = policy ?? (policyConfig as CommandPolicy); // 加载策略
  } // 构造结束
  private checkRateLimit(count: number): boolean { // 检查频率限制
    const now = Date.now(); // 当前时间
    this.recent = this.recent.filter((stamp) => now - stamp < 60000); // 保留一分钟内记录
    return this.recent.length + count <= this.policy.maxApprovedPerMinute; // 返回是否超限
  } // 方法结束
  private recordSubmission(): void { // 记录提交时间
    this.recent.push(Date.now()); // 写入当前时间
  } // 方法结束
  private hasSlot(): boolean { // 检查并发槽位
    const active = this.api.countByState('approved') + this.api.countByState('executing'); // 计算当前占用
    return active < this.policy.maxConcurrency; // 判断是否低于上限
  } // 方法结束
  public submit(text: string, issuerRole: string): InboxSubmitResult { // 处理提交
    const parse = parseCommandScript(text); // 解析文本
    const issues: InboxIssue[] = []; // 初始化问题列表
    const accepted: InboxEntry[] = []; // 初始化通过列表
    const expanded: CommandWithLine[] = []; // 初始化展开命令
    parse.commands.forEach((command, index) => { // 遍历命令
      const line = parse.lines[index] ?? index + 1; // 读取行号
      const converted = convertCommand(command, line, issues); // 展开命令
      converted.forEach((item) => expanded.push(item)); // 追加结果
    }); // 遍历结束
    expanded.forEach((item) => { // 遍历展开命令
      if (!this.checkRateLimit(1)) { // 检查频率
        issues.push({ line: item.line, message: '超过每分钟提交上限', command: item.command }); // 记录问题
        return; // 跳过
      } // 条件结束
      if (!this.policy.allowedTasks.includes(item.command.kind === 'build' ? 'build' : item.command.kind)) { // 检查任务类型
        issues.push({ line: item.line, message: '任务类型未被允许', command: item.command }); // 记录问题
        return; // 跳过
      } // 条件结束
      if (item.command.kind === 'build' && isInZone(item.command.at.x, item.command.at.y, this.policy)) { // 检查建造禁区
        issues.push({ line: item.line, message: '目标位于禁区', command: item.command }); // 记录问题
        return; // 跳过
      } // 条件结束
      if (!this.hasSlot()) { // 检查并发
        issues.push({ line: item.line, message: '超出并发上限', command: item.command }); // 记录问题
        return; // 跳过
      } // 条件结束
      const task = toAgentTask(item.command); // 转换为任务
      if (!task) { // 如果无法转换
        issues.push({ line: item.line, message: '无法转换为任务', command: item.command }); // 记录问题
        return; // 跳过
      } // 条件结束
      const record = this.api.submitTask(task, { issuerRole, sourceLine: item.line }); // 写入队列
      this.api.attachCommand(record.id, item.command); // 附加命令信息
      this.log.info('inbox', `接收命令：${record.summary}`, record.id, { line: item.line }); // 记录日志
      accepted.push({ command: item.command, issuerRole, line: item.line }); // 记录通过
      this.recordSubmission(); // 记录频率
    }); // 遍历结束
    return { entries: accepted, issues, commands: expanded.map((item) => item.command), errors: parse.errors }; // 返回结果
  } // 方法结束
} // 类结束
