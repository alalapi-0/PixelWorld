#!/usr/bin/env python3  # 指定脚本解释器
"""生成assets/auto目录的文本快照"""  # 脚本说明

import shutil  # 引入文件复制工具
from datetime import datetime, timezone  # 引入时间处理模块
from pathlib import Path  # 引入路径工具

BASE_DIR = Path(__file__).resolve().parent.parent / 'assets' / 'auto'  # 计算自动数据目录
SNAPSHOT_DIR = BASE_DIR / '.snapshots'  # 计算快照目录
ALLOWED_SUFFIXES = {'.json', '.txt'}  # 定义允许的文本扩展名


def is_text_file(file_path: Path) -> bool:  # 判断文件是否为文本文件
    return file_path.suffix in ALLOWED_SUFFIXES  # 检查扩展名


def create_snapshot() -> None:  # 创建快照的主函数
    if not BASE_DIR.exists():  # 检查基础目录是否存在
        raise SystemExit('assets/auto 不存在')  # 若不存在则退出
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)  # 确保快照目录存在
    timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H-%M-%SZ')  # 生成UTC时间戳
    copied = []  # 记录复制的文件列表
    for file_path in BASE_DIR.iterdir():  # 遍历自动目录
        if file_path.is_file() and is_text_file(file_path):  # 仅处理文本文件
            target = SNAPSHOT_DIR / f'{timestamp}_{file_path.name}'  # 生成目标路径
            shutil.copyfile(file_path, target)  # 复制文件
            copied.append(target)  # 记录复制结果
    if not copied:  # 如果没有复制任何文件
        print('未找到可复制的文本文件')  # 输出提示
        return  # 结束函数
    print('生成快照:')  # 输出标题
    for item in copied:  # 遍历复制结果
        print(f'- {item}')  # 输出每个文件路径


if __name__ == '__main__':  # 脚本入口
    create_snapshot()  # 执行快照生成
