import Phaser from 'phaser'; // 引入Phaser以保持接口一致
import sampleData from './quests.sample.json'; // 引入内置示例任务表
import { QuestDef, QuestProgress, Step, StepType } from './QuestTypes'; // 引入任务相关类型
// 分隔注释 // 保持行有注释
interface QuestFile { quests: QuestDef[]; } // 定义任务文件结构
// 分隔注释 // 保持行有注释
function cloneStep(step: Step): Step { // 克隆步骤对象
  return { ...step }; // 返回浅拷贝以避免共享引用
} // 函数结束
// 分隔注释 // 保持行有注释
function cloneQuest(def: QuestDef): QuestDef { // 克隆任务对象
  return { ...def, steps: def.steps.map((step) => cloneStep(step)), rewards: def.rewards ? { ...def.rewards, items: def.rewards.items?.map((item) => ({ ...item })) } : undefined, unlockBy: def.unlockBy ? { ...def.unlockBy } : undefined }; // 返回深拷贝，确保嵌套结构独立
} // 函数结束
// 分隔注释 // 保持行有注释
async function loadExternal(): Promise<QuestFile | null> { // 尝试读取外部任务表
  if (typeof fetch !== 'function') { // 如果环境不支持fetch
    return null; // 直接返回空
  } // 条件结束
  try { // 捕获读取过程异常
    const response = await fetch('quests/quests.sample.json', { cache: 'no-cache' }); // 请求外部文件
    if (!response.ok) { // 如果请求失败
      return null; // 回落到内置数据
    } // 条件结束
    const data = (await response.json()) as QuestFile; // 解析JSON为任务文件
    return data; // 返回外部数据
  } catch (error) { // 捕获异常
    console.warn('[QuestStore] 外部任务读取失败', error); // 输出警告日志
    return null; // 返回空以使用内置数据
  } // 异常结束
} // 函数结束
// 分隔注释 // 保持行有注释
function ensureCounter(prog: QuestProgress, stepId: string): number { // 确保计数器存在
  const current = prog.counters[stepId]; // 读取当前计数
  if (current === undefined) { // 如果不存在
    prog.counters[stepId] = 0; // 初始化为0
    return 0; // 返回初始化值
  } // 条件结束
  return current; // 返回已有值
} // 函数结束
// 分隔注释 // 保持行有注释
function isStepComplete(prog: QuestProgress, step: Step): boolean { // 判断步骤是否完成
  const counter = ensureCounter(prog, step.id); // 获取当前计数
  if (step.type === 'collect') { // 如果是收集类型
    const target = step.count ?? 1; // 读取目标数量
    return counter >= target; // 比较是否达标
  } // 条件结束
  if (step.type === 'talk' || step.type === 'reach' || step.type === 'equip' || step.type === 'state') { // 如果是其他一步完成类型
    return counter > 0; // 有标记即视为完成
  } // 条件结束
  return false; // 默认未完成
} // 函数结束
// 分隔注释 // 保持行有注释
function createDefaultProgress(questId: string): QuestProgress { // 创建默认进度对象
  return { questId, status: 'locked', currentStepIndex: 0, counters: {}, tracked: false }; // 返回初始化结构
} // 函数结束
// 分隔注释 // 保持行有注释
export class QuestStore { // 定义任务存储类
  private definitions: QuestDef[] = []; // 存储任务定义
  private progresses: Map<string, QuestProgress> = new Map(); // 存储进度映射
  // 分隔注释 // 保持行有注释
  public constructor() { // 构造函数
    // 空构造用于初始化Map // 占位注释
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public async loadDefs(_scene: Phaser.Scene): Promise<void> { // 加载任务定义
    const external = await loadExternal(); // 尝试读取外部数据
    const source = external ?? (sampleData as QuestFile); // 决定使用的任务文件
    this.definitions = source.quests.map((quest) => cloneQuest(quest)); // 克隆并保存任务定义
    const existing: Map<string, QuestProgress> = new Map(); // 用于保留已有进度
    this.progresses.forEach((prog, questId) => { // 遍历旧进度
      existing.set(questId, { questId: prog.questId, status: prog.status, currentStepIndex: prog.currentStepIndex, counters: { ...prog.counters }, tracked: prog.tracked }); // 拷贝并保存
    }); // 遍历结束
    this.progresses.clear(); // 清理旧映射
    this.definitions.forEach((def) => { // 遍历新定义
      const oldProgress = existing.get(def.id); // 尝试读取旧进度
      if (oldProgress) { // 如果存在
        this.progresses.set(def.id, { ...oldProgress, counters: { ...oldProgress.counters } }); // 恢复进度
      } else { // 如果不存在
        this.progresses.set(def.id, createDefaultProgress(def.id)); // 创建默认进度
      } // 条件结束
    }); // 遍历结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public listAll(): QuestDef[] { // 返回全部任务定义
    return this.definitions.map((def) => cloneQuest(def)); // 返回拷贝数组避免外部修改
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getProgress(questId: string): QuestProgress | undefined { // 查询指定任务进度
    return this.progresses.get(questId); // 直接返回引用
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public listVisible(): { def: QuestDef; prog: QuestProgress }[] { // 列出可见任务
    return this.definitions.map((def) => ({ def, prog: this.progresses.get(def.id) ?? createDefaultProgress(def.id) })).filter((entry) => entry.prog.status === 'active' || entry.prog.status === 'completed').map((entry) => ({ def: cloneQuest(entry.def), prog: entry.prog })); // 过滤状态并返回
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public startIfNeeded(): void { // 自动接取任务
    this.definitions.forEach((def) => { // 遍历任务
      if (def.autoStart) { // 如果标记自动开始
        this.startQuest(def.id); // 启动任务
      } // 条件结束
    }); // 遍历结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public startQuest(questId: string): void { // 手动接取任务
    const progress = this.progresses.get(questId) ?? createDefaultProgress(questId); // 获取或创建进度
    progress.status = 'active'; // 更新状态为进行中
    if (progress.currentStepIndex >= (this.definitions.find((def) => def.id === questId)?.steps.length ?? 0)) { // 如果索引越界
      progress.currentStepIndex = 0; // 重置步骤索引
    } // 条件结束
    this.progresses.set(questId, progress); // 写回映射
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public toggleTrack(questId: string): void { // 切换追踪状态
    const progress = this.progresses.get(questId); // 获取进度
    if (!progress || progress.status === 'locked') { // 如果任务不可见
      return; // 不处理
    } // 条件结束
    progress.tracked = !progress.tracked; // 切换追踪布尔值
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public currentStep(questId: string): Step | null { // 获取当前步骤
    const def = this.definitions.find((item) => item.id === questId); // 查找任务定义
    const progress = this.progresses.get(questId); // 查找进度
    if (!def || !progress) { // 如果不存在
      return null; // 返回空
    } // 条件结束
    if (progress.status !== 'active') { // 如果任务非进行中
      return null; // 返回空
    } // 条件结束
    const step = def.steps[progress.currentStepIndex]; // 读取当前步骤
    return step ? cloneStep(step) : null; // 返回步骤拷贝
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getDefinition(questId: string): QuestDef | undefined { // 根据ID返回任务定义
    const def = this.definitions.find((item) => item.id === questId); // 查找定义
    return def ? cloneQuest(def) : undefined; // 返回拷贝
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public advanceIfComplete(questId: string): boolean { // 如果当前步骤完成则推进
    const def = this.definitions.find((item) => item.id === questId); // 获取任务定义
    const progress = this.progresses.get(questId); // 获取进度
    if (!def || !progress) { // 如果缺失
      return false; // 返回未推进
    } // 条件结束
    if (progress.status !== 'active') { // 如果任务未进行
      return false; // 返回未推进
    } // 条件结束
    const step = def.steps[progress.currentStepIndex]; // 获取当前步骤
    if (!step) { // 如果没有步骤
      return false; // 返回未推进
    } // 条件结束
    if (!isStepComplete(progress, step)) { // 如果未完成
      return false; // 返回未推进
    } // 条件结束
    progress.currentStepIndex += 1; // 推进到下一步
    if (progress.currentStepIndex >= def.steps.length) { // 如果超出步骤范围
      this.completeQuest(questId); // 将任务标记完成
    } else { // 仍有步骤
      ensureCounter(progress, def.steps[progress.currentStepIndex].id); // 预先初始化下一步计数
    } // 条件结束
    return true; // 返回已推进
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public completeQuest(questId: string): void { // 将任务设置为完成
    const progress = this.progresses.get(questId); // 获取进度
    const def = this.definitions.find((item) => item.id === questId); // 获取定义
    if (!progress || !def) { // 如果缺失
      return; // 不处理
    } // 条件结束
    progress.status = 'completed'; // 更新状态
    progress.currentStepIndex = def.steps.length; // 将索引定位到末尾
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public markStepProgress(questId: string, stepId: string, amount: number, mode: StepType): void { // 更新指定步骤的计数
    const progress = this.progresses.get(questId); // 获取进度
    if (!progress) { // 如果不存在
      return; // 不处理
    } // 条件结束
    if (progress.status !== 'active') { // 如果任务未激活
      return; // 不处理
    } // 条件结束
    if (amount <= 0 && mode === 'collect') { // 对于收集类型如果没有正增量
      return; // 不处理
    } // 条件结束
    const current = ensureCounter(progress, stepId); // 获取当前计数
    if (mode === 'collect') { // 如果是累计型
      progress.counters[stepId] = current + amount; // 累加计数
    } else { // 其他类型
      progress.counters[stepId] = 1; // 直接标记完成
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public toJSON(): { progresses: QuestProgress[] } { // 序列化进度
    return { progresses: Array.from(this.progresses.values()).map((prog) => ({ questId: prog.questId, status: prog.status, currentStepIndex: prog.currentStepIndex, counters: { ...prog.counters }, tracked: prog.tracked })) }; // 返回深拷贝数组
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public static fromJSON(json: { progresses?: QuestProgress[] } | undefined, defs: QuestDef[]): QuestStore { // 从JSON恢复
    const store = new QuestStore(); // 创建新实例
    store.definitions = defs.map((def) => cloneQuest(def)); // 保存任务定义拷贝
    defs.forEach((def) => { // 遍历定义
      store.progresses.set(def.id, createDefaultProgress(def.id)); // 初始化默认进度
    }); // 遍历结束
    const progresses = json?.progresses ?? []; // 读取存档数组
    progresses.forEach((prog) => { // 遍历存档
      if (!store.progresses.has(prog.questId)) { // 如果定义中不存在
        return; // 跳过未知任务
      } // 条件结束
      store.progresses.set(prog.questId, { questId: prog.questId, status: prog.status, currentStepIndex: prog.currentStepIndex, counters: { ...prog.counters }, tracked: prog.tracked }); // 恢复进度
    }); // 遍历结束
    return store; // 返回新实例
  } // 方法结束
} // 类结束
