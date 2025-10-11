"""MiniWorld 构建与素材同步流程的集成测试。"""

from __future__ import annotations

import json
from pathlib import Path


def test_miniworld_distribution_structure() -> None:
    """验证 MiniWorld 构建产物与素材索引是否齐备。"""

    root = Path(__file__).resolve().parents[1]
    dist_dir = root / 'frontend/miniworld/dist'
    build_dir = root / 'assets/build'
    preview_file = build_dir / 'preview_index.json'

    assert dist_dir.exists() and dist_dir.is_dir(), 'MiniWorld dist/ 目录缺失，请运行 pnpm --filter miniworld build'
    assert build_dir.exists() and build_dir.is_dir(), 'assets/build/ 目录缺失，请运行 make user-import'

    build_files = [path for path in build_dir.rglob('*') if path.is_file()]
    assert build_files, 'assets/build/ 为空，请确认用户素材已导入'

    assert preview_file.exists(), 'preview_index.json 未生成，请运行 make user-preview'

    index = json.loads(preview_file.read_text(encoding='utf-8'))
    missing_paths = []
    asset_types = set()

    for category, entries in index.items():
        assert isinstance(entries, list), f'分类 {category} 的索引格式异常'
        for entry in entries:
            rel_path = entry.get('path')
            asset_type = entry.get('type', 'unknown')
            asset_types.add(asset_type)
            target = build_dir / rel_path
            if not target.exists():
                missing_paths.append(rel_path)
            else:
                assert target.is_file(), f'{rel_path} 不是文件'

    assert not missing_paths, f'索引中的文件缺失: {missing_paths}'
    assert any(asset_type in {'png', 'jpg', 'jpeg'} for asset_type in asset_types), '索引中缺少图像资源'
    assert any(asset_type in {'ogg', 'mp3', 'wav'} for asset_type in asset_types), '索引中缺少音频资源'

    print('MiniWorld build ✅')
