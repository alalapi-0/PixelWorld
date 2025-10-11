#!/usr/bin/env python3  # 指定脚本解释器
"""回滚assets/auto目录到指定文本快照"""  # 脚本说明

import argparse  # 引入参数解析模块
import shutil  # 引入文件复制模块
from pathlib import Path  # 引入路径工具

BASE_DIR = Path(__file__).resolve().parent.parent / 'assets' / 'auto'  # 计算自动数据目录
SNAPSHOT_DIR = BASE_DIR / '.snapshots'  # 计算快照目录
ALLOWED_SUFFIXES = {'.json', '.txt'}  # 定义允许的扩展名


def is_text_file(file_path: Path) -> bool:  # 判断是否为文本文件
    return file_path.suffix in ALLOWED_SUFFIXES  # 检查扩展名


def list_snapshots() -> list[Path]:  # 列出可用快照文件
    if not SNAPSHOT_DIR.exists():  # 若快照目录不存在
        return []  # 返回空列表
    return sorted(SNAPSHOT_DIR.iterdir(), reverse=True)  # 按名称降序排列


def restore_snapshot(prefix: str) -> None:  # 根据前缀恢复快照
    restored = []  # 记录恢复的文件
    for snapshot in SNAPSHOT_DIR.glob(f'{prefix}_*'):  # 遍历匹配前缀的快照文件
        if snapshot.is_file() and is_text_file(snapshot):  # 确保为文本文件
            target_name = snapshot.name.split('_', 1)[1]  # 去除时间戳前缀
            target_path = BASE_DIR / target_name  # 计算目标路径
            shutil.copyfile(snapshot, target_path)  # 覆盖目标文件
            restored.append(target_path)  # 记录恢复结果
    if not restored:  # 若未恢复任何文件
        raise SystemExit(f'未找到前缀 {prefix} 的快照')  # 抛出错误
    print('已回滚以下文件:')  # 输出标题
    for item in restored:  # 遍历恢复结果
        print(f'- {item}')  # 输出文件路径


def parse_args() -> argparse.Namespace:  # 解析命令行参数
    parser = argparse.ArgumentParser(description='回滚自动生成文本文件')  # 创建解析器
    group = parser.add_mutually_exclusive_group(required=True)  # 创建互斥参数组
    group.add_argument('--latest', action='store_true', help='回滚至最近的快照')  # 添加latest选项
    group.add_argument('--stamp', type=str, help='指定时间戳前缀')  # 添加指定时间戳选项
    return parser.parse_args()  # 返回解析结果


def main() -> None:  # 主执行函数
    args = parse_args()  # 解析参数
    snapshots = list_snapshots()  # 列出所有快照
    if not snapshots:  # 若没有快照
        raise SystemExit('没有可用快照')  # 直接退出
    if args.latest:  # 若选择最新快照
        latest_prefix = snapshots[0].name.split('_', 1)[0]  # 提取最新快照前缀
        restore_snapshot(latest_prefix)  # 执行恢复
        return  # 结束流程
    if args.stamp:  # 若指定时间戳
        restore_snapshot(args.stamp)  # 根据前缀恢复
        return  # 结束流程


if __name__ == '__main__':  # 脚本入口
    main()  # 执行主函数
