"""校验用户导入素材是否符合尺寸与命名规则的脚本。"""  # 模块docstring中文说明用途
from __future__ import annotations  # 引入未来注解以提升类型兼容性

import argparse  # 导入argparse解析命令行参数
import sys  # 导入sys以便设定退出码
from pathlib import Path  # 导入Path处理文件路径
from typing import Any, Dict, List  # 导入类型注解辅助

from PIL import Image  # 从Pillow导入Image进行图像校验

from scripts.import_user_assets import (  # 从导入脚本复用函数
    load_manifest,  # 复用manifest加载逻辑
    resolve_tile_bindings,  # 复用地形映射生成逻辑
)  # 导入结束


def parse_args() -> argparse.Namespace:  # 定义参数解析函数
    """解析命令行参数并返回命名空间。"""  # 函数docstring中文说明

    parser = argparse.ArgumentParser(description="校验 assets/user_imports 素材")  # 创建解析器
    parser.add_argument("--root", type=Path, default=Path("."), help="设置仓库根目录，默认当前路径")  # 添加根目录参数
    parser.add_argument("--force", action="store_true", help="忽略错误仅输出警告")  # 添加force选项
    return parser.parse_args()  # 返回解析结果


def verify_tiles(user_dir: Path, tile_config: Dict[str, Any], tile_size: int, force: bool) -> List[str]:  # 定义瓦片校验函数
    """验证瓦片资源是否满足尺寸与文件要求。"""  # 函数docstring中文说明

    tiles_dir = user_dir / "tiles"  # 计算瓦片目录
    mode = tile_config.get("mode", "auto")  # 读取模式
    atlas_name = tile_config.get("atlas", "tilesheet.png")  # 获取图集文件名
    loose_glob = tile_config.get("loose_glob", "*.png")  # 获取散瓦片匹配规则
    chosen_mode = mode  # 初始化模式
    messages: List[str] = []  # 准备消息列表
    if mode == "auto":  # 自动模式判断
        if (tiles_dir / atlas_name).exists():  # 若存在图集文件
            chosen_mode = "atlas"  # 选择图集模式
        else:  # 否则
            chosen_mode = "loose"  # 选择散瓦片模式
    if chosen_mode == "atlas":  # 校验图集模式
        atlas_path = tiles_dir / atlas_name  # 计算图集路径
        if not atlas_path.exists():  # 若缺少图集
            message = f"缺少图集文件 {atlas_path}"  # 构造消息
            messages.append(message)  # 记录错误
            if not force:  # 若非强制模式
                raise FileNotFoundError(message)  # 抛出异常
        else:  # 若文件存在
            with Image.open(atlas_path) as image:  # 打开图像
                width, height = image.size  # 读取尺寸
            if width % tile_size != 0 or height % tile_size != 0:  # 检查整除性
                message = f"图集尺寸 {width}x{height} 无法被 tile_size {tile_size} 整除"  # 构造错误描述
                messages.append(message)  # 追加消息
                if not force:  # 若非强制
                    raise ValueError(message)  # 抛出异常
            else:  # 尺寸符合
                messages.append(f"图集模式通过，共 {width // tile_size * height // tile_size} 格")  # 添加成功信息
    else:  # 散瓦片模式校验
        loose_paths = sorted(tiles_dir.glob(loose_glob))  # 按字典序列出瓦片
        if not loose_paths:  # 若无文件
            message = f"散瓦片模式下未找到匹配 {loose_glob} 的文件"  # 构造消息
            messages.append(message)  # 记录
            if not force:  # 非强制时
                raise FileNotFoundError(message)  # 抛出异常
        valid_count = 0  # 初始化计数
        for path in loose_paths:  # 遍历文件
            with Image.open(path) as image:  # 打开图像
                if image.size != (tile_size, tile_size):  # 检查尺寸
                    message = f"散瓦片 {path.name} 尺寸 {image.size} 与 {tile_size}px 不符"  # 构造消息
                    messages.append(message)  # 记录
                    if not force:  # 非强制模式
                        raise ValueError(message)  # 抛出异常
                else:  # 尺寸正确
                    valid_count += 1  # 增加计数
        messages.append(f"散瓦片模式通过，共 {valid_count} 张瓦片")  # 追加统计信息
    bindings = resolve_tile_bindings(tile_config.get("bindings", {}))  # 计算绑定以确保存在顺序
    messages.append(f"地形绑定数量: {len(bindings)}")  # 输出绑定数量
    return messages  # 返回消息列表


def verify_player(user_dir: Path, character_config: Dict[str, Any], force: bool) -> List[str]:  # 定义角色校验函数
    """验证玩家雪碧图的尺寸信息。"""  # 函数docstring中文说明

    messages: List[str] = []  # 初始化消息列表
    player_config = character_config.get("player", {})  # 读取玩家配置
    file_name = player_config.get("file", "player.png")  # 获取文件名
    frame_width = player_config.get("frame_width", 32)  # 获取帧宽
    frame_height = player_config.get("frame_height", 32)  # 获取帧高
    frames = player_config.get("frames", 4)  # 获取帧数
    sprite_path = user_dir / "characters" / file_name  # 构造文件路径
    if not sprite_path.exists():  # 若文件不存在
        message = f"缺少玩家雪碧图 {sprite_path}"  # 构造错误信息
        messages.append(message)  # 记录错误
        if not force:  # 非强制模式
            raise FileNotFoundError(message)  # 抛出异常
        return messages  # 返回消息
    with Image.open(sprite_path) as image:  # 打开图片
        width, height = image.size  # 读取尺寸
    expected_width = frame_width * frames  # 计算期望宽度
    if width != expected_width or height != frame_height:  # 校验尺寸
        message = f"玩家雪碧图尺寸 {width}x{height} 不等于 {frames} 帧 {frame_width}x{frame_height}"  # 构造错误描述
        messages.append(message)  # 记录
        if not force:  # 非强制
            raise ValueError(message)  # 抛出异常
    else:  # 尺寸正确
        messages.append(f"玩家雪碧图通过，帧数 {frames}，尺寸 {frame_width}x{frame_height}")  # 输出成功信息
    fps = player_config.get("fps", 8)  # 读取帧率
    messages.append(f"玩家动画帧率: {fps} fps")  # 输出帧率信息
    return messages  # 返回消息列表


def verify_maps(user_dir: Path, map_config: Dict[str, Any], force: bool) -> List[str]:  # 定义地图校验函数
    """验证地图文件是否存在。"""  # 函数docstring中文说明

    messages: List[str] = []  # 初始化消息列表
    use_user_map = map_config.get("use_user_map", False)  # 读取启用标志
    map_file = map_config.get("file")  # 读取文件名
    if not use_user_map or not map_file:  # 若未启用
        messages.append("未启用用户地图，沿用默认地图")  # 输出信息
        return messages  # 返回消息列表
    map_path = user_dir / "maps" / map_file  # 计算地图路径
    if not map_path.exists():  # 若文件缺失
        message = f"启用用户地图但找不到 {map_path}"  # 构造错误描述
        messages.append(message)  # 记录
        if not force:  # 非强制
            raise FileNotFoundError(message)  # 抛出异常
    else:  # 文件存在
        messages.append(f"用户地图已找到: {map_path.name}")  # 输出成功信息
    return messages  # 返回消息列表


def main() -> None:  # 定义主函数
    """执行校验并打印总结。"""  # 函数docstring中文说明

    args = parse_args()  # 解析参数
    root = args.root.resolve()  # 解析根目录
    user_dir = root / "assets" / "user_imports"  # 计算用户素材目录
    manifest_path = user_dir / "user_manifest.json"  # 计算manifest路径
    manifest = load_manifest(manifest_path)  # 加载配置
    tile_size = manifest.get("tile_size", 32)  # 读取瓦片尺寸
    print(f"开始校验，瓦片尺寸设定为 {tile_size} 像素")  # 打印标题
    messages: List[str] = []  # 初始化汇总消息
    try:  # 捕获潜在异常
        messages.extend(verify_tiles(user_dir, manifest.get("tiles", {}), tile_size, args.force))  # 校验瓦片
        messages.extend(verify_player(user_dir, manifest.get("characters", {}), args.force))  # 校验玩家
        messages.extend(verify_maps(user_dir, manifest.get("maps", {}), args.force))  # 校验地图
    except Exception as error:  # 捕获异常
        print(f"校验失败: {error}")  # 输出错误
        if not args.force:  # 若未启用强制模式
            sys.exit(1)  # 使用失败退出码
    for line in messages:  # 遍历所有消息
        print(f"- {line}")  # 逐条输出
    print("校验完成。")  # 输出结束语


if __name__ == "__main__":  # 判断脚本入口
    main()  # 调用主函数
