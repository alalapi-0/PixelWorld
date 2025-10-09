"""测试：确保Phaser前端所需的关键文件存在且结构合理。"""  # 模块文档说明
from pathlib import Path  # 导入Path用于路径操作


def test_frontend_artifacts_exist() -> None:  # 定义测试函数
    """检查前端目录与资产映射文件是否存在。"""  # 函数说明
    project_root = Path(__file__).resolve().parents[1]  # 计算项目根路径
    frontend_dir = project_root / "frontend" / "phaser"  # 定义前端目录
    assert (frontend_dir / "index.html").exists(), "缺少 index.html"  # 断言HTML存在
    assert (frontend_dir / "main.js").exists(), "缺少 main.js"  # 断言主脚本存在
    assert (frontend_dir / "style.css").exists(), "缺少 style.css"  # 断言样式存在
    assert (frontend_dir / "maps" / "demo_map.json").exists(), "缺少示例地图"  # 断言示例地图存在

    assets_dir = project_root / "assets"  # 定义资产目录
    assert (assets_dir / "external_catalog.json").exists(), "缺少外部素材目录"  # 断言素材目录存在
    assert (assets_dir / "mapping" / "tileset_binding.json").exists(), "缺少瓦片映射"  # 断言瓦片映射存在
    assert (assets_dir / "mapping" / "personas_binding.json").exists(), "缺少角色映射"  # 断言角色映射存在

    licenses_path = assets_dir / "licenses" / "ASSETS_LICENSES.md"  # 定义许可证路径
    assert licenses_path.exists(), "缺少资产许可证清单"  # 确保许可证文件存在
