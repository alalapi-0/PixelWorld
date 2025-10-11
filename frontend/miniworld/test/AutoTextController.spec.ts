import { describe, it, expect, vi } from 'vitest'; // 引入测试工具
// 分隔注释 // 保持行有注释
vi.mock('phaser', () => ({ // 模拟Phaser模块
  __esModule: true, // 指示为ES模块
  default: { // 提供默认导出
    Display: { // 提供颜色工具
      Color: { // 提供Hex转换
        HexStringToColor: (hex: string) => ({ color: parseInt(hex.replace('#', '') || '0', 16) }), // 返回颜色值
      }, // 颜色结束
    }, // Display结束
  }, // 默认导出结束
})); // 模拟结束
// 分隔注释 // 保持行有注释
describe('AutoTextController', () => { // 定义测试套件
  it('自动播放根据字符长度推进', async () => { // 定义自动播放用例
    const module = await import('../src/ui/AutoTextController'); // 动态引入模块
    const controller = new module.AutoTextController({} as any); // 构造控制器
    controller.setRatePerChar(50); // 设置每字耗时
    controller.enableAuto(); // 启用自动模式
    expect(controller.shouldAdvance(500, 'abcd')).toBe(true); // 断言可推进
  }); // 用例结束
  it('跳过模式立即推进', async () => { // 定义跳过用例
    const module = await import('../src/ui/AutoTextController'); // 动态引入模块
    const controller = new module.AutoTextController({} as any); // 构造控制器
    controller.enableSkip(); // 启用跳过
    expect(controller.shouldAdvance(0, '任意')).toBe(true); // 断言立即推进
  }); // 用例结束
}); // 套件结束
