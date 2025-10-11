// 引入商店类型定义
import type { Shop } from '../../economy/ShopTypes'; // 使用现有类型描述结构

// 定义记录商店运行时状态的接口
export interface ShopRuntimeState { // 描述运行时库存与余额的接口
  balance: number; // 玩家金币余额
  stock: Record<string, number>; // 商品库存映射
} // 接口结束

// 运行时商店仓库，负责支持热重载
export class ShopStoreRuntime { // 声明商店运行时仓库类
  private shops: Shop[] = []; // 当前商店定义列表
  private archivedShopIds: Set<string> = new Set(); // 被下线的商店ID集合
  private discontinuedGoods: Set<string> = new Set(); // 被下架的商品ID集合
  private versionCounter = 0; // 版本计数器
  private lastUpdated = 0; // 最近更新时间戳
  private balance = 0; // 玩家金币余额快照
  private stockState: Map<string, number> = new Map(); // 商品库存映射

  // 初始化加载商店定义以及可选运行时状态
  public load(initial: Shop[], state?: Partial<ShopRuntimeState>): void { // 定义初始加载方法
    this.shops = initial.slice(); // 保存商店定义副本
    this.archivedShopIds.clear(); // 清空下线商店记录
    this.discontinuedGoods.clear(); // 清空下架商品记录
    this.balance = state?.balance ?? this.balance; // 复用或保留金币余额
    if (state?.stock) { // 若提供库存快照
      this.stockState = new Map(Object.entries(state.stock)); // 使用快照覆盖库存
    } else { // 若未提供库存
      this.stockState = new Map(); // 重置库存映射
    } // 分支结束
    this.bumpVersion(); // 更新版本信息
  } // 方法结束

  // 获取当前活跃的商店定义
  public getShops(): Shop[] { // 定义商店读取方法
    return this.shops.slice(); // 返回浅拷贝避免外部修改
  } // 方法结束

  // 查询指定商店是否已被下线
  public isShopArchived(id: string): boolean { // 定义商店下线查询
    return this.archivedShopIds.has(id); // 返回集合命中结果
  } // 方法结束

  // 查询指定商品是否已被下架
  public isGoodsDiscontinued(id: string): boolean { // 定义商品下架查询
    return this.discontinuedGoods.has(id); // 返回集合命中结果
  } // 方法结束

  // 获取当前金币余额
  public getBalance(): number { // 定义金币余额访问器
    return this.balance; // 返回余额值
  } // 方法结束

  // 记录最新的金币余额
  public setBalance(nextBalance: number): void { // 定义金币余额更新器
    this.balance = nextBalance; // 更新余额
  } // 方法结束

  // 根据商品ID读取库存数量
  public getStock(goodsId: string): number | undefined { // 定义库存查询方法
    return this.stockState.get(goodsId); // 返回对应库存
  } // 方法结束

  // 更新特定商品库存数量
  public setStock(goodsId: string, stock: number): void { // 定义库存更新方法
    this.stockState.set(goodsId, stock); // 写入库存快照
  } // 方法结束

  // 导出运行时状态以便存档
  public snapshotRuntimeState(): ShopRuntimeState { // 定义状态快照方法
    return { balance: this.balance, stock: Object.fromEntries(this.stockState.entries()) }; // 返回余额与库存
  } // 方法结束

  // 热重载入口，用新的自动数据替换旧定义
  public reloadFrom(next: Shop[]): void { // 定义热重载方法
    const currentShopIds = new Set(this.shops.map((shop) => shop.id)); // 收集当前商店ID
    const nextShopIds = new Set(next.map((shop) => shop.id)); // 收集新商店ID
    currentShopIds.forEach((id) => { // 遍历旧商店ID
      if (!nextShopIds.has(id)) { // 若新数据缺少该商店
        this.archivedShopIds.add(id); // 标记商店下线
      } // 分支结束
    }); // 遍历结束
    const currentGoodsIds = new Set(this.shops.flatMap((shop) => shop.goods.map((goods) => goods.id))); // 收集旧商品ID
    const nextGoodsIds = new Set(next.flatMap((shop) => shop.goods.map((goods) => goods.id))); // 收集新商品ID
    currentGoodsIds.forEach((id) => { // 遍历旧商品
      if (!nextGoodsIds.has(id)) { // 若新数据缺失商品
        this.discontinuedGoods.add(id); // 标记为下架
      } // 分支结束
    }); // 遍历结束
    next.forEach((shop) => { // 遍历新商店
      shop.goods.forEach((goods) => { // 遍历商品
        if (!this.stockState.has(goods.id) && typeof goods.stock === 'number') { // 若库存未记录且新数据提供库存
          this.stockState.set(goods.id, goods.stock); // 初始化库存
        } // 分支结束
      }); // 商品遍历结束
    }); // 商店遍历结束
    this.shops = next.slice(); // 替换商店定义
    this.bumpVersion(); // 更新版本
  } // 方法结束

  // 获取当前版本号
  public getVersion(): string { // 定义版本访问器
    return `v${this.versionCounter}`; // 返回版本字符串
  } // 方法结束

  // 获取最近更新时间戳
  public getLastUpdated(): number { // 定义更新时间访问器
    return this.lastUpdated; // 返回时间戳
  } // 方法结束

  // 内部工具：更新时间与版本号
  private bumpVersion(): void { // 定义内部版本更新方法
    this.versionCounter += 1; // 递增版本计数
    this.lastUpdated = Date.now(); // 记录当前时间
  } // 方法结束
} // 类结束
