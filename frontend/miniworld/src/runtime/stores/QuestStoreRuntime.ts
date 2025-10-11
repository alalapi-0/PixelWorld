// 引入任务定义与进度类型
import type { QuestDef, QuestProgress } from '../../quest/QuestTypes'; // 使用任务类型约束

// 定义任务运行时仓库
export class QuestStoreRuntime { // 声明任务运行时仓库类
  private quests: QuestDef[] = []; // 当前任务定义列表
  private archivedQuestIds: Set<string> = new Set(); // 被下线任务集合
  private versionCounter = 0; // 版本计数器
  private lastUpdated = 0; // 最近更新时间戳
  private progressMap: Map<string, QuestProgress> = new Map(); // 存储任务进度

  // 初始化加载任务定义并可选注入历史进度
  public load(initial: QuestDef[], progress?: QuestProgress[]): void { // 定义初始加载方法
    this.quests = initial.slice(); // 保存任务定义副本
    this.archivedQuestIds.clear(); // 清空下线标记
    this.progressMap.clear(); // 清空旧进度
    if (progress) { // 若提供历史进度
      progress.forEach((entry) => { // 遍历进度列表
        this.progressMap.set(entry.questId, { ...entry }); // 保存进度副本
      }); // 遍历结束
    } // 分支结束
    this.quests.forEach((quest) => { // 遍历任务定义
      if (!this.progressMap.has(quest.id)) { // 若缺少进度
        this.progressMap.set(quest.id, this.createDefaultProgress(quest)); // 使用默认进度初始化
      } // 分支结束
    }); // 遍历结束
    this.bumpVersion(); // 更新版本信息
  } // 方法结束

  // 获取当前任务定义
  public getQuests(): QuestDef[] { // 定义任务读取方法
    return this.quests.slice(); // 返回浅拷贝
  } // 方法结束

  // 查询任务是否被归档
  public isQuestArchived(id: string): boolean { // 定义任务归档查询
    return this.archivedQuestIds.has(id); // 返回集合命中结果
  } // 方法结束

  // 查询任务进度
  public getProgress(id: string): QuestProgress | undefined { // 定义进度查询方法
    const progress = this.progressMap.get(id); // 读取进度
    return progress ? { ...progress } : undefined; // 返回副本或undefined
  } // 方法结束

  // 更新任务进度
  public setProgress(progress: QuestProgress): void { // 定义进度写入方法
    this.progressMap.set(progress.questId, { ...progress }); // 保存进度副本
  } // 方法结束

  // 导出全部进度用于存档
  public snapshotProgress(): QuestProgress[] { // 定义进度快照方法
    return Array.from(this.progressMap.values()).map((entry) => ({ ...entry })); // 返回副本数组
  } // 方法结束

  // 热重载入口，用新的任务定义替换旧数据
  public reloadFrom(next: QuestDef[]): void { // 定义热重载方法
    const currentIds = new Set(this.quests.map((quest) => quest.id)); // 收集旧任务ID
    const nextIds = new Set(next.map((quest) => quest.id)); // 收集新任务ID
    currentIds.forEach((id) => { // 遍历旧任务ID
      if (!nextIds.has(id)) { // 若新数据缺少该任务
        this.archivedQuestIds.add(id); // 标记任务归档
      } // 分支结束
    }); // 遍历结束
    next.forEach((quest) => { // 遍历新任务
      if (!this.progressMap.has(quest.id)) { // 若缺少进度
        this.progressMap.set(quest.id, this.createDefaultProgress(quest)); // 初始化默认进度
      } // 分支结束
    }); // 遍历结束
    this.quests = next.slice(); // 更新任务定义
    this.bumpVersion(); // 更新版本号
  } // 方法结束

  // 获取当前版本字符串
  public getVersion(): string { // 定义版本访问器
    return `v${this.versionCounter}`; // 返回版本字符串
  } // 方法结束

  // 获取最近一次更新时间
  public getLastUpdated(): number { // 定义更新时间访问器
    return this.lastUpdated; // 返回时间戳
  } // 方法结束

  // 内部工具：生成默认任务进度
  private createDefaultProgress(quest: QuestDef): QuestProgress { // 定义默认进度生成函数
    return { // 返回默认进度对象
      questId: quest.id, // 关联任务ID
      status: quest.autoStart ? 'active' : 'locked', // 根据autoStart决定初始状态
      currentStepIndex: 0, // 默认从第一步开始
      counters: {}, // 初始化计数器为空
      tracked: false, // 默认不追踪
    }; // 对象结束
  } // 方法结束

  // 内部工具：更新时间戳与版本号
  private bumpVersion(): void { // 定义内部版本更新方法
    this.versionCounter += 1; // 增加版本计数
    this.lastUpdated = Date.now(); // 更新当前时间
  } // 方法结束
} // 类结束
