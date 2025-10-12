// 定义物品标签映射类型
export type TagRegistry = Record<string, string[]>; // 将物品 ID 映射到标签数组
// 声明默认标签字典
const defaultRegistry: TagRegistry = { // 预设几种常用物品标签
  "seed:turnip": ["item:seed", "gift", "material:seed"], // 萝卜种子可作为礼物
  "seed:wheat": ["item:seed", "gift", "material:seed"], // 小麦种子标签
  "item:flower": ["item:flower", "gift"], // 花束标签
  "item:rare_crystal": ["item:rare_crystal", "gift"], // 稀有水晶标签
  "item:trash": ["item:trash"], // 垃圾标签
  "material:wood": ["material:wood", "gift"], // 木材标签
  "material:stone": ["material:stone"], // 石头标签
  "item:fertilizer": ["item:fertilizer", "gift"], // 肥料标签
  "turnip": ["crop:turnip"], // 萝卜成品标签
  "wheat": ["crop:wheat"] // 小麦成品标签
};
// 创建可变的标签注册表引用
let activeRegistry: TagRegistry = { ...defaultRegistry }; // 初始化为默认映射
// 注册新标签数据
export function registerTags(registry: TagRegistry): void { // 导出注册函数
  activeRegistry = { ...defaultRegistry, ...registry }; // 合并默认标签与外部注册
} // 结束函数
// 查询指定物品是否拥有标签
export function hasTag(itemId: string, tag: string): boolean { // 导出标签判断函数
  const tags = activeRegistry[itemId] || []; // 取出物品的标签列表
  if (tags.includes(tag)) { // 如果直接包含目标标签
    return true; // 立即返回真
  } // 结束条件
  const [group, value] = tag.split(":"); // 拆分标签组与值
  if (!value) { // 若没有冒号结构
    return tags.includes(tag); // 直接判定是否存在纯文本标签
  } // 结束条件
  return tags.includes(group) || tags.includes(`${group}:${value}`); // 允许匹配组或完整标签
} // 结束函数
// 获取某物品的所有标签
export function getTags(itemId: string): string[] { // 导出获取标签函数
  return activeRegistry[itemId] ? [...activeRegistry[itemId]] : []; // 返回副本防止外部修改
} // 结束函数
