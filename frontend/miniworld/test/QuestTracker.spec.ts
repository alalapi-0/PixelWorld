import { describe, it, expect, beforeEach } from 'vitest'; // 引入测试工具
import Phaser from 'phaser'; // 引入Phaser类型
import { QuestStore } from '../src/quest/QuestStore'; // 引入任务存储
import { QuestTracker } from '../src/quest/QuestTracker'; // 引入任务追踪器
// 分隔注释 // 保持行有注释
class FakeText { // 定义假文本对象
  public text = ''; // 存储文本内容
  public visible = true; // 可见性标记
  public setOrigin(_x: number, _y: number): this { return this; } // 设置锚点
  public setText(value: string): this { this.text = value; return this; } // 设置文本
  public setPosition(_x: number, _y: number): this { return this; } // 设置位置
  public setStyle(_style: unknown): this { return this; } // 设置样式
  public setVisible(flag: boolean): this { this.visible = flag; return this; } // 设置可见性
  public destroy(): void { this.visible = false; } // 销毁时标记不可见
} // 类结束
// 分隔注释 // 保持行有注释
class FakeContainer { // 定义假容器
  public list: unknown[] = []; // 保存子元素
  public visible = false; // 可见性标记
  public setDepth(_value: number): this { return this; } // 设置深度
  public setScrollFactor(_x: number, _y?: number): this { return this; } // 设置滚动系数
  public setVisible(flag: boolean): this { this.visible = flag; return this; } // 设置可见性
  public setPosition(_x: number, _y: number): this { return this; } // 设置位置
  public add(child: unknown): this { this.list.push(child); return this; } // 添加子元素
  public destroy(_fromScene?: boolean): void { this.list = []; this.visible = false; } // 销毁容器
} // 类结束
// 分隔注释 // 保持行有注释
let store: QuestStore; // 保存任务存储
let tracker: QuestTracker; // 保存追踪器
let fakeContainer: FakeContainer; // 保存容器引用
// 分隔注释 // 保持行有注释
beforeEach(async () => { // 每个测试前执行
  (globalThis as { fetch?: typeof fetch }).fetch = undefined; // 禁用外部fetch
  store = new QuestStore(); // 创建任务存储
  await store.loadDefs({} as Phaser.Scene); // 加载任务定义
  store.startIfNeeded(); // 自动启动任务
  store.startQuest('q_explore_lake'); // 手动接取湖岸任务
  const fakeScene = { // 构造伪场景
    add: { // 提供add接口
      container: () => { fakeContainer = new FakeContainer(); return fakeContainer as unknown as Phaser.GameObjects.Container; }, // 返回假容器
      text: () => new FakeText() as unknown as Phaser.GameObjects.Text, // 返回假文本
    }, // 接口结束
    scale: { width: 320, height: 320 }, // 提供场景尺寸
  } as unknown as Phaser.Scene; // 转换为场景类型
  tracker = new QuestTracker(fakeScene, store); // 创建追踪器
  tracker.setPlayer(() => ({ x: 0, y: 0 })); // 设置玩家位置
  tracker.setNpcLocator(() => undefined); // NPC定位无需
}); // 钩子结束
// 分隔注释 // 保持行有注释
describe('QuestTracker', () => { // 定义追踪器测试套件
  it('追踪reach任务时应渲染提示元素', () => { // 测试追踪提示
    const progress = store.getProgress('q_explore_lake'); // 获取任务进度
    expect(progress).toBeDefined(); // 确认存在
    if (!progress) { // 如果缺失
      return; // 直接返回
    } // 条件结束
    progress.tracked = true; // 标记为追踪
    tracker.update(); // 调用更新
    expect(fakeContainer.list.length).toBeGreaterThan(0); // 断言容器已有子元素
    tracker.clear(); // 清理提示
    expect(fakeContainer.visible).toBe(false); // 断言已隐藏
  }); // 用例结束
}); // 套件结束
