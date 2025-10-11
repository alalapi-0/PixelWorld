"""针对用户素材导入与预览索引的文本级测试。"""

from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from scripts.import_user_assets import run_import
from scripts.preview_user_assets import run_preview


def _write_dummy_file(path: Path, content: str) -> None:
    """在给定路径写入文本内容，用于模拟素材文件。"""

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def test_import_generates_index(tmp_path: Path) -> None:
    """验证导入与预览脚本在纯文本模式下正确工作。"""

    root = tmp_path
    # 准备示例素材（使用文本文件模拟 ogg/png，符合“只写文本”的约束）
    _write_dummy_file(root / "assets/user_imports/Audio/BGM/field.ogg", "BGM")
    _write_dummy_file(root / "assets/user_imports/Audio/SE/click.ogg", "SE")
    _write_dummy_file(root / "assets/user_imports/Graphics/Characters/Hero.png", "IMG")
    _write_dummy_file(root / "assets/user_imports/Graphics/Battlebacks1/Forest.png", "BG")

    # 执行导入脚本（复制模式）
    run_import(root, move_mode=False, rule_file=None)

    build_root = root / "assets/build"
    index_path = build_root / "index.json"
    assert index_path.exists(), "导入后必须生成 assets/build/index.json"

    # 校验索引内容与实际文件对齐
    with index_path.open("r", encoding="utf-8") as handle:
        index_payload = json.load(handle)

    for _category, entries in index_payload["audio"].items():
        for relative in entries:
            assert (build_root / relative).exists(), f"音频路径缺失: {relative}"

    for _category, entries in index_payload["images"].items():
        for relative in entries:
            assert (build_root / relative).exists(), f"图像路径缺失: {relative}"

    # 确保没有生成额外的二进制文件：build 与 user 的文件集合应仅以复制关系存在
    user_files = {
        path.relative_to(root).as_posix()
        for path in (root / "assets/user_imports").rglob("*")
        if path.is_file()
    }
    build_files = {
        path.relative_to(root).as_posix()
        for path in build_root.rglob("*")
        if path.is_file()
    }
    for build_file in build_files:
        original_name = Path(build_file).name
        suffix = Path(build_file).suffix.lower()
        if suffix in {".json"}:  # 索引文件不参与校验
            continue
        assert any(Path(entry).name == original_name for entry in user_files), "复制的文件必须来源于用户素材"

    # 执行预览脚本并检查结构
    preview_data = run_preview(root)
    preview_path = root / "assets/preview_index.json"
    assert preview_path.exists(), "预览清单需要写入 assets/preview_index.json"
    assert all("type" in item and "path" in item for item in preview_data["audio"]), "音频清单缺少字段"
    assert all("type" in item and "path" in item for item in preview_data["images"]), "图像清单缺少字段"

    print("✅ MiniWorld import/preview text-only pipeline passed")
