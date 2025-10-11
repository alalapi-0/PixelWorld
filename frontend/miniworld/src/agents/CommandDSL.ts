import { Command, CommandParseError, CommandParseResult, CommandPosition, CommandResourceCost, StockpileKeyword } from './CommandTypes'; // 引入命令相关类型
// 空行用于分隔
const STOCKPILE: StockpileKeyword = 'STOCKPILE'; // 定义仓储关键字常量
// 空行用于分隔
function parsePosition(token: string): CommandPosition | null { // 解析坐标字符串
  const match = token.trim().match(/^\(([-\d]+),([-\d]+)\)$/); // 使用正则匹配形如(x,y)
  if (!match) { // 如果未匹配
    return null; // 返回空表示失败
  } // 条件结束
  return { x: Number(match[1]), y: Number(match[2]) }; // 构造坐标对象
} // 函数结束
// 空行用于分隔
function parseCost(segment: string): CommandResourceCost[] | null { // 解析材料覆盖串
  if (!segment.trim()) { // 如果为空
    return []; // 返回空数组
  } // 条件结束
  const parts = segment.split(',').map((item) => item.trim()).filter(Boolean); // 拆分并去空
  const result: CommandResourceCost[] = []; // 初始化结果数组
  for (const part of parts) { // 遍历每段
    const [id, countText] = part.split('='); // 按等号拆分
    const count = Number(countText); // 转换数量
    if (!id || Number.isNaN(count)) { // 校验合法性
      return null; // 解析失败返回空
    } // 条件结束
    result.push({ id: id.trim(), count }); // 写入结果数组
  } // 循环结束
  return result; // 返回解析结果
} // 函数结束
// 空行用于分隔
function parseLocation(token: string): CommandPosition | StockpileKeyword | null { // 解析位置或仓储
  const upper = token.trim().toUpperCase(); // 获取大写文本
  if (upper === STOCKPILE) { // 如果是仓储关键字
    return STOCKPILE; // 返回仓储
  } // 条件结束
  return parsePosition(token); // 尝试解析坐标
} // 函数结束
// 空行用于分隔
function makeError(line: number, raw: string, message: string): CommandParseError { // 构造错误对象
  return { line, raw, message }; // 返回错误结构
} // 函数结束
// 空行用于分隔
function parseBuild(line: string, lineNumber: number, errors: CommandParseError[]): Command | null { // 解析建造命令
  const linePattern = /^BUILD\s+(\w+)\s+line\s+from\s+(\([^\)]+\))\s+to\s+(\([^\)]+\))$/i; // 定义线建造正则
  const singlePattern = /^BUILD\s+(\w+)(?:\s+using\s+([^@]+?))?\s+at\s+(\([^\)]+\))$/i; // 定义单点建造正则
  const lineMatch = line.match(linePattern); // 尝试匹配线命令
  if (lineMatch) { // 如果匹配线命令
    const from = parsePosition(lineMatch[2]); // 解析起点
    const to = parsePosition(lineMatch[3]); // 解析终点
    if (!from || !to) { // 校验解析结果
      errors.push(makeError(lineNumber, line, '无法解析建造线坐标')); // 记录错误
      return null; // 返回空
    } // 条件结束
    return { kind: 'build_line', blueprintId: lineMatch[1], from, to }; // 返回线建造命令
  } // 条件结束
  const singleMatch = line.match(singlePattern); // 尝试匹配单点建造
  if (!singleMatch) { // 如果未匹配
    errors.push(makeError(lineNumber, line, '无法识别的建造语句')); // 记录错误
    return null; // 返回空
  } // 条件结束
  const at = parsePosition(singleMatch[3]); // 解析坐标
  if (!at) { // 如果解析失败
    errors.push(makeError(lineNumber, line, '建造坐标格式错误')); // 记录错误
    return null; // 返回空
  } // 条件结束
  const costSegment = singleMatch[2] ?? ''; // 获取材料字符串
  const cost = parseCost(costSegment); // 解析材料
  if (cost === null) { // 如果解析失败
    errors.push(makeError(lineNumber, line, '材料覆盖格式错误')); // 记录错误
    return null; // 返回空
  } // 条件结束
  return cost.length > 0 // 根据材料存在与否创建命令
    ? { kind: 'build', blueprintId: singleMatch[1], at, costOverride: cost } // 返回带材料建造命令
    : { kind: 'build', blueprintId: singleMatch[1], at }; // 返回默认建造命令
} // 函数结束
// 空行用于分隔
function parseCollect(line: string, lineNumber: number, errors: CommandParseError[]): Command | null { // 解析采集命令
  const pattern = /^COLLECT\s+(\w+)\s+(\d+)\s+from\s+(.+?)\s+to\s+(.+)$/i; // 定义采集正则
  const match = line.match(pattern); // 执行匹配
  if (!match) { // 如果匹配失败
    errors.push(makeError(lineNumber, line, '无法识别的采集语句')); // 记录错误
    return null; // 返回空
  } // 条件结束
  const from = parseLocation(match[3]); // 解析来源
  const to = parseLocation(match[4]); // 解析目的地
  if (!from || !to) { // 校验位置
    errors.push(makeError(lineNumber, line, '采集来源或目的地无效')); // 记录错误
    return null; // 返回空
  } // 条件结束
  return { kind: 'collect', itemId: match[1], count: Number(match[2]), from, to }; // 返回采集命令
} // 函数结束
// 空行用于分隔
function parseHaul(line: string, lineNumber: number, errors: CommandParseError[]): Command | null { // 解析搬运命令
  const pattern = /^HAUL\s+(\w+)\s+(\d+)\s+from\s+(.+?)\s+to\s+(.+)$/i; // 定义搬运正则
  const match = line.match(pattern); // 执行匹配
  if (!match) { // 如果匹配失败
    errors.push(makeError(lineNumber, line, '无法识别的搬运语句')); // 记录错误
    return null; // 返回空
  } // 条件结束
  const from = parseLocation(match[3]); // 解析来源
  const to = parseLocation(match[4]); // 解析目的地
  if (!from || !to) { // 校验位置
    errors.push(makeError(lineNumber, line, '搬运来源或目的地无效')); // 记录错误
    return null; // 返回空
  } // 条件结束
  return { kind: 'haul', itemId: match[1], count: Number(match[2]), from, to }; // 返回搬运命令
} // 函数结束
// 空行用于分隔
function parseSegment(segment: string, lineNumber: number, errors: CommandParseError[]): Command | null { // 解析单段语句
  const trimmed = segment.trim(); // 去除首尾空白
  if (!trimmed) { // 如果为空
    return null; // 返回空
  } // 条件结束
  if (trimmed.toUpperCase().startsWith('BUILD ')) { // 判断是否建造
    return parseBuild(trimmed, lineNumber, errors); // 解析建造
  } // 条件结束
  if (trimmed.toUpperCase().startsWith('COLLECT ')) { // 判断是否采集
    return parseCollect(trimmed, lineNumber, errors); // 解析采集
  } // 条件结束
  if (trimmed.toUpperCase().startsWith('HAUL ')) { // 判断是否搬运
    return parseHaul(trimmed, lineNumber, errors); // 解析搬运
  } // 条件结束
  errors.push(makeError(lineNumber, segment, '未知命令类型')); // 记录未知命令
  return null; // 返回空
} // 函数结束
// 空行用于分隔
export function parseCommandScript(script: string): CommandParseResult { // 暴露批令解析函数
  const commands: Command[] = []; // 初始化命令列表
  const errors: CommandParseError[] = []; // 初始化错误列表
  const commandLines: number[] = []; // 初始化行号列表
  const rawLines = script.split(/\r?\n/); // 按行拆分脚本
  rawLines.forEach((rawLine, index) => { // 遍历每一行
    const trimmed = rawLine.trim(); // 预处理空白
    if (trimmed === '' || trimmed.startsWith('#')) { // 如果为空或注释
      return; // 跳过处理
    } // 条件结束
    const segments = rawLine.split('->'); // 按管道拆分
    segments.forEach((segment) => { // 遍历每个片段
      const command = parseSegment(segment, index + 1, errors); // 解析片段
      if (command) { // 如果解析成功
        commands.push(command); // 写入命令列表
        commandLines.push(index + 1); // 记录对应行号
      } // 条件结束
    }); // 内层遍历结束
  }); // 外层遍历结束
  return { commands, errors, lines: commandLines }; // 返回结果
} // 函数结束
