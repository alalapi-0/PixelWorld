#!/usr/bin/env python3
"""从快照目录回滚 scheduler.json（仅文本操作）。"""
import argparse  # 引入命令行解析
import pathlib  # 引入路径工具
import shutil  # 引入文件复制
import sys  # 引入系统模块

BASE = pathlib.Path(__file__).resolve().parents[1]  # 计算仓库根目录
SOURCE = BASE / 'assets' / 'scheduler' / 'scheduler.json'  # 主排程文件路径
SNAP_DIR = BASE / 'assets' / 'scheduler' / 'snapshots'  # 快照目录路径

parser = argparse.ArgumentParser(description='回滚 scheduler.json')  # 创建解析器
parser.add_argument('--latest', action='store_true', help='回滚到最新快照')  # 添加最新选项
parser.add_argument('--stamp', type=str, help='指定时间戳前缀')  # 添加指定时间戳选项
args = parser.parse_args()  # 解析参数

if not SNAP_DIR.exists():  # 如果快照目录不存在
    print('无快照可用', file=sys.stderr)  # 输出提示
    sys.exit(1)  # 返回错误

candidates = sorted(SNAP_DIR.glob('*_scheduler.json'))  # 收集所有快照
if not candidates:  # 如果没有快照
    print('快照目录为空', file=sys.stderr)  # 输出提示
    sys.exit(1)  # 返回错误

selected = None  # 初始化选择结果
if args.latest:  # 如果选择最新
    selected = candidates[-1]  # 取最后一个
elif args.stamp:  # 如果指定时间戳
    prefix = f"{args.stamp}_scheduler.json"  # 构造文件名
    for item in candidates:  # 遍历快照
        if item.name == prefix:  # 如果名称匹配
            selected = item  # 记录匹配项
            break  # 终止循环
else:  # 未指定选项
    parser.error('必须提供 --latest 或 --stamp')  # 抛出错误

if not selected:  # 如果仍未找到快照
    print('未找到匹配快照', file=sys.stderr)  # 输出提示
    sys.exit(1)  # 返回错误

shutil.copyfile(selected, SOURCE)  # 复制快照到主文件
print(f'已回滚到: {selected}')  # 输出结果
