// 引入蓝图类型定义以约束数据结构
import type { Blueprint } from '../../build/Blueprints'; // 使用现有蓝图类型

// 定义运行时蓝图仓库，负责管理可用蓝图列表
export class BlueprintStoreRuntime { // 声明蓝图运行时仓库类
  private blueprints: Blueprint[] = []; // 保存当前可用蓝图数组
  private archivedIds: Set<string> = new Set(); // 记录已下线的蓝图ID
  private versionCounter = 0; // 用于生成版本号的计数器
  private lastUpdated = 0; // 保存最近一次更新的时间戳

  // 使用初始自动数据加载蓝图定义
  public load(initial: Blueprint[]): void { // 定义初始加载方法
    this.blueprints = initial.slice(); // 保存蓝图副本避免外部修改
    this.archivedIds.clear(); // 清空下线记录
    this.bumpVersion(); // 初始化版本号
  } // 方法结束

  // 提供可供UI读取的蓝图列表
  public getBlueprints(): Blueprint[] { // 定义获取蓝图列表的方法
    return this.blueprints.slice(); // 返回浅拷贝保持封装
  } // 方法结束

  // 判断某个蓝图是否已经被标记为下线
  public isBlueprintArchived(id: string): boolean { // 定义查询下线状态的方法
    return this.archivedIds.has(id); // 返回集合中是否存在该ID
  } // 方法结束

  // 热重载入口，用新的自动数据替换旧定义
  public reloadFrom(next: Blueprint[]): void { // 定义热重载方法
    const currentIds = new Set(this.blueprints.map((bp) => bp.id)); // 构建当前蓝图ID集合
    const nextIds = new Set(next.map((bp) => bp.id)); // 构建更新后蓝图ID集合
    currentIds.forEach((id) => { // 遍历旧蓝图ID
      if (!nextIds.has(id)) { // 若新数据缺失该ID
        this.archivedIds.add(id); // 标记为下线
      } // 分支结束
    }); // 遍历结束
    this.blueprints = next.slice(); // 使用新蓝图替换列表
    this.bumpVersion(); // 增加版本信息
  } // 方法结束

  // 获取当前版本号字符串，供开发者面板展示
  public getVersion(): string { // 定义获取版本号的方法
    return `v${this.versionCounter}`; // 返回版本字符串
  } // 方法结束

  // 获取最近更新时间戳，便于界面展示
  public getLastUpdated(): number { // 定义获取更新时间的方法
    return this.lastUpdated; // 返回时间戳
  } // 方法结束

  // 内部工具：递增版本并记录时间
  private bumpVersion(): void { // 定义内部版本更新方法
    this.versionCounter += 1; // 增加版本计数
    this.lastUpdated = Date.now(); // 更新最近时间戳
  } // 方法结束
} // 类结束
