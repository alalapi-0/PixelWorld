import { describe, it, expect, vi } from "vitest"; // 引入测试库
import { RelationshipSystem, RelationshipRules } from "../../src/npc/RelationshipSystem"; // 引入好感系统

// 构造规则
const rules: RelationshipRules = { // 规则定义
  levels: [ // 等级列表
    { name: "陌生", min: 0 }, // 等级一
    { name: "熟悉", min: 20 }, // 等级二
    { name: "朋友", min: 50 } // 等级三
  ], // 等级结束
  dailyCap: 5, // 每日上限
  decayPerDay: 0, // 无衰减
  unlockEvents: { // 解锁事件
    npc: [{ at: 50, event: "unlock_discount" }] // 指定事件
  } // 解锁结束
}; // 规则结束

// 测试每日上限
describe("RelationshipSystem", () => { // 描述块
  it("should respect daily cap", () => { // 测试上限
    const system = new RelationshipSystem(rules); // 创建系统
    system.setCurrentDay("Spring-01"); // 设置日期
    const appliedFirst = system.addAffinity("npc", 4, "chat"); // 第一次加好感
    expect(appliedFirst).toBe(4); // 应获得4点
    const appliedSecond = system.addAffinity("npc", 4, "gift"); // 第二次尝试超过上限
    expect(appliedSecond).toBe(1); // 只剩1点额度
    const state = system.getState("npc"); // 读取状态
    expect(state.dailyGain).toBe(5); // 当日获得应为5
    expect(state.affinity).toBe(5); // 总好感
  }); // 测试结束

  it("should trigger unlock at threshold", () => { // 测试解锁
    const listener = vi.fn(); // 创建监听
    const unlockRules: RelationshipRules = { ...rules, dailyCap: 100 }; // 放宽上限
    const system = new RelationshipSystem(unlockRules); // 创建系统
    system.onUnlock(listener); // 注册监听
    system.setCurrentDay("Spring-01"); // 设置日期
    system.addAffinity("npc", 50, "quest"); // 一次性加到阈值
    expect(listener).toHaveBeenCalledWith("npc", "unlock_discount"); // 应触发事件
    const level = system.getLevel("npc"); // 获取等级
    expect(level.name).toBe("朋友"); // 应达到朋友级
  }); // 测试结束
}); // 描述结束
