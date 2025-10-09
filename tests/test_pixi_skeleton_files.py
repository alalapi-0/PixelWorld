"""验证 PIXI 前端骨架的关键文件是否存在"""  # 模块说明
from __future__ import annotations  # 启用未来注解

import json  # 导入 JSON 库
import subprocess  # 导入子进程库
from pathlib import Path  # 导入路径库

ROOT = Path(__file__).resolve().parents[1]  # 计算仓库根目录

REQUIRED_FILES = [  # 定义必须存在的文件列表
    ROOT / "frontend/pixi/index.html",  # HTML 入口文件
    ROOT / "frontend/pixi/style.css",  # 样式文件
    ROOT / "frontend/pixi/main.js",  # 主入口脚本
    ROOT / "frontend/pixi/core/app.js",  # 应用核心脚本
    ROOT / "frontend/pixi/core/input.js",  # 输入管理脚本
    ROOT / "frontend/pixi/core/scene.js",  # 场景基类脚本
    ROOT / "frontend/pixi/scenes/scene_boot.js",  # 启动场景脚本
    ROOT / "frontend/pixi/scenes/scene_title.js",  # 标题场景脚本
    ROOT / "frontend/pixi/scenes/scene_map.js",  # 地图场景脚本
    ROOT / "frontend/pixi/render/tilemap.js",  # 瓦片渲染脚本
    ROOT / "frontend/pixi/render/character.js",  # 角色渲染脚本
    ROOT / "frontend/pixi/ui/message_box.js",  # 消息框脚本
    ROOT / "frontend/pixi/maps/demo_map.json",  # 演示地图
    ROOT / "frontend/pixi/config.example.json",  # 配置示例
    ROOT / "scripts/gen_demo_map.py",  # 地图生成脚本
]  # 列表定义结束


def test_required_files_exist() -> None:  # 定义测试函数
    """确认所有关键文件都已经创建"""  # 测试说明
    missing = [str(path) for path in REQUIRED_FILES if not path.exists()]  # 计算缺失文件
    assert not missing, f"缺少文件: {missing}"  # 断言没有缺失


def test_generate_demo_map(tmp_path) -> None:  # 定义地图生成测试
    """确保地图生成脚本可以运行并生成合法 JSON"""  # 测试说明
    output_path = ROOT / "frontend/pixi/maps/demo_map.json"  # 目标路径
    if output_path.exists():  # 如果文件已存在
        output_path.unlink()  # 删除旧文件
    result = subprocess.run(  # 运行脚本
        ["python", str(ROOT / "scripts/gen_demo_map.py"), "--width", "10", "--height", "8", "--seed", "1"],  # 命令参数
        cwd=ROOT,  # 设置工作目录
        capture_output=True,  # 捕获输出
        text=True,  # 使用文本模式
        check=True,  # 失败时抛出异常
    )  # 结束子进程调用
    assert output_path.exists(), "地图文件未生成"  # 确保文件存在
    data = json.loads(output_path.read_text(encoding="utf-8"))  # 读取 JSON 内容
    assert data.get("height") == 8  # 验证高度
    assert data.get("width") == 10  # 验证宽度
    assert data.get("layers"), "地图缺少图层"  # 验证图层存在
    assert "gid" in result.stdout, "脚本输出缺少统计信息"  # 确认输出包含统计
