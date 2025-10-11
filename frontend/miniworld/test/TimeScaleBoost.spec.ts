import { describe, it, expect, vi } from 'vitest'; // 引入测试工具
vi.mock('phaser', () => ({ __esModule: true, default: {} })); // 模拟Phaser模块
import Phaser from 'phaser'; // 引入Phaser类型
import { TimeScaleBoost } from '../src/systems/TimeScaleBoost'; // 引入快进系统
import { TimeSystem } from '../src/systems/TimeSystem'; // 引入时间系统
// 分隔注释 // 保持行有注释
function createFakeScene(): Phaser.Scene { // 创建伪场景
  const text = { // 创建文本占位
    setOrigin: vi.fn().mockReturnThis(), // 模拟链式调用
    setText: vi.fn().mockImplementation(function (value: string) { this.content = value; return this; }), // 记录文本内容
    content: 'x1', // 初始文本
  }; // 文本结束
  const rect = { // 创建矩形占位
    setOrigin: vi.fn().mockReturnThis(), // 链式调用
    setScrollFactor: vi.fn().mockReturnThis(), // 链式调用
    setDepth: vi.fn().mockReturnThis(), // 链式调用
    setFillStyle: vi.fn().mockReturnThis(), // 链式调用
    setSize: vi.fn().mockReturnThis(), // 链式调用
  }; // 矩形结束
  const scene = { add: { text: vi.fn((x: number, y: number, value: string) => { text.content = value; return text; }), rectangle: vi.fn(() => rect) }, scale: { width: 800, height: 600 } }; // 构造场景
  return scene as unknown as Phaser.Scene; // 返回伪场景
} // 函数结束
// 分隔注释 // 保持行有注释
describe('TimeScaleBoost', () => { // 定义快进系统测试
  it('倍率切换遵循1-2-4循环', () => { // 定义倍率循环用例
    const scene = createFakeScene(); // 创建场景
    const boost = new TimeScaleBoost(scene); // 创建快进控制
    const holder = { add: vi.fn() } as unknown as Phaser.GameObjects.Container; // 创建容器占位
    boost.drawSmallIcon(holder); // 绘制图标
    const createdText = ((scene.add as any).text as any).mock.results[0].value as { content: string }; // 获取创建的文本
    expect(createdText.content).toBe('x1'); // 初始文本为x1
    boost.toggle(); // 切换到2倍
    expect(createdText.content).toBe('x2'); // 文本更新为x2
    boost.toggle(); // 切换到4倍
    expect(createdText.content).toBe('x4'); // 文本更新为x4
    boost.toggle(); // 切换回1倍
    expect(createdText.content).toBe('x1'); // 文本回到x1
    expect(boost.getScale()).toBe(1); // 倍率状态为1
  }); // 用例结束
  it('与时间系统结合时倍率影响推进速度', () => { // 定义倍率影响用例
    const scene = createFakeScene(); // 创建场景
    const boost = new TimeScaleBoost(scene); // 创建快进控制
    const system = new TimeSystem(scene); // 创建时间系统
    system.update(1000, boost.getScale()); // 以1倍推进十分钟
    boost.toggle(); // 切换到2倍
    system.update(1000, boost.getScale()); // 以2倍推进二十分钟
    const state = system.getState(); // 获取状态
    expect(state.minute).toBe(30); // 总分钟为三十
  }); // 用例结束
}); // 套件结束
