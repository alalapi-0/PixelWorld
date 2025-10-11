#!/usr/bin/env python3
"""Generate a lightweight preview index for user-imported assets.

The preview index is a pure-text JSON file that summarises the contents of
``assets/build``.  It enables tooling and front-end code to quickly enumerate
available assets without touching binary payloads.  The script performs three
steps:

1. Walk ``assets/build`` and catalogue each file by its relative path.
2. Group the results by their first directory component so the UI can display
   categories such as ``audio`` or ``characters``.
3. Write the resulting data to ``assets/preview_index.json`` and record the
   activity in ``logs/user_imports.log``.

Only the Python standard library is used, ensuring compatibility with minimal
CI images.
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path
from typing import Dict, List

LOG_FORMAT = '[%(asctime)s] %(levelname)s %(message)s'


def configure_logger(log_path: Path) -> logging.Logger:
    """Configure a shared logger for preview generation."""

    log_path.parent.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger('user-preview')
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    formatter = logging.Formatter(LOG_FORMAT)

    file_handler = logging.FileHandler(log_path, encoding='utf-8')
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)

    return logger


def parse_arguments() -> argparse.Namespace:
    """Parse CLI arguments."""

    parser = argparse.ArgumentParser(description='Create a text-only preview index for imported assets.')
    parser.add_argument(
        '--root',
        type=Path,
        default=Path(__file__).resolve().parent.parent,
        help='Repository root directory. Defaults to the project root detected from this script.',
    )
    return parser.parse_args()


def scan_build_directory(build_root: Path) -> Dict[str, List[Dict[str, object]]]:
    """Enumerate files inside ``build_root`` grouped by category."""

    if not build_root.exists():
        raise FileNotFoundError(f'build directory does not exist: {build_root}')

    grouped: Dict[str, List[Dict[str, object]]] = {}

    for path in sorted(build_root.rglob('*')):
        if not path.is_file():
            continue
        relative = path.relative_to(build_root)
        category = relative.parts[0] if relative.parts else 'root'
        grouped.setdefault(category, []).append(
            {
                'path': str(relative).replace('\\', '/'),
                'size': path.stat().st_size,
                'type': path.suffix.lstrip('.').lower() or 'unknown',
            }
        )

    for entries in grouped.values():
        entries.sort(key=lambda item: item['path'])

    return grouped


def write_preview(root: Path, index: Dict[str, List[Dict[str, object]]]) -> Path:
    """Write the preview index next to the shared assets directory."""

    target = root / 'assets/preview_index.json'
    target.write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding='utf-8')
    return target


def main() -> None:
    """Entry point for preview generation."""

    args = parse_arguments()
    root = args.root.resolve()
    build_root = root / 'assets/build'
    log_path = root / 'logs/user_imports.log'

    logger = configure_logger(log_path)
    logger.info('user-preview start | build=%s', build_root)

    index = scan_build_directory(build_root)
    target = write_preview(root, index)

    total_files = sum(len(items) for items in index.values())
    logger.info('user-preview completed | %d files indexed | output=%s', total_files, target)

    print('✅ Assets preview index refreshed')


if __name__ == '__main__':
    main()
