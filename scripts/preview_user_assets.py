#!/usr/bin/env python3
"""为 Phaser 前端生成快速素材索引的辅助脚本。

脚本遍历 `assets/build`，汇总每个分类的文件路径、大小与扩展名，
将结果写入 `assets/build/preview_index.json`，同时把摘要日志写入
`logs/user_imports.log`，方便排查遗漏或命名冲突。
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path
from typing import Dict, List

IGNORED_FILES = {'.DS_Store'}


def configure_logger(log_path: Path) -> logging.Logger:
    """配置日志输出到文件与控制台。"""

    log_path.parent.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger('user-preview')
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    formatter = logging.Formatter('[%(asctime)s] %(levelname)s %(message)s')

    file_handler = logging.FileHandler(log_path, encoding='utf-8')
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)

    return logger


def parse_arguments() -> argparse.Namespace:
    """解析命令行参数。"""

    parser = argparse.ArgumentParser(description='Generate lightweight asset index for MiniWorld preview.')
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent, help='仓库根目录。')
    return parser.parse_args()


def scan_build_directory(build_root: Path) -> Dict[str, List[Dict[str, object]]]:
    """遍历构建目录并按照一级目录分组。"""

    if not build_root.exists():
        raise FileNotFoundError(f'build directory does not exist: {build_root}')
    grouped: Dict[str, List[Dict[str, object]]] = {}
    for file_path in sorted(build_root.rglob('*')):
        if not file_path.is_file():
            continue
        if file_path.name in IGNORED_FILES:
            continue
        relative = file_path.relative_to(build_root)
        category = relative.parts[0] if relative.parts else 'root'
        grouped.setdefault(category, []).append(
            {
                'path': str(relative).replace('\\', '/'),
                'size': file_path.stat().st_size,
                'type': (file_path.suffix.lower().lstrip('.') or 'unknown'),
            }
        )
    for values in grouped.values():
        values.sort(key=lambda item: item['path'])
    return grouped


def write_preview(build_root: Path, index: Dict[str, List[Dict[str, object]]]) -> Path:
    """写出索引文件并返回路径。"""

    target = build_root / 'preview_index.json'
    target.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding='utf-8')
    return target


def main() -> None:
    """执行入口。"""

    args = parse_arguments()
    root = args.root.resolve()
    build_root = root / 'assets/build'
    log_path = root / 'logs/user_imports.log'

    logger = configure_logger(log_path)
    logger.info('preview start | build=%s', build_root)

    index = scan_build_directory(build_root)
    target = write_preview(build_root, index)

    total_files = sum(len(files) for files in index.values())
    logger.info('preview completed | %s generated (%d files)', target, total_files)


if __name__ == '__main__':
    main()
