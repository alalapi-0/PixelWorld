#!/usr/bin/env python3
"""Synchronise user-supplied assets into the shared build directory.

This script is intentionally limited to *textual* operations.  It never
encodes, compresses, or transforms binary payloads; instead it simply copies the
files that already exist within the repository.  The workflow is:

1. Validate that the expected top-level categories exist beneath
   ``assets/user_imports``.
2. Mirror the directory structure into ``assets/build`` using ``shutil.copy2``
   (which preserves timestamps without decoding the file contents).
3. Produce a lightweight ``asset_index.json`` file that records the relative
   path, size, and modification timestamp for every imported file.
4. Append a log entry to ``logs/user_imports.log`` and emit a success message
   to ``stdout`` so automated jobs can assert completion.

The command accepts an optional ``--root`` argument so that CI pipelines can run
it from arbitrary working directories.  All paths are resolved relative to the
repository root, and only the Python standard library is required.
"""

from __future__ import annotations

import argparse
import json
import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List

# Allowed directory names inside ``assets/user_imports``.  Keeping this list
# explicit ensures that accidental folders do not leak into ``assets/build``.
ALLOWED_TOP_LEVEL = {
    'audio',
    'characters',
    'tiles',
    'ui',
    'effects',
}

# Files that live directly under assets/user_imports/ but are not copied into
# the build directory.
ALLOWED_TOP_LEVEL_FILES = {'README.md', 'user_manifest.json'}

# ``audio`` has a fixed set of sub-categories.  The script verifies these to
# keep naming consistent with the MiniWorld runtime.
ALLOWED_AUDIO_SUBDIRS = {'bgm', 'bgs', 'me', 'se'}

LOG_FORMAT = '[%(asctime)s] %(levelname)s %(message)s'


def configure_logger(log_path: Path) -> logging.Logger:
    """Configure a file-and-console logger."""

    log_path.parent.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger('user-imports')
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

    parser = argparse.ArgumentParser(description='Mirror user assets into assets/build (text operations only).')
    parser.add_argument(
        '--root',
        type=Path,
        default=Path(__file__).resolve().parent.parent,
        help='Repository root directory. Defaults to the project root detected from this script.',
    )
    parser.add_argument(
        '--move',
        action='store_true',
        help='Move files instead of copying them. Copying is the default to preserve the source archive.',
    )
    return parser.parse_args()


def iter_user_files(source_root: Path) -> Iterable[Path]:
    """Yield all files contained within ``source_root``."""

    for candidate in sorted(source_root.rglob('*')):
        if candidate.is_file():
            yield candidate


def validate_path(relative: Path) -> None:
    """Ensure that the provided relative path adheres to the naming policy."""

    if not relative.parts:
        raise ValueError('Empty asset path encountered during import.')
    top_level = relative.parts[0]
    if top_level not in ALLOWED_TOP_LEVEL:
        raise ValueError(f'Unsupported asset category: {top_level}')
    if top_level == 'audio' and len(relative.parts) > 1:
        subcategory = relative.parts[1]
        if subcategory not in ALLOWED_AUDIO_SUBDIRS:
            raise ValueError(f'Unsupported audio sub-category: {subcategory}')


def mirror_assets(
    source_root: Path,
    build_root: Path,
    move_mode: bool,
    logger: logging.Logger,
) -> List[Dict[str, object]]:
    """Mirror files into ``build_root`` and return manifest entries."""

    manifest: List[Dict[str, object]] = []
    build_root.mkdir(parents=True, exist_ok=True)

    for file_path in iter_user_files(source_root):
        relative = file_path.relative_to(source_root)
        top_level = relative.parts[0] if relative.parts else ''
        if top_level in ALLOWED_TOP_LEVEL_FILES:
            logger.info('skipped %s (metadata file)', file_path)
            continue
        validate_path(relative)

        destination = build_root / relative
        destination.parent.mkdir(parents=True, exist_ok=True)

        if move_mode:
            operation = 'moved'
            if destination.exists():
                destination.unlink()
            shutil.move(str(file_path), destination)
        else:
            operation = 'copied'
            shutil.copy2(file_path, destination)

        stat = destination.stat()
        manifest.append(
            {
                'category': relative.parts[0],
                'relativePath': str(relative).replace('\\', '/'),
                'size': stat.st_size,
                'modified': datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
                'operation': operation,
            }
        )
        logger.info('%s %s -> %s', operation, file_path, destination)

    return manifest


def write_index(build_root: Path, manifest: List[Dict[str, object]]) -> None:
    """Write the manifest to ``asset_index.json`` within ``build_root``."""

    index_path = build_root / 'asset_index.json'
    payload = {
        'generatedAt': datetime.now(timezone.utc).isoformat(),
        'files': manifest,
    }
    index_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')


def main() -> None:
    """Entry point for the import utility."""

    args = parse_arguments()
    root = args.root.resolve()
    source_root = root / 'assets/user_imports'
    build_root = root / 'assets/build'
    log_path = root / 'logs/user_imports.log'

    logger = configure_logger(log_path)

    if not source_root.exists():
        logger.error('Source directory does not exist: %s', source_root)
        raise SystemExit(1)

    logger.info('user-import start | source=%s | build=%s | move=%s', source_root, build_root, args.move)

    # Ensure the build directory is cleared without touching unrelated files.
    if build_root.exists():
        for entry in sorted(build_root.iterdir()):
            if entry.name == '.gitkeep':
                continue
            if entry.is_file():
                entry.unlink()
            else:
                shutil.rmtree(entry)

    manifest = mirror_assets(source_root, build_root, args.move, logger)
    write_index(build_root, manifest)

    logger.info('user-import completed | %d files processed', len(manifest))
    print('✅ Assets successfully imported (text-only operations)')


if __name__ == '__main__':
    main()
