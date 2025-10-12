import { describe, it, expect, vi } from "vitest"; // 引入测试工具
import { DialogueEngine, DialogueData, DialogueContext } from "../../src/npc/DialogueEngine"; // 引入对话引擎
import { DialogueRunner } from "../../src/npc/DialogueRunner"; // 引入运行器
import { RelationshipSystem, RelationshipRules } from "../../src/npc/RelationshipSystem"; // 引入好感系统
import { GiftRules } from "../../src/npc/GiftRules"; // 引入礼物规则

// 构造样例对话数据
const sampleDialogue: DialogueData = { // 示例数据
  meta: { id: "npc", displayName: "测试", requiresPresence: true }, // 元数据
  vars: {}, // 无额外变量
  nodes: { // 节点集合
    start: { // 起始节点
      text: "你好，{{playerName}}，好感为{{relationship}}", // 含变量文本
      choices: [ // 选项列表
        { text: "送礼", next: "gift" }, // 普通跳转
        { text: "高级对话", next: "advanced", if: "relationship >= 20" } // 条件选项
      ], // 选项结束
      choicesFromInventory: { tag: "gift" } // 背包选项
    }, // 起始节点结束
    gift: { // 送礼节点
      text: "请选择礼物", // 文本
      onGift: { rules: "npc", effects: ["relationship:dynamic"] }, // 礼物效果
      next: "end" // 完成后结束
    }, // 送礼节点结束
    advanced: { // 高级节点
      text: "欢迎进入高级对话", // 文本
      next: "end" // 跳转结束
    }, // 高级节点结束
    end: { // 结束节点
      text: "再会", // 文本
      end: true // 标记结束
    } // 结束节点结束
  } // 节点集合结束
}; // 数据结束

// 构造好感规则
const relationRules: RelationshipRules = { // 好感规则
  levels: [ // 等级列表
    { name: "陌生", min: 0 }, // 等级一
    { name: "熟悉", min: 20 } // 等级二
  ], // 等级结束
  dailyCap: 5, // 每日上限
  decayPerDay: 0, // 不衰减
  unlockEvents: {} // 无解锁
}; // 规则结束

// 构造礼物规则
const giftRules = new GiftRules({ // 构建礼物规则
  npc: { like: ["gift"], dislike: [], love: [], hate: [] } // 简单偏好
}); // 规则构建结束

// 构造上下文
const baseContext: DialogueContext = { // 基础上下文
  relationship: 0, // 初始好感
  relationshipLevel: "陌生", // 初始等级
  time: "10:00", // 当前时间
  weather: "sunny", // 天气
  day: "Spring-01", // 日期
  season: "spring", // 季节
  playerName: "旅人", // 玩家名
  inventory: [ // 背包
    { id: "seed:turnip", name: "萝卜种子", quantity: 1, tags: ["gift", "item:seed"] }, // 种子
    { id: "stone", name: "石头", quantity: 1, tags: ["material:stone"] } // 石头
  ] // 背包结束
}; // 上下文结束

// 测试解析
describe("DialogueEngine", () => { // 描述块
  it("should interpolate text and filter choices", () => { // 测试变量替换与条件
    const engine = new DialogueEngine(sampleDialogue); // 创建引擎
    const resolved = engine.resolveNode("start", baseContext); // 解析节点
    expect(resolved.text).toContain("旅人"); // 检查文本包含玩家名
    expect(resolved.inventoryChoices.length).toBe(1); // 背包只留下礼物
    expect(resolved.choices.length).toBe(1); // 条件不满足只剩一个选项
  }); // 测试结束
}); // 描述结束

// 测试运行器
describe("DialogueRunner", () => { // 描述块
  it("should apply gift affinity", () => { // 测试送礼好感
    const relations = new RelationshipSystem(relationRules); // 创建好感系统
    relations.setCurrentDay("Spring-01"); // 设置日期
    const engine = new DialogueEngine(sampleDialogue); // 创建引擎
    const runner = new DialogueRunner(engine, relations, giftRules, { onGiftResolved: vi.fn() }, { npcId: "npc", context: { ...baseContext } }); // 创建运行器
    const current = runner.getCurrent(); // 获取当前节点
    expect(current?.choices[0].text).toBe("送礼"); // 确认选项
    runner.choose(0); // 进入送礼节点
    const giftItem = baseContext.inventory[0]; // 取礼物
    const result = runner.giveGift(giftItem); // 执行送礼
    expect(result.affinityDelta).toBe(2); // 礼物加2好感
    const state = relations.getState("npc"); // 读取好感
    expect(state.affinity).toBe(2); // 确认好感更新
  }); // 测试结束
}); // 描述结束
