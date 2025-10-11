import type { Blueprint } from '../build/Blueprints'; // 引入蓝图类型定义
import type { Shop } from '../economy/ShopTypes'; // 引入商店类型定义
import type { QuestDef } from '../quest/QuestTypes'; // 引入任务定义类型

// 定义带来源标记的蓝图类型，保留兼容原有蓝图结构
export type AutoBlueprint = Blueprint & { source_asset?: string }; // 蓝图可选来源字段
// 定义带来源标记的商品类型
export type AutoGoods = Shop['goods'][number] & { source_asset?: string }; // 商品可选来源字段
// 定义带来源标记的商店类型
export type AutoShop = Shop & { source_asset?: string; goods: AutoGoods[] }; // 商店包含扩展商品信息
// 定义带来源标记的任务类型
export type AutoQuest = QuestDef & { source_asset?: string }; // 任务可选来源字段

// 自动生成文件的统一元信息接口
interface AutoMeta { // 描述自动文件元数据的接口
  generatedAt?: string; // 生成时间戳
  rulesVersion?: number; // 使用的规则版本
} // 接口结束

// 蓝图自动文件结构接口
interface AutoBlueprintFile { // 描述蓝图自动文件结构
  meta?: AutoMeta; // 可选元信息
  blueprints?: AutoBlueprint[]; // 自动蓝图列表
} // 接口结束

// 商店自动文件结构接口
interface AutoShopFile { // 描述商店自动文件结构
  meta?: AutoMeta; // 可选元信息
  shops?: AutoShop[]; // 自动商店列表
} // 接口结束

// 任务自动文件结构接口
interface AutoQuestFile { // 描述任务自动文件结构
  meta?: AutoMeta; // 可选元信息
  quests?: AutoQuest[]; // 自动任务列表
} // 接口结束

// 定义用于单元测试的全局覆盖结构接口
interface AutoMockOverrides { // 描述测试注入数据结构
  blueprints?: Blueprint[]; // 覆盖用蓝图数组
  shops?: Shop[]; // 覆盖用商店数组
  quests?: QuestDef[]; // 覆盖用任务数组
} // 接口结束

// 利用Vite的glob功能收集自动生成JSON文件
const autoJsonModules = import.meta.glob('../../../../assets/auto/*.json', { eager: true }) as Record<string, unknown>; // 收集auto目录下所有JSON
// 收集潜在人工蓝图文件
const manualBlueprintModules = import.meta.glob('../../../../assets/build/*.json', { eager: true }) as Record<string, unknown>; // 收集build目录JSON
// 收集潜在人工商店文件
const manualShopModules = import.meta.glob('../../../../assets/shops/*.json', { eager: true }) as Record<string, unknown>; // 收集shops目录JSON
// 收集潜在人工任务文件
const manualQuestModules = import.meta.glob('../../../../assets/quests/*.json', { eager: true }) as Record<string, unknown>; // 收集quests目录JSON

// 帮助函数：从glob结果中提取真正的数据对象
function extractModule<T>(modules: Record<string, unknown>, key: string): T | null { // 根据键名提取模块
  const module = modules[key]; // 获取模块对象
  if (!module) { // 若不存在
    return null; // 返回空
  } // 分支结束
  if (typeof module === 'object' && module !== null && 'default' in (module as Record<string, unknown>)) { // 如果包含default导出
    return ((module as { default: T }).default); // 返回default内容
  } // 分支结束
  return module as T; // 否则直接返回对象
} // 函数结束

// 帮助函数：解析人工蓝图文件格式
function parseManualBlueprints(raw: unknown): Blueprint[] { // 解析可能的蓝图JSON结构
  if (!raw) { // 若无数据
    return []; // 返回空数组
  } // 分支结束
  if (Array.isArray(raw)) { // 如果本身是数组
    return raw as Blueprint[]; // 直接返回
  } // 分支结束
  const obj = raw as Record<string, unknown>; // 视为字典
  if (Array.isArray(obj.list)) { // 如果存在list字段
    return obj.list as Blueprint[]; // 返回list
  } // 分支结束
  if (Array.isArray(obj.blueprints)) { // 如果存在blueprints字段
    return obj.blueprints as Blueprint[]; // 返回blueprints
  } // 分支结束
  return []; // 兜底返回空
} // 函数结束

// 帮助函数：解析人工商店文件格式
function parseManualShops(raw: unknown): Shop[] { // 解析商店JSON结构
  if (!raw) { // 若无数据
    return []; // 返回空
  } // 分支结束
  if (Array.isArray(raw)) { // 若是数组
    return raw as Shop[]; // 直接返回
  } // 分支结束
  const obj = raw as Record<string, unknown>; // 转为字典
  if (Array.isArray(obj.shops)) { // 检查shops字段
    return obj.shops as Shop[]; // 返回shops
  } // 分支结束
  if (Array.isArray(obj.list)) { // 检查list字段
    return obj.list as Shop[]; // 返回list
  } // 分支结束
  return []; // 兜底返回空
} // 函数结束

// 帮助函数：解析人工任务文件格式
function parseManualQuests(raw: unknown): QuestDef[] { // 解析任务JSON结构
  if (!raw) { // 若无数据
    return []; // 返回空
  } // 分支结束
  if (Array.isArray(raw)) { // 若是数组
    return raw as QuestDef[]; // 直接返回
  } // 分支结束
  const obj = raw as Record<string, unknown>; // 转换为字典
  if (Array.isArray(obj.quests)) { // 检查quests字段
    return obj.quests as QuestDef[]; // 返回quests
  } // 分支结束
  if (Array.isArray(obj.list)) { // 检查list字段
    return obj.list as QuestDef[]; // 返回list
  } // 分支结束
  return []; // 兜底返回空
} // 函数结束

// 获取测试覆盖数据，如果不存在则为undefined
const mockOverrides = (globalThis as { __PIXELWORLD_AUTO_MOCK__?: AutoMockOverrides }).__PIXELWORLD_AUTO_MOCK__; // 读取全局测试覆盖

// 读取人工蓝图数据，优先使用测试覆盖
const manualBlueprints: Blueprint[] = mockOverrides?.blueprints ?? parseManualBlueprints(extractModule(manualBlueprintModules, '../../../../assets/build/blueprints.json')); // 决定人工蓝图列表
// 读取人工商店数据
const manualShops: Shop[] = mockOverrides?.shops ?? parseManualShops(extractModule(manualShopModules, '../../../../assets/shops/shops.json')); // 决定人工商店列表
// 读取人工任务数据
const manualQuests: QuestDef[] = mockOverrides?.quests ?? parseManualQuests(extractModule(manualQuestModules, '../../../../assets/quests/quests.json')); // 决定人工任务列表

// 帮助函数：过滤出未被人工数据覆盖的自动条目
function filterAutoByManual<T extends { id: string }>(autoList: T[], manualList: T[], context: string): T[] { // 根据ID过滤自动数据
  if (manualList.length === 0) { // 如果没有人工数据
    return autoList.slice(); // 直接返回副本
  } // 分支结束
  const manualIds = new Set(manualList.map((item) => item.id)); // 构建人工ID集合
  return autoList.filter((entry) => { // 过滤自动数据
    if (manualIds.has(entry.id)) { // 若发生冲突
      console.warn(`[AutoDataLoader] skip auto ${context} id=${entry.id}`); // 打印警告
      return false; // 排除冲突项
    } // 分支结束
    return true; // 保留未冲突条目
  }); // 过滤结束
} // 函数结束

// 提取自动蓝图数据并处理冲突
const autoBlueprintFile = extractModule<AutoBlueprintFile>(autoJsonModules, '../../../../assets/auto/blueprints_auto.json'); // 读取自动蓝图文件
const autoBlueprintsRaw: AutoBlueprint[] = (autoBlueprintFile?.blueprints ?? []) as AutoBlueprint[]; // 获取蓝图数组
const filteredAutoBlueprints: AutoBlueprint[] = filterAutoByManual(autoBlueprintsRaw, manualBlueprints, 'blueprint'); // 过滤冲突蓝图

// 提取自动商店数据并处理冲突
const autoShopFile = extractModule<AutoShopFile>(autoJsonModules, '../../../../assets/auto/shops_auto.json'); // 读取自动商店文件
const autoShopsRaw: AutoShop[] = (autoShopFile?.shops ?? []) as AutoShop[]; // 获取商店数组
const filteredAutoShops: AutoShop[] = filterAutoByManual(autoShopsRaw, manualShops, 'shop'); // 过滤冲突商店

// 提取自动任务数据并处理冲突
const autoQuestFile = extractModule<AutoQuestFile>(autoJsonModules, '../../../../assets/auto/quests_auto.json'); // 读取自动任务文件
const autoQuestsRaw: AutoQuest[] = (autoQuestFile?.quests ?? []) as AutoQuest[]; // 获取任务数组
const filteredAutoQuests: AutoQuest[] = filterAutoByManual(autoQuestsRaw, manualQuests, 'quest'); // 过滤冲突任务

// 对外导出蓝图数据访问函数
export function getAutoBlueprints(): AutoBlueprint[] { // 提供获取自动蓝图的方法
  return filteredAutoBlueprints.slice(); // 返回浅拷贝避免外部修改
} // 函数结束

// 对外导出商店数据访问函数
export function getAutoShops(): AutoShop[] { // 提供获取自动商店的方法
  return filteredAutoShops.slice(); // 返回浅拷贝
} // 函数结束

// 对外导出任务数据访问函数
export function getAutoQuests(): AutoQuest[] { // 提供获取自动任务的方法
  return filteredAutoQuests.slice(); // 返回浅拷贝
} // 函数结束
