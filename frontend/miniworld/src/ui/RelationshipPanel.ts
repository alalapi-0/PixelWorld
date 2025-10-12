// 引入好感系统
import { RelationshipSystem } from "../npc/RelationshipSystem"; // 好感逻辑
// 定义渲染结果
export interface RelationshipDisplay { // 面板显示结构
  npcId: string; // NPC ID
  hearts: string; // 心形文本
  detail: string; // 详细信息
} // 结束接口
// 面板类
export class RelationshipPanel { // 文本面板
  constructor(private relations: RelationshipSystem) {} // 保存好感系统
  render(npcId: string): RelationshipDisplay { // 渲染指定 NPC
    const state = this.relations.getState(npcId); // 获取状态
    const levels = this.relations.getLevels().sort((a, b) => a.min - b.min); // 获取排序后的等级
    const level = this.relations.getLevel(npcId); // 获取当前段位
    const index = levels.findIndex(item => item.name === level.name); // 定位段位索引
    const nextThreshold = levels[index + 1]?.min ?? state.affinity; // 下一阈值
    const maxValue = Math.max(nextThreshold, state.affinity || 1); // 计算最大值
    const ratio = Math.min(1, state.affinity / (maxValue || 1)); // 计算进度比例
    const filled = Math.round(ratio * 4); // 计算填充心数
    const hearts = "❤".repeat(filled) + "♡".repeat(4 - filled); // 构建心形文本
    const detail = `${state.affinity}/${nextThreshold}（${level.name}）`; // 详细描述
    return { npcId, hearts, detail }; // 返回渲染
  } // 结束方法
} // 结束类
