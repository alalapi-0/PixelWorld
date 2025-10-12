// 定义节日基础结构
export interface FestivalDefinition { // 描述节日
  name: string; // 名称
  date: string; // 日期文本
  open: string; // 开放时间段
  activities: string[]; // 活动描述
  rewards: string[]; // 奖励 ID 列表
} // 结束接口
// 定义奖励描述
export interface FestivalRewardInfo { // 奖励信息
  title: string; // 标题
  description: string; // 描述
  inventoryTag: string; // 背包标签
} // 结束接口
// 定义日历映射
export type FestivalCalendar = Record<string, FestivalDefinition>; // 节日字典
// 定义奖励映射
export type FestivalRewards = Record<string, FestivalRewardInfo>; // 奖励字典
// 定义时间上下文
export interface FestivalContext { // 当前时间环境
  season: string; // 当前季节
  day: number; // 当前日期
  time: string; // 当前时间
} // 结束接口
// 定义存档结构
export interface FestivalState { // 存档数据
  claimedRewards: string[]; // 已领取奖励
  lastFestivalId?: string; // 上次参与节日
} // 结束接口
// 节日管理器主体
export class FestivalManager { // 管理节日逻辑
  private state: FestivalState; // 存档数据
  constructor(private calendar: FestivalCalendar, private rewards: FestivalRewards, initialState?: FestivalState) { // 构造函数
    this.state = initialState ? { ...initialState } : { claimedRewards: [] }; // 初始化状态
  } // 结束构造
  getFestivalForDate(season: string, day: number): { id: string; definition: FestivalDefinition } | null { // 根据日期查节日
    const target = `${capitalize(season)}-${String(day).padStart(2, "0")}`; // 构建日期文本
    for (const [id, def] of Object.entries(this.calendar)) { // 遍历节日
      if (def.date === target) { // 比较日期
        return { id, definition: def }; // 返回结果
      } // 结束条件
    } // 结束遍历
    return null; // 未找到
  } // 结束方法
  isFestivalOpen(context: FestivalContext): { active: boolean; id?: string; definition?: FestivalDefinition } { // 判断开放
    const info = this.getFestivalForDate(context.season, context.day); // 查找节日
    if (!info) { // 若无
      return { active: false }; // 返回未开放
    } // 结束条件
    const [start, end] = info.definition.open.split("-"); // 拆分时间
    const active = context.time >= start && context.time <= end; // 判断是否在窗口
    return { active, id: info.id, definition: info.definition }; // 返回结果
  } // 结束方法
  completeFestival(festivalId: string): FestivalRewardInfo[] { // 完成节日
    const definition = this.calendar[festivalId]; // 获取定义
    if (!definition) { // 若不存在
      return []; // 返回空
    } // 结束条件
    this.state.lastFestivalId = festivalId; // 更新状态
    const rewards = definition.rewards.map(id => this.rewards[id]).filter(Boolean); // 映射奖励
    rewards.forEach(reward => { // 遍历奖励
      if (reward && !this.state.claimedRewards.includes(reward.title)) { // 如果未领取
        this.state.claimedRewards.push(reward.title); // 记录领取
      } // 结束条件
    }); // 结束遍历
    return rewards; // 返回奖励
  } // 结束方法
  getUpcomingFestivals(season: string, day: number): { id: string; definition: FestivalDefinition; daysUntil: number }[] { // 查询即将到来
    const results: { id: string; definition: FestivalDefinition; daysUntil: number }[] = []; // 准备结果
    Object.entries(this.calendar).forEach(([id, def]) => { // 遍历节日
      const [defSeason, defDay] = def.date.split("-"); // 拆分
      if (defSeason.toLowerCase() === season.toLowerCase()) { // 同季节
        const diff = Number(defDay) - day; // 计算差值
        if (diff >= 0) { // 未来或当日
          results.push({ id, definition: def, daysUntil: diff }); // 加入结果
        } // 结束条件
      } // 结束条件
    }); // 结束遍历
    return results.sort((a, b) => a.daysUntil - b.daysUntil); // 按天数排序
  } // 结束方法
  getRewardInfo(rewardId: string): FestivalRewardInfo | undefined { // 查询奖励信息
    return this.rewards[rewardId]; // 返回对应奖励
  } // 结束方法
  exportState(): FestivalState { // 导出存档
    return JSON.parse(JSON.stringify(this.state)); // 深拷贝返回
  } // 结束方法
} // 结束类
// 辅助函数
function capitalize(value: string): string { // 首字母大写
  if (!value) { // 若为空
    return value; // 直接返回
  } // 结束条件
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(); // 构建文本
} // 结束函数
