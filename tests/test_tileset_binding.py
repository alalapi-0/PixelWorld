"""校验瓦片绑定JSON结构与索引完整性。"""  # 模块docstring中文说明
from __future__ import annotations  # 引入未来注解特性

import json  # 导入JSON模块读取映射文件
from pathlib import Path  # 导入Path处理文件路径


def test_tileset_binding_structure() -> None:  # 定义测试函数
    """检查地形映射JSON包含全部地形名称与整数索引。"""  # 函数docstring中文说明
    binding_path = Path("assets/mapping/tileset_binding.json")  # 定位映射文件路径
    with binding_path.open("r", encoding="utf-8") as file:  # 打开文件
        data = json.load(file)  # 解析JSON
    assert data["tile_size"] == 32  # 确认瓦片尺寸为32
    expected_names = [  # 定义期望的地形列表
        "GRASS",
        "ROAD",
        "TILE_FLOOR",
        "WATER",
        "LAKE",
        "WALL",
        "TREE",
        "HOUSE",
        "ROCK",
        "LAVA",
    ]  # 列表结束
    bindings = data["bindings"]  # 提取绑定字典
    for name in expected_names:  # 遍历地形名称
        assert name in bindings  # 检查名称存在
        assert isinstance(bindings[name], int)  # 确认索引为整数
    indices = [bindings[name] for name in expected_names]  # 收集索引顺序
    assert indices == list(range(len(expected_names)))  # 确认索引从0递增
