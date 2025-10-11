export type QuestKind = 'main' | 'side'; // 定义任务类型，区分主线或支线
export type StepType = 'collect' | 'talk' | 'reach' | 'equip' | 'state'; // 定义步骤类型枚举
// 分隔注释 // 保持行有注释
export interface Reward { // 定义奖励结构接口
  gold?: number; // 可选金币奖励
  items?: { id: string; name: string; count: number }[]; // 可选物品奖励数组
  achievement?: string; // 可选成就ID，用于联动成就系统
} // 接口结束
// 分隔注释 // 保持行有注释
export interface Step { // 定义任务步骤接口
  id: string; // 步骤唯一ID
  type: StepType; // 步骤类型
  title: string; // 步骤标题，用于UI展示
  desc?: string; // 可选的详细描述
  itemId?: string; // collect类型对应物品ID
  count?: number; // collect类型所需数量
  npcId?: string; // talk类型对应NPC ID
  targetX?: number; // reach类型目标X坐标（网格）
  targetY?: number; // reach类型目标Y坐标（网格）
  radius?: number; // reach类型允许误差半径
  equipId?: string; // equip类型预留装备ID
  stateKey?: string; // state类型预留状态键
  stateValue?: number; // state类型预留状态值
} // 接口结束
// 分隔注释 // 保持行有注释
export interface QuestDef { // 定义任务配置接口
  id: string; // 任务唯一ID
  kind: QuestKind; // 任务类型
  title: string; // 任务标题
  desc: string; // 任务简介
  steps: Step[]; // 任务步骤数组
  rewards?: Reward; // 可选奖励配置
  autoStart?: boolean; // 是否开局自动接取
  unlockBy?: { achievement?: string }; // 可选解锁条件，当前支持成就
} // 接口结束
// 分隔注释 // 保持行有注释
export type QuestStatus = 'locked' | 'active' | 'completed'; // 定义任务状态枚举
// 分隔注释 // 保持行有注释
export interface QuestProgress { // 定义任务进度接口
  questId: string; // 对应任务ID
  status: QuestStatus; // 当前状态
  currentStepIndex: number; // 当前进行到的步骤索引
  counters: Record<string, number>; // 步骤计数器映射
  tracked?: boolean; // 是否被追踪
} // 接口结束
