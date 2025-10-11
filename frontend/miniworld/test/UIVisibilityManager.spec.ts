import Phaser from 'phaser'; // 引入Phaser类型
import { describe, it, expect, vi } from 'vitest'; // 引入测试工具
import { UIVisibilityManager } from '../src/ui/UIVisibilityManager'; // 引入UI显隐管理器
// 分隔注释 // 保持行有注释
function createStubScene() { // 创建场景替身
  const addFn = vi.fn((config: Phaser.Types.Tweens.TweenBuilderConfig) => { // 定义补间添加函数
    config.onComplete?.(); // 立即执行完成回调
    return {} as Phaser.Tweens.Tween; // 返回空补间
  }); // 函数结束
  const scene = { tweens: { add: addFn, killTweensOf: vi.fn() } } as unknown as Phaser.Scene; // 构建替身场景
  return scene; // 返回场景
} // 函数结束
// 分隔注释 // 保持行有注释
function createStubContainer() { // 创建容器替身
  return { setAlpha: vi.fn(), setVisible: vi.fn(), setActive: vi.fn() } as unknown as Phaser.GameObjects.Container; // 返回容器
} // 函数结束
// 分隔注释 // 保持行有注释
describe('UIVisibilityManager', () => { // 定义测试套件
  it('切换隐藏与显示状态', () => { // 定义用例
    const scene = createStubScene(); // 创建场景
    const container = createStubContainer(); // 创建容器
    const manager = new UIVisibilityManager(scene); // 创建管理器
    manager.setAutoAttach(container); // 注册容器
    manager.hideAll(); // 执行隐藏
    expect(manager.isHidden()).toBe(true); // 断言已隐藏
    manager.showAll(); // 执行显示
    expect(manager.isHidden()).toBe(false); // 断言已显示
  }); // 用例结束
}); // 套件结束
