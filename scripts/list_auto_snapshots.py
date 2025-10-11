#!/usr/bin/env python3  # 指定脚本解释器
"""列出assets/auto/.snapshots下的文本快照"""  # 脚本说明

from pathlib import Path  # 引入路径工具

BASE_DIR = Path(__file__).resolve().parent.parent / 'assets' / 'auto'  # 计算自动数据目录
SNAPSHOT_DIR = BASE_DIR / '.snapshots'  # 计算快照目录


def list_snapshots() -> None:  # 定义列出快照的函数
    if not SNAPSHOT_DIR.exists():  # 若快照目录不存在
        print('暂无快照')  # 输出提示
        return  # 结束函数
    snapshots = sorted(SNAPSHOT_DIR.iterdir(), reverse=True)  # 按名称降序排序
    if not snapshots:  # 若无文件
        print('暂无快照')  # 输出提示
        return  # 结束函数
    print('可用快照列表:')  # 输出标题
    for file_path in snapshots:  # 遍历快照文件
        print(f'- {file_path.name}')  # 输出文件名


if __name__ == '__main__':  # 脚本入口
    list_snapshots()  # 执行列出逻辑
