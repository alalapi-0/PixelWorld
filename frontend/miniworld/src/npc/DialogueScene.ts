// 引入运行器类型
import { DialogueRunner } from "./DialogueRunner"; // 对话运行器
import { ResolvedDialogueNode } from "./DialogueEngine"; // 解析节点类型
// 定义渲染结果
export interface DialogueRender { // 渲染文本结构
  header: string; // 标题
  body: string; // 对话正文
  options: string[]; // 选项文本
  inventoryOptions: string[]; // 背包选项
} // 结束接口
// 定义简单的对话场景
export class DialogueScene { // 文本化对话界面
  constructor(private runner: DialogueRunner) {} // 保存运行器引用
  render(): DialogueRender { // 渲染当前状态
    const resolved = this.runner.getCurrent(); // 获取解析节点
    if (!resolved) { // 若无节点
      return { header: "对话结束", body: "", options: [], inventoryOptions: [] }; // 返回结束文本
    } // 结束条件
    return this.convert(resolved); // 转换为文本
  } // 结束方法
  private convert(resolved: ResolvedDialogueNode): DialogueRender { // 转换逻辑
    const header = "对话"; // 简单标题
    const body = resolved.text; // 使用解析文本
    const options = resolved.choices.map((choice, index) => `${index + 1}. ${choice.text}`); // 列出选项
    const inventoryOptions = resolved.inventoryChoices.map(item => `${item.name} x${item.quantity}`); // 背包选项显示
    return { header, body, options, inventoryOptions }; // 返回渲染结果
  } // 结束方法
} // 结束类
