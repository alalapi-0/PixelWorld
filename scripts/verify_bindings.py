"""脚本：校验素材映射JSON结构与实际文件存在性。"""  # 中文docstring说明
from __future__ import annotations  # 启用未来注解规范

import json  # 导入JSON库解析映射文件
import sys  # 导入sys以设置退出码
from pathlib import Path  # 导入Path方便路径处理
from typing import Dict, Any, List  # 导入类型提示


def load_json(path: Path) -> Dict[str, Any]:  # 定义通用JSON加载函数
    """读取并解析指定路径的JSON文件。"""  # 函数说明
    with path.open("r", encoding="utf-8") as file:  # 打开文件
        return json.load(file)  # 解析并返回数据


def validate_tileset(data: Dict[str, Any], project_root: Path) -> List[str]:  # 校验瓦片映射
    """检查瓦片映射结构与图集文件存在性。"""  # 函数说明
    errors: List[str] = []  # 初始化错误列表
    tile_size = data.get("tile_size")  # 读取瓦片尺寸
    if not isinstance(tile_size, int) or tile_size <= 0:  # 校验瓦片尺寸
        errors.append("tile_size 必须为正整数。")  # 记录错误
    bindings = data.get("bindings")  # 读取绑定字典
    if not isinstance(bindings, dict):  # 校验绑定结构
        errors.append("bindings 必须为对象。")  # 记录错误
        return errors  # 返回错误
    for tile_name, info in bindings.items():  # 遍历绑定项
        if not isinstance(info, dict):  # 校验信息结构
            errors.append(f"{tile_name} 的绑定必须为对象。")  # 记录错误
            continue  # 跳过后续处理
        atlas_path = info.get("atlas")  # 读取图集路径
        tile_id = info.get("id")  # 读取瓦片索引
        if not isinstance(atlas_path, str):  # 校验路径类型
            errors.append(f"{tile_name} 的 atlas 必须为字符串。")  # 记录错误
        else:  # 路径类型正确
            resolved = project_root / atlas_path  # 计算实际路径
            if not resolved.exists():  # 若文件不存在
                errors.append(f"未找到图集文件：{resolved}")  # 记录错误
        if not isinstance(tile_id, int):  # 校验索引类型
            errors.append(f"{tile_name} 的 id 必须为整数。")  # 记录错误
    return errors  # 返回错误列表


def validate_personas(data: Dict[str, Any], project_root: Path) -> List[str]:  # 校验角色映射
    """检查角色映射结构与精灵文件存在性。"""  # 函数说明
    errors: List[str] = []  # 初始化错误列表
    for persona, info in data.items():  # 遍历角色条目
        if persona.startswith("_"):  # 跳过注释字段
            continue  # 继续下一个
        if not isinstance(info, dict):  # 校验信息结构
            errors.append(f"{persona} 的配置必须为对象。")  # 记录错误
            continue  # 跳过后续
        sprite_path = info.get("sprite")  # 获取精灵路径
        if sprite_path is None:  # 若缺少精灵路径
            errors.append(f"{persona} 缺少 sprite 字段。")  # 记录错误
            continue  # 跳过后续
        if not isinstance(sprite_path, str):  # 校验路径类型
            errors.append(f"{persona} 的 sprite 必须为字符串。")  # 记录错误
            continue  # 跳过后续
        resolved = project_root / sprite_path  # 解析实际路径
        if not resolved.exists():  # 若文件不存在
            errors.append(f"未找到角色精灵：{resolved}")  # 记录错误
    return errors  # 返回错误列表


def main() -> None:  # 主入口
    """读取映射文件并输出校验结果。"""  # 函数说明
    project_root = Path(".").resolve()  # 获取项目根路径
    mapping_dir = project_root / "assets" / "mapping"  # 计算映射目录
    tileset_path = mapping_dir / "tileset_binding.json"  # 瓦片映射路径
    personas_path = mapping_dir / "personas_binding.json"  # 角色映射路径
    if not tileset_path.exists():  # 检查瓦片映射是否存在
        print("缺少 tileset_binding.json 文件。")  # 输出错误
        sys.exit(1)  # 异常退出
    if not personas_path.exists():  # 检查角色映射是否存在
        print("缺少 personas_binding.json 文件。")  # 输出错误
        sys.exit(1)  # 异常退出

    tileset_data = load_json(tileset_path)  # 加载瓦片映射
    persona_data = load_json(personas_path)  # 加载角色映射

    errors = []  # 初始化总错误列表
    errors.extend(validate_tileset(tileset_data, project_root))  # 收集瓦片错误
    errors.extend(validate_personas(persona_data, project_root))  # 收集角色错误

    if errors:  # 若存在错误
        print("发现以下问题：")  # 输出提示
        for issue in errors:  # 遍历错误
            print(f"- {issue}")  # 输出每条错误
        sys.exit(1)  # 以失败退出

    print("映射文件校验通过。")  # 输出成功信息


if __name__ == "__main__":  # 入口判断
    main()  # 执行主函数
