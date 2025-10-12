// 引入标签工具用于匹配
import { hasTag } from "../config/Tags"; // 检查物品标签
// 定义礼物偏好数据结构
export interface GiftPreference { // 描述 NPC 的礼物喜好
  like: string[]; // 喜欢的标签列表
  dislike: string[]; // 讨厌的标签列表
  love: string[]; // 热爱的标签列表
  hate: string[]; // 痛恨的标签列表
} // 结束接口
// 定义礼物评分结果
export interface GiftScore { // 礼物评分返回对象
  attitude: "love" | "like" | "neutral" | "dislike" | "hate"; // 态度标签
  affinityDelta: number; // 好感变化值
} // 结束接口
// 定义礼物规则主类
export class GiftRules { // 负责根据规则评估礼物
  private rules: Record<string, GiftPreference>; // 存储每个 NPC 的偏好
  constructor(rules: Record<string, GiftPreference>) { // 构造函数接收偏好数据
    this.rules = rules; // 保存偏好表
  } // 结束构造
  evaluate(npcId: string, itemId: string): GiftScore { // 根据 NPC 与物品计算分数
    const pref = this.rules[npcId]; // 获取 NPC 偏好
    if (!pref) { // 若未找到偏好
      return { attitude: "neutral", affinityDelta: 0 }; // 返回中性结果
    } // 结束条件
    const result = this.matchPreference(pref, itemId); // 执行匹配逻辑
    switch (result) { // 根据匹配结果转换为数值
      case "love": // 若为挚爱
        return { attitude: "love", affinityDelta: 3 }; // 提供高额好感
      case "like": // 若为喜欢
        return { attitude: "like", affinityDelta: 2 }; // 中等好感
      case "dislike": // 若为不喜欢
        return { attitude: "dislike", affinityDelta: -1 }; // 轻微下降
      case "hate": // 若为痛恨
        return { attitude: "hate", affinityDelta: -3 }; // 大幅下降
      default: // 其它情况
        return { attitude: "neutral", affinityDelta: 0 }; // 保持不变
    } // 结束分支
  } // 结束方法
  private matchPreference(pref: GiftPreference, itemId: string): GiftScore["attitude"] { // 内部匹配函数
    if (this.matches(pref.love, itemId)) { // 检查 love 列表
      return "love"; // 返回 love
    } // 结束条件
    if (this.matches(pref.like, itemId)) { // 检查 like 列表
      return "like"; // 返回 like
    } // 结束条件
    if (this.matches(pref.hate, itemId)) { // 检查 hate 列表
      return "hate"; // 返回 hate
    } // 结束条件
    if (this.matches(pref.dislike, itemId)) { // 检查 dislike 列表
      return "dislike"; // 返回 dislike
    } // 结束条件
    return "neutral"; // 默认中性
  } // 结束方法
  private matches(tags: string[], itemId: string): boolean { // 判断物品是否匹配标签
    return tags.some(tag => itemId === tag || hasTag(itemId, tag)); // 直接匹配或通过标签工具判断
  } // 结束方法
} // 结束类
