"""测试前端资源优先级配置确保用户素材优先加载。"""  # 模块docstring中文说明
from __future__ import annotations  # 引入未来注解兼容性

import json  # 导入json用于解析结构
import re  # 导入正则表达式提取配置
from pathlib import Path  # 导入Path处理路径


def _extract_priorities(script_path: Path) -> dict[str, object]:  # 定义辅助函数解析JS中的常量
    """从 main.js 中提取 ASSET_PRIORITIES 常量并转为 Python 字典。"""  # 函数docstring中文说明

    content = script_path.read_text(encoding="utf-8")  # 读取文件内容
    match = re.search(r"const ASSET_PRIORITIES = (\{.*?\});", content, re.DOTALL)  # 匹配常量块
    assert match is not None  # 确保找到了配置
    block = match.group(1)  # 提取原始文本
    block_no_comments = re.sub(r"//.*", "", block)  # 去除行内注释
    block_json_ready = re.sub(r"(\w+)\s*:", r'"\1":', block_no_comments)  # 为键补上引号
    data = json.loads(block_json_ready)  # 解析为字典
    return data  # 返回结果


def test_asset_priorities_user_first() -> None:  # 定义测试函数
    """确保优先级列表中用户路径排在首位且导出全局变量。"""  # 函数docstring中文说明

    script_path = Path("frontend/phaser/main.js")  # 计算脚本路径
    data = _extract_priorities(script_path)  # 解析优先级
    assert data["tiles"][0] == "assets/build/tiles/tilesheet.png"  # 用户瓦片路径应排第一
    assert data["tiles"][1] == "assets/generated/tiles/tilesheet.png"  # 回退路径排第二
    assert data["characters"]["player"][0] == "assets/build/characters/player.png"  # 玩家雪碧图优先用户路径
    assert data["characters"]["anim"][0] == "assets/build/characters/player.anim.json"  # 玩家动画配置优先用户路径
    assert data["maps"][0] == "maps/user_map.json"  # 用户地图优先
    assert data["maps"][1] == "maps/demo_map.json"  # 回退地图为演示地图
    content = script_path.read_text(encoding="utf-8")  # 再次读取文件
    assert "window.MINIWORLD_ASSET_PRIORITIES" in content  # 确认常量已导出到全局
