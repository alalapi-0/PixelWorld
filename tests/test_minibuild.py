"""Integration checks for the MiniWorld build pipeline."""

from __future__ import annotations

import json
from pathlib import Path


def test_miniworld_build_and_assets() -> None:
    """Validate that the build output and asset indexes exist."""

    repo_root = Path(__file__).resolve().parents[1]

    dist_dir = repo_root / 'frontend/miniworld/dist'
    assert dist_dir.exists() and dist_dir.is_dir(), 'MiniWorld dist directory is missing. Run `make miniworld-build` first.'

    asset_index_path = repo_root / 'assets/build/asset_index.json'
    assert asset_index_path.exists(), 'Run `make user-import` to populate assets/build/asset_index.json.'

    asset_index = json.loads(asset_index_path.read_text(encoding='utf-8'))
    assert isinstance(asset_index.get('files'), list), 'asset_index.json must include a "files" list.'

    preview_index_path = repo_root / 'assets/preview_index.json'
    assert preview_index_path.exists(), 'Run `make user-preview` to produce assets/preview_index.json.'

    preview_index = json.loads(preview_index_path.read_text(encoding='utf-8'))
    assert isinstance(preview_index, dict), 'assets/preview_index.json should be a JSON object.'

    shared_audio = repo_root / 'assets/user_imports/audio'
    for required in ('bgm', 'bgs', 'me', 'se'):
        candidate = shared_audio / required
        assert candidate.exists() and candidate.is_dir(), f'Missing audio category: {required}'

    print('✅ MiniWorld build and asset mapping passed')
