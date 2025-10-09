"""导入用户素材到标准构建目录并生成所需配置的脚本。"""  # 模块docstring中文描述用途
from __future__ import annotations  # 引入未来注解语法以提升类型标注兼容性

import argparse  # 导入argparse用于解析命令行参数
import json  # 导入json模块以读写配置文件
import math  # 导入math模块以进行打包排布计算
import shutil  # 导入shutil模块用于复制文件
import sys  # 导入sys模块用于退出时设定状态码
from dataclasses import dataclass  # 导入dataclass用于结构化配置
from pathlib import Path  # 导入Path处理路径操作
from typing import Any, Dict, List, Optional, Tuple  # 导入类型别名便于注解

from PIL import Image  # 从Pillow导入Image处理图像


@dataclass
class TileImportResult:  # 定义瓦片导入结果的数据类
    """封装瓦片图集路径与绑定映射等信息。"""  # 数据类docstring中文说明

    tilesheet_path: Optional[Path]  # 记录生成或复制的图集路径
    bindings: Dict[str, int]  # 记录地形名称到索引的映射
    tile_size: int  # 记录瓦片尺寸


@dataclass
class CharacterImportResult:  # 定义角色导入结果数据类
    """封装角色雪碧图路径与动画参数。"""  # 数据类docstring中文说明

    image_path: Optional[Path]  # 记录玩家雪碧图路径
    anim_config: Dict[str, Any]  # 记录动画配置内容


DEFAULT_TILE_NAMES: Tuple[str, ...] = (  # 定义默认地形名称顺序
    "GRASS",  # 草地
    "ROAD",  # 道路
    "TILE_FLOOR",  # 瓷砖地板
    "WATER",  # 水面
    "LAKE",  # 湖泊
    "WALL",  # 墙体
    "TREE",  # 树木
    "HOUSE",  # 房屋
    "ROCK",  # 岩石
    "LAVA",  # 岩浆
)  # 元组结束


def parse_args() -> argparse.Namespace:  # 定义解析命令行参数的函数
    """解析命令行参数并返回命名空间。"""  # 函数docstring中文说明

    parser = argparse.ArgumentParser(description="导入用户素材并生成标准构建资源")  # 创建参数解析器并添加描述
    parser.add_argument("--root", type=Path, default=Path("."), help="设置仓库根目录，默认当前路径")  # 添加根目录参数
    parser.add_argument("--tile-size", type=int, default=None, help="覆盖瓦片尺寸设置")  # 添加瓦片尺寸覆盖参数
    parser.add_argument("--frames", type=int, default=None, help="覆盖玩家帧数配置")  # 添加帧数覆盖参数
    parser.add_argument("--fps", type=int, default=None, help="覆盖玩家动画帧率")  # 添加帧率覆盖参数
    parser.add_argument("--use-user-map", action="store_true", help="强制启用用户地图")  # 添加强制用户地图开关
    parser.add_argument("--force", action="store_true", help="忽略尺寸等校验错误继续执行")  # 添加跳过严格校验的选项
    return parser.parse_args()  # 返回解析结果


def load_manifest(manifest_path: Path) -> Dict[str, Any]:  # 定义加载用户清单的函数
    """读取 manifest JSON 文件，若不存在则返回默认配置。"""  # 函数docstring中文说明

    if manifest_path.exists():  # 判断文件是否存在
        with manifest_path.open("r", encoding="utf-8") as file:  # 打开文件读取内容
            return json.load(file)  # 返回解析后的字典
    # 如果没有 manifest 则提供默认配置
    return {  # 返回默认配置字典
        "tile_size": 32,  # 默认瓦片尺寸
        "tiles": {  # 默认瓦片部分配置
            "mode": "auto",  # 自动模式
            "atlas": "tilesheet.png",  # 默认图集文件名
            "loose_glob": "*.png",  # 默认散瓦片匹配模式
            "bindings": {},  # 默认绑定为空待后续填充
        },  # 瓦片配置结束
        "characters": {  # 默认角色配置
            "player": {  # 玩家配置块
                "mode": "atlas",  # 默认使用雪碧图模式
                "file": "player.png",  # 默认雪碧图文件名
                "frame_width": 32,  # 默认帧宽
                "frame_height": 32,  # 默认帧高
                "frames": 4,  # 默认帧数
                "fps": 8,  # 默认帧率
            },  # 玩家配置结束
        },  # 角色配置结束
        "maps": {  # 默认地图配置
            "use_user_map": False,  # 默认不启用用户地图
            "file": "demo_map.json",  # 默认地图文件名
        },  # 地图配置结束
    }  # 默认配置返回


def ensure_directory(path: Path) -> None:  # 定义确保目录存在的辅助函数
    """创建目标目录及其父目录。"""  # 函数docstring中文说明

    path.mkdir(parents=True, exist_ok=True)  # 调用mkdir确保目录存在


def validate_tilesheet(image: Image.Image, tile_size: int, force: bool) -> None:  # 定义验证图集尺寸的函数
    """校验瓦片图集尺寸能被 tile_size 整除。"""  # 函数docstring中文说明

    width, height = image.size  # 读取图像宽高
    if width % tile_size != 0 or height % tile_size != 0:  # 判断宽高是否整除
        message = f"瓦片图集尺寸 {width}x{height} 无法被 {tile_size} 整除"  # 构建错误信息
        if force:  # 若启用强制模式
            print(f"警告: {message}")  # 打印警告继续执行
        else:  # 否则视为错误
            raise ValueError(message)  # 抛出异常终止


def copy_tilesheet(source: Path, destination: Path, tile_size: int, force: bool) -> Path:  # 定义复制图集的函数
    """复制现有图集到构建目录并校验尺寸。"""  # 函数docstring中文说明

    if not source.exists():  # 检查源文件是否存在
        raise FileNotFoundError(f"找不到图集文件: {source}")  # 抛出异常提示缺失
    with Image.open(source) as image:  # 打开图像
        validate_tilesheet(image, tile_size, force)  # 校验尺寸是否符合要求
    ensure_directory(destination.parent)  # 确保输出目录存在
    shutil.copy2(source, destination)  # 复制文件保持元数据
    return destination  # 返回目标路径


def pack_loose_tiles(paths: List[Path], destination: Path, tile_size: int, force: bool) -> Path:  # 定义打包散瓦片的函数
    """将多个散瓦片按字典序拼合为单张图集。"""  # 函数docstring中文说明

    if not paths:  # 若列表为空
        raise ValueError("未在 tiles 目录找到任何 PNG 文件用于打包")  # 抛出异常提醒
    sorted_paths = sorted(paths, key=lambda item: item.name)  # 按文件名排序
    columns = math.ceil(math.sqrt(len(sorted_paths)))  # 计算列数
    rows = math.ceil(len(sorted_paths) / columns)  # 计算行数
    sheet = Image.new("RGBA", (columns * tile_size, rows * tile_size), (0, 0, 0, 0))  # 创建空白图集
    for index, tile_path in enumerate(sorted_paths):  # 遍历每个瓦片
        with Image.open(tile_path) as tile_image:  # 打开当前瓦片
            if tile_image.size != (tile_size, tile_size):  # 检查尺寸
                message = f"散瓦片 {tile_path.name} 尺寸 {tile_image.size} 与 tile_size 不符"  # 构造错误信息
                if force:  # 如果启用强制模式
                    print(f"警告: {message}，将按最近邻缩放")  # 打印警告
                    tile_image = tile_image.resize((tile_size, tile_size), Image.NEAREST)  # 对瓦片缩放
                else:  # 否则终止
                    raise ValueError(message)  # 抛出异常
            sheet.paste(tile_image, ((index % columns) * tile_size, (index // columns) * tile_size))  # 粘贴瓦片到目标位置
    ensure_directory(destination.parent)  # 确保输出目录存在
    sheet.save(destination, format="PNG")  # 保存拼合后的图集
    return destination  # 返回生成路径


def resolve_tile_bindings(manifest_bindings: Dict[str, int]) -> Dict[str, int]:  # 定义生成地形绑定的函数
    """根据 manifest 或默认顺序生成地形索引映射。"""  # 函数docstring中文说明

    if manifest_bindings:  # 若用户提供绑定
        sorted_items = sorted(manifest_bindings.items(), key=lambda item: item[1])  # 按索引排序确保稳定
        return {name: index for name, index in sorted_items}  # 返回排序后的映射
    # 否则按默认顺序分配递增索引
    return {name: idx for idx, name in enumerate(DEFAULT_TILE_NAMES)}  # 构建默认映射


def import_tiles(user_dir: Path, build_dir: Path, tile_config: Dict[str, Any], tile_size: int, force: bool) -> TileImportResult:  # 定义主瓦片导入函数
    """导入瓦片素材并返回生成的信息。"""  # 函数docstring中文说明

    tiles_dir = user_dir / "tiles"  # 计算用户瓦片目录
    mode = tile_config.get("mode", "auto")  # 获取模式
    atlas_name = tile_config.get("atlas", "tilesheet.png")  # 获取图集名称
    loose_glob = tile_config.get("loose_glob", "*.png")  # 获取散瓦片模式
    chosen_mode = mode  # 初始化最终模式
    if mode == "auto":  # 若为自动模式
        if (tiles_dir / atlas_name).exists():  # 如果发现图集文件
            chosen_mode = "atlas"  # 选择图集模式
        else:  # 否则
            chosen_mode = "loose"  # 选择散瓦片模式
    build_tilesheet = build_dir / "tiles" / "tilesheet.png"  # 计算输出图集路径
    tilesheet_path: Optional[Path] = None  # 初始化返回路径
    if chosen_mode == "atlas":  # 处理图集模式
        source = tiles_dir / atlas_name  # 计算源路径
        tilesheet_path = copy_tilesheet(source, build_tilesheet, tile_size, force)  # 复制并校验图集
    elif chosen_mode == "loose":  # 处理散瓦片模式
        loose_paths = list(tiles_dir.glob(loose_glob))  # 收集所有匹配的PNG
        tilesheet_path = pack_loose_tiles(loose_paths, build_tilesheet, tile_size, force)  # 打包为图集
    else:  # 其他模式暂不支持
        raise ValueError(f"未知的瓦片导入模式: {mode}")  # 抛出异常
    bindings = resolve_tile_bindings(tile_config.get("bindings", {}))  # 生成绑定映射
    print("瓦片导入完成，索引映射如下：")  # 打印提示
    for name, index in bindings.items():  # 遍历绑定映射
        print(f"  {name} -> {index}")  # 输出每项绑定
    return TileImportResult(tilesheet_path=tilesheet_path, bindings=bindings, tile_size=tile_size)  # 返回结果对象


def copy_player_sprite(source: Path, destination: Path, frame_width: int, frame_height: int, frames: int, force: bool) -> None:  # 定义复制玩家雪碧图的函数
    """复制玩家雪碧图并校验尺寸与帧数。"""  # 函数docstring中文说明

    if not source.exists():  # 检查文件存在
        raise FileNotFoundError(f"找不到玩家雪碧图: {source}")  # 抛出异常
    with Image.open(source) as image:  # 打开图像
        width, height = image.size  # 获取尺寸
        expected_width = frame_width * frames  # 计算期望宽度
        if height != frame_height or width != expected_width:  # 校验尺寸是否匹配
            message = f"玩家雪碧图尺寸 {width}x{height} 不符合 {frames} 帧 {frame_width}x{frame_height}"  # 构造错误信息
            if force:  # 若启用强制模式
                print(f"警告: {message}")  # 打印警告
            else:  # 否则终止
                raise ValueError(message)  # 抛出异常
    ensure_directory(destination.parent)  # 确保目标目录存在
    shutil.copy2(source, destination)  # 执行复制


def import_characters(user_dir: Path, build_dir: Path, character_config: Dict[str, Any], overrides: Dict[str, Optional[int]], force: bool) -> CharacterImportResult:  # 定义角色导入主函数
    """导入玩家角色雪碧图并生成动画配置。"""  # 函数docstring中文说明

    player_config = character_config.get("player", {})  # 取得玩家配置字典
    mode = player_config.get("mode", "atlas")  # 获取模式
    if mode != "atlas":  # 暂时仅支持atlas
        raise ValueError("当前仅支持玩家雪碧图的 atlas 模式")  # 抛出异常说明
    file_name = player_config.get("file", "player.png")  # 获取文件名
    frame_width = overrides.get("frame_width") or player_config.get("frame_width", 32)  # 确定帧宽
    frame_height = overrides.get("frame_height") or player_config.get("frame_height", 32)  # 确定帧高
    frames = overrides.get("frames") or player_config.get("frames", 4)  # 确定帧数
    fps = overrides.get("fps") or player_config.get("fps", 8)  # 确定帧率
    source = user_dir / "characters" / file_name  # 计算源文件路径
    destination = build_dir / "characters" / "player.png"  # 计算目标路径
    copy_player_sprite(source, destination, frame_width, frame_height, frames, force)  # 执行复制与校验
    anim_config = {  # 构造动画配置字典
        "frame_width": frame_width,  # 帧宽
        "frame_height": frame_height,  # 帧高
        "frames": frames,  # 帧数量
        "fps": fps,  # 帧率
    }  # 字典结束
    anim_path = build_dir / "characters" / "player.anim.json"  # 计算动画配置输出路径
    with anim_path.open("w", encoding="utf-8") as file:  # 打开文件写入
        json.dump(anim_config, file, ensure_ascii=False, indent=2)  # 写入格式化JSON
    return CharacterImportResult(image_path=destination, anim_config=anim_config)  # 返回结果对象


def update_tileset_binding(mapping_path: Path, result: TileImportResult) -> None:  # 定义更新绑定文件的函数
    """根据瓦片导入结果更新 tileset_binding.json。"""  # 函数docstring中文说明

    ensure_directory(mapping_path.parent)  # 确保目录存在
    bindings_with_comments: Dict[str, Any] = {  # 构造带注释的映射
        "_comment": "由 import_user_assets.py 自动生成，请勿手动编辑。",  # 顶部注释
        "tile_size": result.tile_size,  # 写入瓦片尺寸
        "bindings": {},  # 初始化绑定字典
    }  # 字典结束
    for name, index in result.bindings.items():  # 遍历绑定数据
        bindings_with_comments["bindings"][f"_comment_{name}"] = f"{name} 的索引"  # 写入注释键
        bindings_with_comments["bindings"][name] = index  # 写入实际映射
    with mapping_path.open("w", encoding="utf-8") as file:  # 打开文件写入
        json.dump(bindings_with_comments, file, ensure_ascii=False, indent=2)  # 输出格式化JSON


def copy_user_map(user_dir: Path, frontend_maps_dir: Path, map_config: Dict[str, Any], force_flag: bool) -> Optional[Path]:  # 定义复制用户地图的函数
    """根据配置决定是否复制用户地图文件。"""  # 函数docstring中文说明

    use_user_map = map_config.get("use_user_map", False)  # 读取是否启用用户地图
    map_file = map_config.get("file")  # 读取地图文件名
    if not use_user_map or not map_file:  # 若未启用或未指定文件
        return None  # 不处理并返回空
    source = user_dir / "maps" / map_file  # 计算源文件路径
    if not source.exists():  # 若文件不存在
        message = f"启用用户地图但找不到文件: {source}"  # 构造错误信息
        if force_flag:  # 若启用强制模式
            print(f"警告: {message}")  # 打印警告继续执行
            return None  # 返回空
        raise FileNotFoundError(message)  # 抛出异常
    destination = frontend_maps_dir / "user_map.json"  # 设定目标文件名
    ensure_directory(destination.parent)  # 确保目标目录存在
    shutil.copy2(source, destination)  # 执行复制
    return destination  # 返回目标路径


def write_asset_manifest(build_dir: Path, tiles: TileImportResult, characters: CharacterImportResult, user_map_path: Optional[Path]) -> None:  # 定义写入资产清单的函数
    """生成 asset_manifest.json 描述构建产物的可用性。"""  # 函数docstring中文说明

    manifest = {  # 构造清单字典
        "tiles": {  # 瓦片部分
            "path": str(tiles.tilesheet_path) if tiles.tilesheet_path else None,  # 记录图集路径字符串
            "bindings": tiles.bindings,  # 记录绑定
            "tile_size": tiles.tile_size,  # 记录瓦片尺寸
        },  # 瓦片部分结束
        "characters": {  # 角色部分
            "player": {  # 玩家配置
                "image": str(characters.image_path) if characters.image_path else None,  # 记录雪碧图路径
                "anim": characters.anim_config,  # 记录动画配置
            }  # 玩家配置结束
        },  # 角色部分结束
        "maps": {  # 地图部分
            "user_map": str(user_map_path) if user_map_path else None,  # 记录用户地图路径
        },  # 地图部分结束
    }  # 字典结束
    manifest_path = build_dir / "asset_manifest.json"  # 计算清单输出路径
    ensure_directory(manifest_path.parent)  # 确保目录存在
    with manifest_path.open("w", encoding="utf-8") as file:  # 打开文件写入
        json.dump(manifest, file, ensure_ascii=False, indent=2)  # 写入格式化JSON


def main() -> None:  # 定义主函数
    """执行导入流程并处理异常。"""  # 函数docstring中文说明

    args = parse_args()  # 解析命令行参数
    root = args.root.resolve()  # 解析仓库根目录绝对路径
    user_dir = root / "assets" / "user_imports"  # 计算用户素材目录
    build_dir = root / "assets" / "build"  # 计算构建目录
    mapping_path = root / "assets" / "mapping" / "tileset_binding.json"  # 计算绑定文件路径
    frontend_maps_dir = root / "frontend" / "phaser" / "maps"  # 计算前端地图目录
    manifest_path = user_dir / "user_manifest.json"  # 计算用户manifest路径
    manifest = load_manifest(manifest_path)  # 加载manifest或默认值
    tile_size = args.tile_size or manifest.get("tile_size", 32)  # 根据参数或配置确定瓦片尺寸
    try:  # 捕获导入过程中的异常
        tiles_result = import_tiles(user_dir, build_dir, manifest.get("tiles", {}), tile_size, args.force)  # 导入瓦片
        character_overrides = {  # 构造角色覆盖参数
            "frame_width": manifest.get("characters", {}).get("player", {}).get("frame_width"),  # 默认帧宽
            "frame_height": manifest.get("characters", {}).get("player", {}).get("frame_height"),  # 默认帧高
            "frames": args.frames or manifest.get("characters", {}).get("player", {}).get("frames"),  # 帧数
            "fps": args.fps or manifest.get("characters", {}).get("player", {}).get("fps"),  # 帧率
        }  # 覆盖字典结束
        characters_result = import_characters(  # 调用角色导入函数
            user_dir,
            build_dir,
            manifest.get("characters", {}),
            character_overrides,
            args.force,
        )  # 函数调用结束
        map_config = manifest.get("maps", {}).copy()  # 获取地图配置副本
        if args.use_user_map:  # 如果命令行指定启用用户地图
            map_config["use_user_map"] = True  # 强制开启
        user_map_path = copy_user_map(user_dir, frontend_maps_dir, map_config, args.force)  # 处理地图复制
        update_tileset_binding(mapping_path, tiles_result)  # 更新绑定文件
        write_asset_manifest(build_dir, tiles_result, characters_result, user_map_path)  # 写入构建清单
        print("导入完成，相关配置已更新。")  # 打印成功信息
    except Exception as error:  # 捕获所有异常
        print(f"导入失败: {error}")  # 打印错误信息
        if not args.force:  # 若未开启强制模式
            sys.exit(1)  # 设置非零退出码


if __name__ == "__main__":  # 判断是否作为脚本运行
    main()  # 调用主函数
