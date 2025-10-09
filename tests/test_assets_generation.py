"""测试生成素材与地图脚本能在临时目录正确输出 PNG 与 JSON。"""  # 模块docstring中文说明用途
from __future__ import annotations  # 引入未来注解便于类型标注

import json  # 导入JSON模块用于验证地图文件
import subprocess  # 导入subprocess以调用脚本
import sys  # 导入sys获取当前Python解释器路径
from pathlib import Path  # 导入Path处理路径

from PIL import Image  # 导入Pillow以检查PNG尺寸


def test_generate_assets_and_map(tmp_path: Path) -> None:  # 定义测试函数
    """在临时目录运行素材脚本并验证输出结构。"""  # 函数docstring中文说明
    output_dir = tmp_path / "build"  # 构造素材输出目录
    tiles_script = Path("scripts/gen_tiles_and_player.py")  # 指向瓦片生成脚本
    result_tiles = subprocess.run(  # 调用脚本生成PNG
        [sys.executable, str(tiles_script), "--output", str(output_dir), "--skip-frontend-mirror"],  # 命令参数列表
        check=True,  # 出错时抛出异常
        capture_output=True,  # 捕获输出方便调试
        text=True,  # 以文本模式捕获输出
    )  # 子进程结束
    assert result_tiles.returncode == 0  # 断言脚本成功
    tilesheet_path = output_dir / "tiles" / "tilesheet.png"  # 计算图集路径
    player_path = output_dir / "characters" / "player.png"  # 计算玩家路径
    assert tilesheet_path.exists()  # 确认图集生成
    assert player_path.exists()  # 确认玩家图生成
    tiles_image = Image.open(tilesheet_path)  # 打开瓦片图集
    player_image = Image.open(player_path)  # 打开玩家精灵
    expected_width = 32 * 8  # 计算图集宽度（8列）
    expected_height = 32 * 2  # 计算图集高度（2行容纳10格）
    assert tiles_image.size == (expected_width, expected_height)  # 校验图集尺寸
    assert player_image.size == (32 * 4, 32)  # 校验玩家精灵尺寸

    map_path = tmp_path / "demo_map.json"  # 计算地图输出路径
    map_script = Path("scripts/gen_demo_map.py")  # 指向地图生成脚本
    result_map = subprocess.run(  # 调用地图脚本
        [
            sys.executable,
            str(map_script),
            "--width",
            "20",
            "--height",
            "15",
            "--seed",
            "99",
            "--tile-size",
            "32",
            "--output",
            str(map_path),
        ],  # 命令参数列表
        check=True,  # 保证成功
        capture_output=True,  # 捕获输出
        text=True,  # 文本模式
    )  # 子进程结束
    assert result_map.returncode == 0  # 断言脚本成功
    assert map_path.exists()  # 确认地图文件生成
    with map_path.open("r", encoding="utf-8") as file:  # 打开地图JSON
        data = json.load(file)  # 解析JSON数据
    assert data["layers"][0]["name"] == "Ground"  # 校验图层名称
    assert data["tilesets"][0]["firstgid"] == 1  # 校验瓦片集起始编号
    assert len(data["layers"][0]["data"]) == data["width"] * data["height"]  # 校验数据长度
