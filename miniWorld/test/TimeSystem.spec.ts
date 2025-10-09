import { describe, it, expect, vi } from 'vitest'; // 引入测试工具
vi.mock('phaser', () => ({ __esModule: true, default: {} })); // 模拟Phaser模块
import Phaser from 'phaser'; // 引入Phaser类型
import { TimeSystem } from '../src/systems/TimeSystem'; // 引入时间系统
// 分隔注释 // 保持行有注释
function createFakeScene(): Phaser.Scene { // 创建伪场景
  const rect = { // 创建矩形占位
    setOrigin: vi.fn().mockReturnThis(), // 模拟链式调用
    setScrollFactor: vi.fn().mockReturnThis(), // 模拟链式调用
    setDepth: vi.fn().mockReturnThis(), // 模拟链式调用
    setFillStyle: vi.fn().mockReturnThis(), // 模拟链式调用
    setSize: vi.fn().mockReturnThis(), // 模拟链式调用
  }; // 矩形结束
  return { add: { rectangle: vi.fn(() => rect) }, scale: { width: 800, height: 600 } } as unknown as Phaser.Scene; // 返回伪场景
} // 函数结束
// 分隔注释 // 保持行有注释
describe('TimeSystem', () => { // 定义时间系统测试
  it('推进六次十分钟会增加一小时', () => { // 定义时间推进用例
    const system = new TimeSystem(createFakeScene()); // 创建时间系统
    for (let i = 0; i < 6; i += 1) { // 循环六次
      system.update(1000, 1); // 每次推进十分钟
    } // 循环结束
    const state = system.getState(); // 获取状态
    expect(state.hour).toBe(7); // 初始6点加一小时
    expect(state.minute).toBe(0); // 分钟归零
  }); // 用例结束
  it('触发新的一天与新季节回调并支持序列化', () => { // 定义回调用例
    const system = new TimeSystem(createFakeScene()); // 创建系统
    const daySpy = vi.fn(); // 创建日回调监视
    const seasonSpy = vi.fn(); // 创建季节回调监视
    system.onNewDay(daySpy); // 注册日回调
    system.onNewSeason(seasonSpy); // 注册季节回调
    system.restore({ state: { minute: 50, hour: 23, day: 30, weekDay: 6, season: 'spring', year: 1 }, fraction: 0 }); // 设置临界时间
    system.update(1000, 1); // 推进十分钟
    expect(daySpy).toHaveBeenCalledTimes(1); // 断言日回调触发
    expect(seasonSpy).toHaveBeenCalledTimes(1); // 断言季节回调触发
    const snapshot = system.serialize(); // 序列化状态
    const cloned = new TimeSystem(createFakeScene()); // 创建新系统
    cloned.restore(snapshot); // 恢复状态
    expect(cloned.getState()).toEqual(system.getState()); // 断言状态一致
  }); // 用例结束
}); // 套件结束
