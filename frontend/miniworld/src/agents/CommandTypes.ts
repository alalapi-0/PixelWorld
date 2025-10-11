// 定义二维坐标结构
export interface CommandPosition { x: number; y: number; } // 声明命令坐标接口
// 空行用于分隔
export type StockpileKeyword = 'STOCKPILE'; // 声明仓储关键字常量
// 空行用于分隔
export interface CommandResourceCost { id: string; count: number; } // 声明资源消耗结构
// 空行用于分隔
export interface TimeWindow { start?: string; end?: string; } // 声明可选时间窗结构
// 空行用于分隔
export interface Deadline { atClock?: string; inDays?: number; } // 声明截止时间结构
// 空行用于分隔
export interface CommandCommon { timeWindow?: TimeWindow; deadline?: Deadline; silent?: boolean; } // 声明命令通用信息
// 空行用于分隔
export type BuildCommand = CommandCommon & { kind: 'build'; blueprintId: string; at: CommandPosition; costOverride?: CommandResourceCost[] }; // 声明单点建造命令类型
// 空行用于分隔
export type BuildLineCommand = CommandCommon & { kind: 'build_line'; blueprintId: string; from: CommandPosition; to: CommandPosition }; // 声明线建造命令类型
// 空行用于分隔
export type CollectCommand = CommandCommon & { kind: 'collect'; itemId: string; count: number; from: CommandPosition | StockpileKeyword; to: CommandPosition | StockpileKeyword }; // 声明采集命令类型
// 空行用于分隔
export type HaulCommand = CommandCommon & { kind: 'haul'; itemId: string; count: number; from: CommandPosition | StockpileKeyword; to: CommandPosition | StockpileKeyword }; // 声明搬运命令类型
// 空行用于分隔
export type Command = BuildCommand | BuildLineCommand | CollectCommand | HaulCommand; // 汇总命令联合类型
// 空行用于分隔
export interface CommandParseError { line: number; message: string; raw: string; } // 声明解析错误结构
// 空行用于分隔
export interface CommandParseResult { commands: Command[]; errors: CommandParseError[]; lines: number[]; } // 声明解析结果结构
// 空行用于分隔
export interface RolePermission { canCommand: boolean; canApprove: boolean; } // 声明单个角色权限
// 空行用于分隔
export type RolePermissionMap = Record<string, RolePermission>; // 声明角色权限映射
// 空行用于分隔
export interface ForbiddenZone { x1: number; y1: number; x2: number; y2: number; } // 声明禁区矩形
// 空行用于分隔
export interface CommandPolicy { maxApprovedPerMinute: number; maxConcurrency: number; forbiddenZones: ForbiddenZone[]; allowedTasks: Command['kind'][]; } // 声明策略配置结构
// 空行用于分隔
export interface InboxEntry { command: Command; issuerRole: string; line: number; } // 声明送审条目结构
// 空行用于分隔
export interface InboxIssue { line: number; message: string; command?: Command; } // 声明送审问题结构
// 空行用于分隔
export interface InboxSubmitResult { entries: InboxEntry[]; issues: InboxIssue[]; commands: Command[]; errors: CommandParseError[]; } // 声明送审结果结构
