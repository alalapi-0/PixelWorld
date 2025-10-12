import { describe, it, expect } from "vitest"; // 引入测试库
import { FestivalManager, FestivalCalendar, FestivalRewards } from "../../src/festival/FestivalManager"; // 引入节日管理器

// 构造日历
const calendar: FestivalCalendar = { // 节日日历
  harvest_fest: { name: "丰收节", date: "Spring-15", open: "10:00-18:00", activities: ["比赛"], rewards: ["medal"] }, // 丰收节
  flower_ball: { name: "花舞会", date: "Summer-05", open: "18:00-22:00", activities: ["舞蹈"], rewards: ["ribbon"] } // 花舞会
}; // 日历结束

// 构造奖励
const rewards: FestivalRewards = { // 奖励映射
  medal: { title: "丰收勋章", description: "丰收节奖励", inventoryTag: "medal" }, // 勋章
  ribbon: { title: "花舞缎带", description: "花舞奖励", inventoryTag: "ribbon" } // 缎带
}; // 奖励结束

describe("FestivalManager", () => { // 描述块
  it("should detect festival open window", () => { // 测试开放判定
    const manager = new FestivalManager(calendar, rewards); // 创建管理器
    const openInfo = manager.isFestivalOpen({ season: "spring", day: 15, time: "12:00" }); // 检查开放
    expect(openInfo.active).toBe(true); // 应为开启
    expect(openInfo?.id).toBe("harvest_fest"); // ID 应匹配
    const closedInfo = manager.isFestivalOpen({ season: "spring", day: 15, time: "09:00" }); // 非开放时间
    expect(closedInfo.active).toBe(false); // 不开放
  }); // 测试结束

  it("should deliver rewards and track upcoming", () => { // 测试奖励与预告
    const manager = new FestivalManager(calendar, rewards); // 创建管理器
    const rewardList = manager.completeFestival("harvest_fest"); // 完成节日
    expect(rewardList[0].title).toBe("丰收勋章"); // 检查奖励
    const upcoming = manager.getUpcomingFestivals("spring", 10); // 查询预告
    expect(upcoming[0].id).toBe("harvest_fest"); // 首个为丰收节
    expect(upcoming[0].daysUntil).toBe(5); // 剩余5天
  }); // 测试结束
}); // 描述结束
