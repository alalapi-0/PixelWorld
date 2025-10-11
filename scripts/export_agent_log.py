#!/usr/bin/env python3  # 指定脚本解释器
import json  # 引入JSON库
from pathlib import Path  # 引入路径工具
from datetime import datetime  # 引入时间格式化

INPUT_PATH = Path('logs/agents/runtime-log.json')  # 定义输入日志路径
OUTPUT_DIR = Path('logs/agents')  # 定义输出目录

def main() -> None:  # 主函数
    if not INPUT_PATH.exists():  # 判断日志文件是否存在
        print('未找到日志文件 logs/agents/runtime-log.json')  # 打印提示
        return  # 结束执行
    raw_text = INPUT_PATH.read_text(encoding='utf-8')  # 读取原始文本
    if not raw_text.strip():  # 判断内容是否为空
        print('日志文件为空')  # 提示为空
        return  # 结束执行
    entries = json.loads(raw_text)  # 解析JSON内容
    lines = []  # 初始化输出行列表
    for entry in entries:  # 遍历每条记录
        timestamp = entry.get('timestamp', 0)  # 读取时间戳
        tag = entry.get('tag', 'log')  # 读取标签
        message = entry.get('message', '')  # 读取消息
        task_id = entry.get('taskId')  # 读取任务ID
        detail = entry.get('detail')  # 读取详细信息
        dt = datetime.fromtimestamp(timestamp / 1000)  # 将毫秒转换为时间
        extra = f" task={task_id}" if task_id else ''  # 构造任务描述
        extra_detail = f" detail={detail}" if detail else ''  # 构造详情描述
        line = f"[{dt.isoformat()}][{tag}]{extra}{extra_detail} {message}"  # 构造输出行
        lines.append(line)  # 保存输出行
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)  # 确保输出目录存在
    filename = f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"  # 构造文件名
    out_path = OUTPUT_DIR / filename  # 组合输出路径
    out_path.write_text('\n'.join(lines), encoding='utf-8')  # 写入文本文件
    print(f'日志已导出到 {out_path}')  # 提示导出完成

if __name__ == '__main__':  # 判断是否直接执行
    main()  # 调用主函数
