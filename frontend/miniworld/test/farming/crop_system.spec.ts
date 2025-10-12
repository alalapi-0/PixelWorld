import { describe, it, expect } from "vitest"; // 引入测试库
import { CropSystem, FieldState, CropDefinition, DayContext } from "../../src/farming/CropSystem"; // 引入作物系统

// 构造田地
const fields: FieldState[] = [ // 田地列表
  { x: 10, y: 6, cropId: null, stage: 0, progress: 0, watered: false, dayPlanted: null, withered: false }, // 第一块
  { x: 11, y: 6, cropId: null, stage: 0, progress: 0, watered: false, dayPlanted: null, withered: false } // 第二块
]; // 田地结束

// 构造作物
const crops: Record<string, CropDefinition> = { // 作物表
  turnip: { seasons: ["spring"], stages: [{ days: 1 }, { days: 1 }], yield: { itemId: "turnip", count: "1..2" }, waterPerDay: 1, witherIfOutOfSeason: true }, // 萝卜
  wheat: { seasons: ["summer"], stages: [{ days: 1 }], yield: { itemId: "wheat", count: "1" }, waterPerDay: 1, witherIfOutOfSeason: false } // 小麦
}; // 作物结束

describe("CropSystem", () => { // 描述块
  it("should grow with watering and harvest", () => { // 测试浇水成长
    const system = new CropSystem(crops, JSON.parse(JSON.stringify(fields))); // 创建系统
    const day: DayContext = { season: "spring", day: 1, weather: "sunny" }; // 第一天
    expect(system.plant(0, "turnip", day)).toBe(true); // 播种成功
    system.water(0); // 浇水
    system.advanceDay({ season: "spring", day: 2, weather: "sunny" }); // 推进一天
    system.water(0); // 再次浇水
    system.advanceDay({ season: "spring", day: 3, weather: "sunny" }); // 第二天结束
    const harvest = system.harvest(0); // 收获
    expect(harvest?.itemId).toBe("turnip"); // 应收获萝卜
    expect(harvest?.count).toBe(1); // 最小产量为1
  }); // 测试结束

  it("should auto water in rain", () => { // 测试雨天自动浇水
    const system = new CropSystem(crops, JSON.parse(JSON.stringify(fields))); // 创建系统
    system.plant(0, "turnip", { season: "spring", day: 1, weather: "sunny" }); // 播种
    system.advanceDay({ season: "spring", day: 2, weather: "rain" }); // 雨天推进
    system.advanceDay({ season: "spring", day: 3, weather: "rain" }); // 再次雨天
    const harvest = system.harvest(0); // 尝试收获
    expect(harvest?.itemId).toBe("turnip"); // 应成熟
  }); // 测试结束

  it("should wither out of season", () => { // 测试跨季枯萎
    const system = new CropSystem(crops, JSON.parse(JSON.stringify(fields))); // 创建系统
    system.plant(0, "turnip", { season: "spring", day: 30, weather: "sunny" }); // 播种
    system.advanceDay({ season: "summer", day: 1, weather: "sunny" }); // 进入夏季
    const field = system.getFields()[0]; // 获取田地
    expect(field.withered).toBe(true); // 应枯萎
  }); // 测试结束
}); // 描述结束
