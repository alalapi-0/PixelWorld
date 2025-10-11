import samplesText from '../../../assets/agents/samples.md?raw'; // 引入示例文本
import { parseCommandScript } from '../../agents/CommandDSL'; // 引入解析器
import { CommanderInbox } from '../../agents/CommanderInbox'; // 引入收件箱
import { CommandParseResult } from '../../agents/CommandTypes'; // 引入解析结果类型
// 空行用于分隔
export class CommandConsole { // 定义指令控制台
  private inbox: CommanderInbox; // 保存收件箱引用
  private scriptText = ''; // 当前脚本文本
  private preview: CommandParseResult = { commands: [], errors: [], lines: [] }; // 当前解析结果
  public constructor(inbox: CommanderInbox) { // 构造函数
    this.inbox = inbox; // 保存引用
    this.loadSamples(); // 默认加载示例文本
  } // 构造结束
  public setText(text: string): void { // 设置脚本文本
    this.scriptText = text; // 保存文本
    this.preview = parseCommandScript(text); // 更新解析
  } // 方法结束
  public getText(): string { // 获取当前文本
    return this.scriptText; // 返回脚本
  } // 方法结束
  public getPreview(): CommandParseResult { // 获取解析结果
    return this.preview; // 返回缓存
  } // 方法结束
  public loadSamples(): void { // 载入示例脚本
    this.setText(samplesText); // 使用默认示例更新
  } // 方法结束
  public submit(issuerRole: string) { // 提交脚本
    return this.inbox.submit(this.scriptText, issuerRole); // 调用收件箱提交
  } // 方法结束
} // 类结束
