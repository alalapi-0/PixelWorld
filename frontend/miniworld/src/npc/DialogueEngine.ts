// 定义对话节点的选择项接口
export interface DialogueChoice { // 描述单个选项
  text: string; // 选项文本
  next?: string; // 跳转节点
  event?: string; // 触发事件
  if?: string; // 条件表达式
} // 结束接口
// 定义从背包生成选项的结构
export interface InventoryChoiceConfig { // 描述背包过滤参数
  tag: string; // 需要匹配的标签
} // 结束接口
// 定义礼物配置结构
export interface GiftConfig { // 描述礼物流程
  rules: string; // 使用的评分表 ID
  effects: string[]; // 需要执行的效果标记
} // 结束接口
// 定义对话节点结构
export interface DialogueNode { // 描述对话节点内容
  text: string; // 文本内容
  choices?: DialogueChoice[]; // 选项数组
  next?: string; // 默认跳转
  effects?: string[]; // 节点效果
  end?: boolean; // 是否结束
  choicesFromInventory?: InventoryChoiceConfig; // 背包选项
  onGift?: GiftConfig; // 礼物配置
} // 结束接口
// 定义对话数据结构
export interface DialogueData { // 总的对话文件结构
  meta: { id: string; displayName: string; requiresPresence: boolean }; // 元数据
  vars: Record<string, unknown>; // 变量初始值
  nodes: Record<string, DialogueNode>; // 节点集合
} // 结束接口
// 定义背包物品结构
export interface InventoryItem { // 描述玩家背包中的物品
  id: string; // 物品 ID
  name: string; // 显示名称
  quantity: number; // 数量
  tags: string[]; // 标签列表
} // 结束接口
// 定义运行上下文
export interface DialogueContext { // 运行时上下文
  relationship: number; // 当前好感
  relationshipLevel: string; // 当前段位名
  time: string; // 当前时间
  weather: string; // 天气
  day: string; // 日期文本
  season: string; // 当前季节
  playerName: string; // 玩家名称
  inventory: InventoryItem[]; // 背包物品
} // 结束接口
// 定义经过解析的节点结果
export interface ResolvedDialogueNode { // 解析后的节点
  text: string; // 替换后的文本
  choices: DialogueChoice[]; // 过滤后的选项
  inventoryChoices: InventoryItem[]; // 背包可选物品
  node: DialogueNode; // 原始节点引用
} // 结束接口
// 对话引擎主体
export class DialogueEngine { // 处理节点解析与条件判定
  constructor(private data: DialogueData) {} // 构造函数直接保存数据
  getNode(nodeId: string): DialogueNode { // 获取节点
    const node = this.data.nodes[nodeId]; // 查找节点
    if (!node) { // 若不存在
      throw new Error(`缺少节点:${nodeId}`); // 抛出错误
    } // 结束条件
    return node; // 返回节点
  } // 结束方法
  resolveNode(nodeId: string, context: DialogueContext): ResolvedDialogueNode { // 解析节点
    const node = this.getNode(nodeId); // 获取节点
    const text = this.interpolate(node.text, context); // 替换文本变量
    const filteredChoices = (node.choices || []).filter(choice => this.evaluateCondition(choice.if, context)); // 过滤满足条件的选项
    const choices = filteredChoices.map(choice => ({ ...choice, text: this.interpolate(choice.text, context) })); // 替换选项文本
    const inventoryChoices = node.choicesFromInventory ? this.filterInventory(context.inventory, node.choicesFromInventory.tag) : []; // 生成背包选项
    return { text, choices, inventoryChoices, node }; // 返回解析结果
  } // 结束方法
  private interpolate(template: string, context: DialogueContext): string { // 模板替换
    return template.replace(/{{(.*?)}}/g, (_, key) => { // 使用正则匹配变量
      const trimmed = key.trim(); // 去除空格
      const map: Record<string, string> = { // 构建上下文字典
        weather: context.weather, // 天气
        day: context.day, // 日期
        playerName: context.playerName, // 玩家名称
        relationshipLevel: context.relationshipLevel, // 好感段位
        season: context.season, // 季节
        relationship: String(context.relationship) // 好感值
      }; // 结束映射
      return map[trimmed] ?? ""; // 返回对应值
    }); // 结束替换
  } // 结束方法
  private evaluateCondition(expression: string | undefined, context: DialogueContext): boolean { // 条件求值
    if (!expression) { // 若没有条件
      return true; // 默认通过
    } // 结束条件
    if (expression.includes("in")) { // 时间区间判断
      const [left, right] = expression.split("in").map(part => part.trim()); // 拆分表达式
      if (left === "time") { // 若左侧为时间
        const [start, end] = right.split("-").map(text => text.trim()); // 拆分区间
        return context.time >= start && context.time <= end; // 判断是否处于区间
      } // 结束条件
    } // 结束条件
    if (expression.includes(">=")) { // 大于等于判断
      const [left, right] = expression.split(">=").map(part => part.trim()); // 拆分表达式
      if (left === "relationship") { // 判断字段
        return context.relationship >= Number(right); // 数值比较
      } // 结束条件
    } // 结束条件
    return false; // 默认不通过
  } // 结束方法
  private filterInventory(inventory: InventoryItem[], tag: string): InventoryItem[] { // 背包筛选
    const [group, value] = tag.split(":"); // 拆分标签
    return inventory.filter(item => { // 遍历物品
      if (item.tags.includes(tag)) { // 若包含完整标签
        return true; // 直接通过
      } // 结束条件
      if (!value) { // 如果无冒号
        return item.tags.includes(group); // 检查组标签
      } // 结束条件
      return item.tags.includes(`${group}:${value}`) || item.tags.includes(group); // 允许匹配组或完整
    }); // 结束遍历
  } // 结束方法
} // 结束类
