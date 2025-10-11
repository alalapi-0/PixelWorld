#!/usr/bin/env python3
"""同步 `assets/user_imports` 到 `assets/build` 的实用脚本。

本脚本承担以下责任：
1. 读取用户素材清单（如存在），提取瓦片与角色的尺寸设定；
2. 将素材目录完整复制到 `assets/build`，在复制过程中统一名称格式（去除空格、转为小写）；
3. 生成一份 `metadata.json`，供 Phaser/Vite 前端快速获知帧尺寸与导入明细；
4. 把执行日志写入 `logs/user_imports.log`，便于排查问题。

脚本仅依赖 Python 标准库，可安全在 CI 环境运行。
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

DEFAULT_TILE_SIZE = 32
DEFAULT_PLAYER_WIDTH = 16
DEFAULT_PLAYER_HEIGHT = 32
DEFAULT_PLAYER_FPS = 6

IGNORED_FILES = {'.DS_Store'}


def configure_logger(log_path: Path) -> logging.Logger:
    """创建写入文件与终端的日志记录器。"""

    log_path.parent.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger('user-imports')
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
    """解析命令行参数，允许覆盖仓库根目录。"""

    parser = argparse.ArgumentParser(description='Import user assets into the unified build directory.')
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent, help='仓库根目录。')
    parser.add_argument('--no-clean', action='store_true', help='保留 build 目录中的旧文件（默认会清空）。')
    return parser.parse_args()


def sanitize_component(component: str) -> str:
    """对路径片段进行统一化处理。"""

    safe = component.strip().replace(' ', '_').replace(':', '_')
    return safe.lower()


def iter_user_files(source_root: Path) -> Iterable[Path]:
    """递归枚举用户素材文件。"""

    for path in sorted(source_root.rglob('*')):
        if not path.is_file():
            continue
        if path.name in IGNORED_FILES:
            continue
        yield path


def clean_build_directory(build_root: Path) -> None:
    """删除构建目录中的旧文件以防遗留。"""

    if not build_root.exists():
        return
    for item in build_root.iterdir():
        if item.is_file() or item.is_symlink():
            item.unlink()
        else:
            shutil.rmtree(item)


def copy_assets(source_root: Path, build_root: Path, logger: logging.Logger) -> Tuple[List[Dict[str, str]], Dict[str, int]]:
    """复制素材并返回明细列表与类型统计。"""

    manifest: List[Dict[str, str]] = []
    counters: Dict[str, int] = {}
    for source in iter_user_files(source_root):
        relative_parts = [sanitize_component(part) for part in source.relative_to(source_root).parts]
        relative_path = Path(*relative_parts)
        destination = build_root / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        digest = hashlib.sha1(destination.read_bytes()).hexdigest()
        category = relative_parts[0] if relative_parts else 'root'
        counters[category] = counters.get(category, 0) + 1
        manifest.append(
            {
                'source': str(source.relative_to(source_root)),
                'target': str(relative_path),
                'sha1': digest,
                'size': destination.stat().st_size,
                'category': category,
            }
        )
        logger.info('copied %s -> %s', source, destination)
    return manifest, counters


def load_user_manifest(source_root: Path, logger: logging.Logger) -> Dict[str, object]:
    """读取用户 manifest（如存在）。"""

    manifest_path = source_root / 'user_manifest.json'
    if not manifest_path.exists():
        logger.info('user_manifest.json not found, falling back to defaults')
        return {}
    try:
        return json.loads(manifest_path.read_text(encoding='utf-8'))
    except json.JSONDecodeError as error:
        logger.warning('failed to parse user_manifest.json: %s', error)
        return {}


def extract_meta(manifest: Dict[str, object]) -> Dict[str, object]:
    """从 manifest 中提取前端需要的帧尺寸信息。"""

    tiles = manifest.get('tiles', {}) if isinstance(manifest, dict) else {}
    characters = manifest.get('characters', {}) if isinstance(manifest, dict) else {}
    player_cfg = characters.get('player', {}) if isinstance(characters, dict) else {}
    return {
        'tiles': {
            'frameWidth': int(manifest.get('tile_size', DEFAULT_TILE_SIZE)) if isinstance(manifest, dict) else DEFAULT_TILE_SIZE,
            'frameHeight': int(manifest.get('tile_size', DEFAULT_TILE_SIZE)) if isinstance(manifest, dict) else DEFAULT_TILE_SIZE,
        },
        'player': {
            'frameWidth': int(player_cfg.get('frame_width', DEFAULT_PLAYER_WIDTH)) if isinstance(player_cfg, dict) else DEFAULT_PLAYER_WIDTH,
            'frameHeight': int(player_cfg.get('frame_height', DEFAULT_PLAYER_HEIGHT)) if isinstance(player_cfg, dict) else DEFAULT_PLAYER_HEIGHT,
            'frameRate': int(player_cfg.get('fps', DEFAULT_PLAYER_FPS)) if isinstance(player_cfg, dict) else DEFAULT_PLAYER_FPS,
        },
    }


def write_metadata(build_root: Path, manifest: List[Dict[str, str]], meta: Dict[str, object], logger: logging.Logger) -> None:
    """写出 metadata.json 与 manifest.json。"""

    build_root.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    metadata = {
        'generatedAt': generated_at,
        'files': manifest,
        **meta,
    }
    (build_root / 'metadata.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
    (build_root / 'preview_index.json').write_text(
        json.dumps(_group_by_category(manifest), ensure_ascii=False, indent=2),
        encoding='utf-8',
    )
    logger.info('metadata written to %s', build_root / 'metadata.json')


def _group_by_category(manifest: List[Dict[str, str]]) -> Dict[str, List[Dict[str, str]]]:
    grouped: Dict[str, List[Dict[str, str]]] = {}
    for entry in manifest:
        grouped.setdefault(entry['category'], []).append(entry)
    for values in grouped.values():
        values.sort(key=lambda item: item['target'])
    return grouped


def main() -> None:
    """脚本入口。"""

    args = parse_arguments()
    root = args.root.resolve()
    source_root = root / 'assets/user_imports'
    build_root = root / 'assets/build'
    log_path = root / 'logs/user_imports.log'

    logger = configure_logger(log_path)
    logger.info('import start | source=%s build=%s', source_root, build_root)
    if not source_root.exists():
        logger.error('source directory does not exist: %s', source_root)
        raise SystemExit(1)

    if not args.no_clean:
        clean_build_directory(build_root)
        logger.info('cleaned build directory')

    manifest = load_user_manifest(source_root, logger)
    copied_files, counters = copy_assets(source_root, build_root, logger)
    meta = extract_meta(manifest)
    write_metadata(build_root, copied_files, meta, logger)

    summary = ', '.join(f"{key}={value}" for key, value in sorted(counters.items())) or 'no files copied'
    logger.info('import completed | %s', summary)


if __name__ == '__main__':
    main()
