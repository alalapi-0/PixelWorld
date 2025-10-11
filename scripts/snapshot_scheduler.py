#!/usr/bin/env python3
"""生成 scheduler.json 的时间戳快照（仅文本复制）。"""
import datetime  # 引入日期时间模块
import pathlib  # 引入路径工具
import shutil  # 引入文件复制工具
import sys  # 引入系统模块

BASE = pathlib.Path(__file__).resolve().parents[1]  # 计算仓库根目录
SOURCE = BASE / 'assets' / 'scheduler' / 'scheduler.json'  # 构造源文件路径
TARGET_DIR = BASE / 'assets' / 'scheduler' / 'snapshots'  # 构造快照目录路径

if not SOURCE.exists():  # 如果源文件不存在
    print('scheduler.json 不存在，无法生成快照', file=sys.stderr)  # 输出错误提示
    sys.exit(1)  # 返回错误码

TARGET_DIR.mkdir(parents=True, exist_ok=True)  # 确保快照目录存在
stamp = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H-%M-%SZ')  # 生成UTC时间戳
TARGET = TARGET_DIR / f'{stamp}_scheduler.json'  # 生成目标文件路径
shutil.copyfile(SOURCE, TARGET)  # 复制文件内容
print(f'生成快照: {TARGET}')  # 输出结果
