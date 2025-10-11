// 定义热重载事件负载接口，包含变更文件列表与时间戳
export interface AutoChangedPayload { // 声明自动数据变更事件的接口
  changed: string[]; // 保存被检测到变更的文件名称
  timestamp: number; // 记录触发事件的时间戳
} // 接口结束

// 定义规则变更事件负载接口，便于未来扩展
export interface RulesChangedPayload { // 声明规则数据变更事件的接口
  timestamp: number; // 记录规则变更的时间戳
} // 接口结束

// 扩展调度器变更事件负载
export interface SchedulerChangedPayload { // 声明排程文件变更事件接口
  path: string; // 触发变更的文件路径
  timestamp: number; // 事件时间戳
} // 接口结束

// 声明允许订阅的事件名称常量集合
export type HotReloadEventMap = { // 定义事件名称到负载的映射类型
  autoChanged: AutoChangedPayload; // 自动数据变更事件映射
  rulesChanged: RulesChangedPayload; // 规则数据变更事件映射
  schedulerChanged: SchedulerChangedPayload; // 排程文件变更事件映射
}; // 类型结束

// 定义事件监听器函数类型
export type HotReloadListener<T> = (payload: T) => void; // 监听器接收对应负载

// 实现一个极简的事件总线，供前端模块共享
class HotReloadBusImpl { // 定义热重载总线实现类
  private listeners: Map<keyof HotReloadEventMap, Set<HotReloadListener<unknown>>> = new Map(); // 存储事件与监听器集合

  // 注册事件监听器
  public on<K extends keyof HotReloadEventMap>(event: K, listener: HotReloadListener<HotReloadEventMap[K]>): void { // 定义订阅方法
    const entry = this.listeners.get(event) ?? new Set(); // 获取或创建事件的监听器集合
    entry.add(listener as HotReloadListener<unknown>); // 将监听器加入集合
    this.listeners.set(event, entry); // 回写集合以防初次创建
  } // 方法结束

  // 注销事件监听器
  public off<K extends keyof HotReloadEventMap>(event: K, listener: HotReloadListener<HotReloadEventMap[K]>): void { // 定义取消订阅方法
    const entry = this.listeners.get(event); // 获取对应事件集合
    if (!entry) { // 若无集合
      return; // 直接返回
    } // 分支结束
    entry.delete(listener as HotReloadListener<unknown>); // 从集合移除监听器
    if (entry.size === 0) { // 如果集合为空
      this.listeners.delete(event); // 删除集合释放内存
    } // 分支结束
  } // 方法结束

  // 触发事件并通知所有监听器
  public emit<K extends keyof HotReloadEventMap>(event: K, payload: HotReloadEventMap[K]): void { // 定义事件触发方法
    const entry = this.listeners.get(event); // 获取对应事件监听器集合
    if (!entry) { // 若没有监听器
      return; // 直接返回
    } // 分支结束
    entry.forEach((listener) => { // 遍历所有监听器
      try { // 捕获单个监听器可能抛出的异常
        (listener as HotReloadListener<HotReloadEventMap[K]>)(payload); // 调用监听器并传递负载
      } catch (error) { // 捕获异常
        console.error('[HotReloadBus] listener error', error); // 输出错误日志便于调试
      } // 分支结束
    }); // 循环结束
  } // 方法结束
} // 类结束

// 创建单例供全局共享
export const HotReloadBus = new HotReloadBusImpl(); // 导出总线单例

// 便捷导出以便具体场景调用自动数据事件
export function emitAutoChanged(diff: AutoChangedPayload): void { // 定义触发自动数据事件的工具函数
  HotReloadBus.emit('autoChanged', diff); // 调用总线触发事件
} // 函数结束

// 便捷导出以便触发规则变更事件
export function emitRulesChanged(payload: RulesChangedPayload): void { // 定义触发规则事件的工具函数
  HotReloadBus.emit('rulesChanged', payload); // 调用总线触发规则事件
} // 函数结束

// 新增方法用于触发排程文件更新事件
export function emitSchedulerChanged(payload: SchedulerChangedPayload): void { // 定义触发排程事件的工具函数
  HotReloadBus.emit('schedulerChanged', payload); // 调用总线触发排程事件
} // 函数结束
