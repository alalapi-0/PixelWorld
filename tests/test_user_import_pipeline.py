"""测试用户素材导入脚本能正确处理最小示例并生成配置。"""  # 模块docstring中文说明用途
from __future__ import annotations  # 引入未来注解以兼容前向引用

import json  # 导入json模块读取生成的配置
import subprocess  # 导入subprocess以调用脚本
import sys  # 导入sys获取当前解释器路径
from pathlib import Path  # 导入Path处理临时目录

from PIL import Image  # 导入Pillow生成测试用PNG


def _create_sample_user_assets(root: Path) -> None:  # 定义内部辅助函数创建测试素材
    """在临时根目录生成最小瓦片与玩家雪碧图。"""  # 函数docstring中文说明

    tiles_dir = root / "assets" / "user_imports" / "tiles"  # 计算瓦片目录
    characters_dir = root / "assets" / "user_imports" / "characters"  # 计算角色目录
    tiles_dir.mkdir(parents=True, exist_ok=True)  # 创建瓦片目录
    characters_dir.mkdir(parents=True, exist_ok=True)  # 创建角色目录
    tilesheet = Image.new("RGBA", (64, 64), (0, 255, 0, 255))  # 创建64x64纯色瓦片图集
    tilesheet.save(tiles_dir / "tilesheet.png")  # 保存图集文件
    player = Image.new("RGBA", (128, 32), (255, 0, 0, 255))  # 创建128x32玩家雪碧图
    player.save(characters_dir / "player.png")  # 保存玩家图
    manifest = {  # 构造简化manifest字典
        "tile_size": 32,  # 默认瓦片尺寸
        "tiles": {  # 瓦片配置块
            "mode": "atlas",  # 使用图集模式
            "atlas": "tilesheet.png",  # 图集文件名称
            "bindings": {},  # 使用默认绑定顺序
        },  # 瓦片配置结束
        "characters": {  # 角色配置块
            "player": {  # 玩家配置
                "mode": "atlas",  # 使用雪碧图模式
                "file": "player.png",  # 雪碧图文件名
                "frame_width": 32,  # 单帧宽度
                "frame_height": 32,  # 单帧高度
                "frames": 4,  # 帧数
                "fps": 8,  # 帧率
            }  # 玩家配置结束
        },  # 角色配置结束
        "maps": {  # 地图配置块
            "use_user_map": False,  # 不启用用户地图
            "file": "demo_map.json",  # 占位地图文件
        },  # 地图配置结束
    }  # 构造简化manifest
    manifest_path = root / "assets" / "user_imports" / "user_manifest.json"  # 计算manifest路径
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")  # 写入配置


def test_import_user_assets_generates_build_outputs(tmp_path: Path) -> None:  # 定义测试函数
    """验证导入脚本能够生成图集、动画配置与映射。"""  # 函数docstring中文说明

    _create_sample_user_assets(tmp_path)  # 创建最小示例素材
    mapping_dir = tmp_path / "assets" / "mapping"  # 计算映射目录
    mapping_dir.mkdir(parents=True, exist_ok=True)  # 创建映射目录
    script_path = Path("scripts/import_user_assets.py")  # 计算脚本路径
    result = subprocess.run(  # 调用导入脚本
        [sys.executable, str(script_path), "--root", str(tmp_path)],  # 构造命令参数
        check=True,  # 出错抛异常
        capture_output=True,  # 捕获输出
        text=True,  # 文本模式
    )  # 子进程结束
    assert result.returncode == 0  # 确认脚本执行成功
    build_tilesheet = tmp_path / "assets" / "build" / "tiles" / "tilesheet.png"  # 计算输出图集路径
    build_player = tmp_path / "assets" / "build" / "characters" / "player.png"  # 计算玩家输出路径
    anim_config_path = tmp_path / "assets" / "build" / "characters" / "player.anim.json"  # 动画配置路径
    binding_path = tmp_path / "assets" / "mapping" / "tileset_binding.json"  # 绑定配置路径
    assert build_tilesheet.exists()  # 确认图集生成
    assert build_player.exists()  # 确认玩家图生成
    assert anim_config_path.exists()  # 确认动画配置生成
    assert binding_path.exists()  # 确认绑定文件生成
    with Image.open(build_tilesheet) as image:  # 打开图集验证尺寸
        assert image.size == (64, 64)  # 图集尺寸应保持64x64
    with Image.open(build_player) as image:  # 打开玩家图
        assert image.size == (128, 32)  # 玩家图尺寸保持128x32
    anim_config = json.loads(anim_config_path.read_text(encoding="utf-8"))  # 读取动画配置
    assert anim_config["frames"] == 4  # 帧数应为4
    assert anim_config["frame_width"] == 32  # 帧宽应为32
    binding_data = json.loads(binding_path.read_text(encoding="utf-8"))  # 读取绑定JSON
    assert binding_data["tile_size"] == 32  # 瓦片尺寸应为32
    assert binding_data["bindings"]["GRASS"] == 0  # 默认绑定草地索引为0
