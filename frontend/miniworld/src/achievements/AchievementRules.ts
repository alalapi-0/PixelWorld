export interface AchievementMatch { // 声明成就匹配条件
  type?: string; // 匹配事件类型
  blueprintId?: string; // 匹配蓝图
  perf?: string; // 匹配绩效标签
} // 接口结束
// 空行用于分隔
export interface AchievementDefinition { // 声明成就定义
  id: string; // 成就标识
  title: string; // 成就标题
  threshold: number; // 触发阈值
  match: AchievementMatch; // 匹配条件
} // 接口结束
// 空行用于分隔
export interface AchievementEvent { // 声明事件结构
  type: string; // 事件类型
  blueprintId?: string; // 蓝图标识
  perfTag?: string; // 绩效标签
} // 接口结束
// 空行用于分隔
export type AchievementUnlockHandler = (id: string, title?: string) => void; // 声明解锁回调类型
// 空行用于分隔
export class AchievementRules { // 定义成就规则类
  private rules: AchievementDefinition[]; // 保存规则
  private counters: Map<string, number>; // 保存计数
  private unlocked: Set<string>; // 保存已解锁ID
  private handler: AchievementUnlockHandler; // 保存回调
  public constructor(rules: AchievementDefinition[], handler: AchievementUnlockHandler) { // 构造函数
    this.rules = [...rules]; // 拷贝规则
    this.counters = new Map(); // 初始化计数
    this.unlocked = new Set(); // 初始化解锁集合
    this.handler = handler; // 保存回调
  } // 构造结束
  public static fromConfig(config: { achievements: AchievementDefinition[] }, handler: AchievementUnlockHandler): AchievementRules { // 从配置构建
    return new AchievementRules(config.achievements ?? [], handler); // 创建实例
  } // 方法结束
  public process(event: AchievementEvent): void { // 处理事件
    this.rules.forEach((rule) => { // 遍历所有规则
      if (!this.matches(rule.match, event)) { // 判断是否匹配
        return; // 不匹配则跳过
      } // 条件结束
      const next = (this.counters.get(rule.id) ?? 0) + 1; // 自增计数
      this.counters.set(rule.id, next); // 写入计数
      if (next >= rule.threshold && !this.unlocked.has(rule.id)) { // 判断是否达成
        this.unlocked.add(rule.id); // 标记已解锁
        this.handler(rule.id, rule.title); // 调用回调
      } // 条件结束
    }); // 遍历结束
  } // 方法结束
  private matches(match: AchievementMatch, event: AchievementEvent): boolean { // 匹配逻辑
    if (match.type && match.type !== event.type) { // 类型不符
      return false; // 返回不匹配
    } // 条件结束
    if (match.blueprintId && match.blueprintId !== event.blueprintId) { // 蓝图不符
      return false; // 返回不匹配
    } // 条件结束
    if (match.perf && match.perf !== event.perfTag) { // 绩效不符
      return false; // 返回不匹配
    } // 条件结束
    return true; // 通过所有条件
  } // 方法结束
  public getProgress(): Record<string, { count: number; unlocked: boolean; threshold: number; title: string }> { // 返回进度
    const result: Record<string, { count: number; unlocked: boolean; threshold: number; title: string }> = {}; // 初始化结果
    this.rules.forEach((rule) => { // 遍历规则
      result[rule.id] = { // 写入结构
        count: this.counters.get(rule.id) ?? 0, // 当前计数
        unlocked: this.unlocked.has(rule.id), // 是否解锁
        threshold: rule.threshold, // 阈值
        title: rule.title, // 标题
      }; // 对象结束
    }); // 遍历结束
    return result; // 返回结果
  } // 方法结束
} // 类结束
