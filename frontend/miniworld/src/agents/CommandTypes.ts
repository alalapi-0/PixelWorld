// 定义二维坐标结构
export interface CommandPosition { x: number; y: number; } // 声明命令坐标接口
// 定义库存常量类型
export type StockpileKeyword = 'STOCKPILE'; // 声明仓储关键字常量
// 定义资源需求结构
export interface CommandResourceCost { id: string; count: number; } // 声明资源消耗结构
// 定义基础命令联合类型
export type Command = // 声明命令联合类型
  | { kind: 'build'; blueprintId: string; at: CommandPosition; costOverride?: CommandResourceCost[] } // 建造单点命令
  | { kind: 'build_line'; blueprintId: string; from: CommandPosition; to: CommandPosition } // 建造线段命令
  | { kind: 'collect'; itemId: string; count: number; from: CommandPosition | StockpileKeyword; to: CommandPosition | StockpileKeyword } // 采集命令
  | { kind: 'haul'; itemId: string; count: number; from: CommandPosition | StockpileKeyword; to: CommandPosition | StockpileKeyword }; // 搬运命令
// 定义解析错误结构
export interface CommandParseError { line: number; message: string; raw: string; } // 声明解析错误
// 定义解析结果结构
export interface CommandParseResult { commands: Command[]; errors: CommandParseError[]; lines: number[]; } // 声明解析结果
// 定义角色权限结构
export interface RolePermission { canCommand: boolean; canApprove: boolean; } // 声明单个角色权限
// 定义角色权限映射
export type RolePermissionMap = Record<string, RolePermission>; // 声明角色权限映射
// 定义策略禁区结构
export interface ForbiddenZone { x1: number; y1: number; x2: number; y2: number; } // 声明禁区矩形
// 定义策略配置结构
export interface CommandPolicy { // 声明策略接口
  maxApprovedPerMinute: number; // 每分钟最大审批数
  maxConcurrency: number; // 最大并发数
  forbiddenZones: ForbiddenZone[]; // 禁区列表
  allowedTasks: Command['kind'][]; // 允许的任务种类
} // 接口结束
// 定义送审条目结构
export interface InboxEntry { // 声明收件条目
  command: Command; // 原始命令
  issuerRole: string; // 发送者角色
  line: number; // 原始行号
} // 接口结束
// 定义送审结果中的问题结构
export interface InboxIssue { // 声明送审问题
  line: number; // 问题行号
  message: string; // 问题描述
  command?: Command; // 关联命令
} // 接口结束
// 定义送审结果结构
export interface InboxSubmitResult { // 声明送审结果
  entries: InboxEntry[]; // 通过的条目
  issues: InboxIssue[]; // 违规问题
  commands: Command[]; // 所有解析命令
  errors: CommandParseError[]; // 解析错误
} // 接口结束
