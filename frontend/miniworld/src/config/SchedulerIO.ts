import { promises as fs } from 'fs'; // 引入文件读写接口
import path from 'path'; // 引入路径工具
import { execFile } from 'child_process'; // 引入子进程调用
import { promisify } from 'util'; // 引入工具将回调转为 Promise
import { SchedulerData } from '../scheduler/GanttLayout'; // 引入排程数据类型

const execFileAsync = promisify(execFile); // 将 execFile 转换为 Promise 形式

export class SchedulerIO { // 定义排程文件的读写工具
  private readonly baseDir: string; // 保存白名单目录
  private readonly filePath: string; // 保存主文件路径

  public constructor(baseDir = path.resolve(process.cwd(), 'assets', 'scheduler'), fileName = 'scheduler.json') { // 构造函数
    this.baseDir = baseDir; // 保存基础目录
    this.filePath = path.resolve(this.baseDir, fileName); // 计算主文件路径
    this.ensureWhitelist(this.filePath); // 检查路径安全
  } // 构造结束

  public async load(): Promise<SchedulerData> { // 读取排程文件
    const content = await fs.readFile(this.filePath, 'utf8'); // 异步读取文本
    const data = JSON.parse(content) as SchedulerData; // 解析 JSON
    return data; // 返回数据
  } // 方法结束

  public async save(data: SchedulerData): Promise<void> { // 保存排程文件
    await this.runValidate(); // 保存前执行校验脚本
    const text = `${JSON.stringify(data, null, 2)}\n`; // 序列化为文本并保证换行
    await fs.writeFile(this.filePath, text, 'utf8'); // 写入主文件
    await this.runSnapshot(); // 写入后生成快照
  } // 方法结束

  public getPath(): string { // 获取主文件路径
    return this.filePath; // 返回路径
  } // 方法结束

  private ensureWhitelist(target: string): void { // 确保目标路径在白名单内
    if (!target.startsWith(this.baseDir)) { // 如果不在基础目录中
      throw new Error(`Path not allowed: ${target}`); // 抛出错误
    } // 条件结束
    if (!target.endsWith('.json')) { // 如果后缀不是 JSON
      throw new Error(`Only json files allowed: ${target}`); // 抛出错误
    } // 条件结束
  } // 方法结束

  private async runSnapshot(): Promise<void> { // 调用快照脚本
    await execFileAsync('python3', ['scripts/snapshot_scheduler.py']); // 使用子进程执行脚本
  } // 方法结束

  public async runRollback(args: string[] = ['--latest']): Promise<void> { // 暴露回滚功能
    await execFileAsync('python3', ['scripts/rollback_scheduler.py', ...args]); // 调用回滚脚本
  } // 方法结束

  public async runValidate(): Promise<void> { // 触发校验脚本
    await execFileAsync('python3', ['scripts/validate_scheduler.py']); // 调用校验脚本
  } // 方法结束
} // 类结束
