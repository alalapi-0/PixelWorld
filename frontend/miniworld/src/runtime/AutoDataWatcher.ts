// 引入热重载事件总线以便在检测到更新时广播
import { emitAutoChanged } from './HotReloadBus'; // 使用封装的触发函数
// 引入获取自动数据哈希的方法
import { fetchAutoHashes } from '../config/AutoDataLoader'; // 从配置加载器导入哈希查询

// 定义远程哈希响应的结构
export interface AutoHashEntry { // 描述单个文件哈希信息的接口
  mtime?: string; // 最近修改时间的字符串表示
  sha1?: string; // 用于比较的SHA1摘要
} // 接口结束

// 定义哈希字典类型，键为文件名
export type AutoHashMap = Record<string, AutoHashEntry>; // 哈希映射类型别名

// 定义构造函数可选参数
export interface AutoDataWatcherOptions { // 定义构造参数接口
  intervalMs?: number; // 自定义轮询间隔
  fetcher?: () => Promise<AutoHashMap>; // 注入自定义哈希获取函数以便测试
  emitter?: (payload: { changed: string[]; timestamp: number }) => void; // 注入自定义事件触发器
} // 接口结束

// 自动数据轮询器实现，负责检测文件变化
export class AutoDataWatcher { // 定义自动数据监听器类
  private intervalMs: number; // 保存轮询间隔
  private fetcher: () => Promise<AutoHashMap>; // 保存哈希获取函数
  private emitter: (payload: { changed: string[]; timestamp: number }) => void; // 保存事件触发回调
  private timer: ReturnType<typeof setInterval> | null = null; // 保存计时器引用
  private lastHashes: AutoHashMap | null = null; // 缓存上一次哈希结果

  // 构造函数允许注入依赖以提升可测试性
  public constructor(options: AutoDataWatcherOptions = {}) { // 定义构造函数
    this.intervalMs = options.intervalMs ?? 1500; // 默认轮询间隔1.5秒
    this.fetcher = options.fetcher ?? fetchAutoHashes; // 默认使用配置加载器提供的哈希函数
    this.emitter = options.emitter ?? emitAutoChanged; // 默认使用事件总线触发
  } // 构造结束

  // 启动轮询逻辑
  public start(): void { // 定义启动方法
    if (this.timer) { // 若已经启动
      return; // 避免重复启动
    } // 分支结束
    if (typeof window === 'undefined') { // 若在非浏览器环境
      return; // 跳过运行
    } // 分支结束
    void this.poll(); // 安排首次轮询
    this.timer = setInterval(() => void this.poll(), this.intervalMs); // 设置定时器持续轮询
  } // 方法结束

  // 停止轮询逻辑
  public stop(): void { // 定义停止方法
    if (!this.timer) { // 若计时器不存在
      return; // 直接返回
    } // 分支结束
    clearInterval(this.timer); // 清除计时器
    this.timer = null; // 重置引用
  } // 方法结束

  // 内部调度函数，执行一次哈希比对
  public async checkOnce(): Promise<void> { // 定义公开检查方法
    await this.poll(); // 调用内部轮询
  } // 方法结束

  // 内部轮询实现，供定时器与测试调用
  private async poll(): Promise<void> { // 定义内部轮询方法
    try { // 捕获网络或解析错误
      const hashes = await this.fetcher(); // 获取最新哈希
      if (!this.lastHashes) { // 如果没有历史记录
        this.lastHashes = hashes; // 保存当前哈希
        return; // 首次无需触发事件
      } // 分支结束
      const changed: string[] = []; // 准备记录变更文件列表
      Object.keys(hashes).forEach((key) => { // 遍历所有哈希键
        const current = hashes[key]?.sha1 ?? ''; // 读取当前哈希值
        const previous = this.lastHashes?.[key]?.sha1 ?? ''; // 读取历史哈希值
        if (current && previous && current !== previous) { // 若存在并发生变化
          changed.push(key); // 记录变更文件
        } // 分支结束
      }); // 遍历结束
      if (changed.length > 0) { // 若检测到变更
        this.emitter({ changed, timestamp: Date.now() }); // 触发自动数据变更事件
      } // 分支结束
      this.lastHashes = hashes; // 更新历史记录
    } catch (error) { // 捕获异常
      console.warn('[AutoDataWatcher] fetch error', error); // 输出警告方便调试
    } // 分支结束
  } // 方法结束
} // 类结束
