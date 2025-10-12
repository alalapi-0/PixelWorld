// 引入管理器
import { FestivalManager, FestivalDefinition } from "./FestivalManager"; // 节日管理器
// 定义渲染结果
export interface FestivalRender { // 界面文本
  title: string; // 标题
  activities: string[]; // 活动列表
  rewards: string[]; // 奖励列表
} // 结束接口
// 场景类
export class FestivalScene { // 节日界面
  constructor(private manager: FestivalManager) {} // 保存管理器
  render(definition: FestivalDefinition): FestivalRender { // 渲染节日
    const title = `${definition.name}（${definition.open}）`; // 标题
    const activities = definition.activities.map(activity => `· ${activity}`); // 活动文本
    const rewards = definition.rewards.map(rewardId => { // 奖励映射
      const info = this.manager.getRewardInfo(rewardId); // 查询奖励信息
      return info ? `奖励：${info.title}` : `奖励：${rewardId}`; // 优先显示标题
    }); // 映射结束
    return { title, activities, rewards }; // 返回渲染
  } // 结束方法
} // 结束类
