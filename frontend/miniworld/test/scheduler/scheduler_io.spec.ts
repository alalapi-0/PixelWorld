import { describe, it, expect, vi, beforeEach } from 'vitest'; // 引入测试工具
import { promises as fs } from 'fs'; // 引入文件操作
import os from 'os'; // 引入临时目录工具
import path from 'path'; // 引入路径工具
import { SchedulerIO } from '../../src/config/SchedulerIO'; // 引入待测模块
import { execFile } from 'child_process'; // 引入被 mock 的函数

vi.mock('child_process', () => ({ // 预先 mock 子进程模块
  execFile: vi.fn((cmd: string, args: string[], callback: (error: Error | null, stdout: string, stderr: string) => void) => { // 创建假的 execFile
    callback(null, '', ''); // 立即调用回调模拟成功
  }), // 函数结束
})); // mock 结束

const schedulerSample = { // 定义排程样本
  version: 1, // 版本号
  timeScale: 'minutes', // 时间单位
  startAt: '2025-10-11T08:00:00Z', // 起始时间
  rows: [{ id: 'worker-1', label: '工人#1' }], // 行列表
  tasks: [], // 任务列表
}; // 样本结束

const execMock = vi.mocked(execFile); // 获取被 mock 的函数引用

beforeEach(() => { // 在每个测试前执行
  execMock.mockClear(); // 清空调用记录
}); // 钩子结束

describe('SchedulerIO', () => { // 定义测试套件
  it('可以读取与写入排程', async () => { // 定义读写测试
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'scheduler-')); // 创建临时目录
    const baseDir = path.join(tmp, 'scheduler'); // 计算排程目录
    await fs.mkdir(baseDir, { recursive: true }); // 创建目录
    const filePath = path.join(baseDir, 'scheduler.json'); // 计算文件路径
    await fs.writeFile(filePath, JSON.stringify(schedulerSample, null, 2)); // 写入样本文件
    const io = new SchedulerIO(baseDir, 'scheduler.json'); // 创建 IO 实例
    const loaded = await io.load(); // 读取排程
    expect(loaded).toEqual(schedulerSample); // 断言读取正确
    await io.save(loaded); // 保存排程
    const updated = JSON.parse(await fs.readFile(filePath, 'utf8')); // 重新读取文件
    expect(updated).toEqual(schedulerSample); // 断言保存成功
    expect(execMock).toHaveBeenCalledWith('python3', ['scripts/validate_scheduler.py'], expect.any(Function)); // 断言调用校验脚本
    expect(execMock).toHaveBeenCalledWith('python3', ['scripts/snapshot_scheduler.py'], expect.any(Function)); // 断言调用快照脚本
  }); // 测试结束

  it('拒绝越界路径', () => { // 定义路径测试
    expect(() => new SchedulerIO('/tmp', '../hack')).toThrow(); // 期望抛出错误
  }); // 测试结束
}); // 套件结束
