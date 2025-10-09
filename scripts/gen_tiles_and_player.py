"""使用 Pillow 生成基础瓦片图集与玩家占位动画的脚本。"""  # 模块docstring中文说明用途
from __future__ import annotations  # 引入未来注解以兼容前向引用类型

import argparse  # 导入参数解析模块处理命令行输入
import math  # 导入数学库用于计算网格布局
import os  # 导入操作系统库以处理符号链接兼容性
import shutil  # 导入文件操作库以复制资源
from dataclasses import dataclass  # 导入数据类装饰器表达瓦片配置
from pathlib import Path  # 导入Path类方便处理路径
from typing import Callable, Iterable, Tuple  # 导入类型用于函数签名说明

from PIL import Image, ImageDraw  # 从Pillow导入图像与绘图工具


def paint_grass(draw: ImageDraw.ImageDraw, size: int) -> None:  # 定义草地纹理绘制函数
    """绘制草地瓦片的深浅绿色杂点纹理。"""  # 函数docstring中文描述
    draw.rectangle((0, 0, size, size), fill="#2f8f2f")  # 用深绿色填充背景
    for offset in range(0, size, 4):  # 每隔4像素绘制浅色草纹
        draw.line((offset, size, offset + 4, size - 6), fill="#3fbf3f", width=1)  # 绘制倾斜细线模拟草叶
        draw.line((0, offset, 6, offset + 4), fill="#3fbf3f", width=1)  # 绘制横向草叶增加质感


def paint_road(draw: ImageDraw.ImageDraw, size: int) -> None:  # 定义道路纹理绘制函数
    """绘制棕色碎石道路瓦片。"""  # 函数用途说明
    draw.rectangle((0, 0, size, size), fill="#8d6e63")  # 用棕色填充背景
    for y in range(4, size, 8):  # 按行绘制浅色碎石
        for x in range(4, size, 8):  # 按列绘制浅色碎石
            draw.ellipse((x - 1, y - 1, x + 1, y + 1), fill="#bcaaa4")  # 使用椭圆点缀碎石


def paint_tile_floor(draw: ImageDraw.ImageDraw, size: int) -> None:  # 定义瓷砖地板绘制函数
    """绘制浅灰色十字分割的地砖。"""  # 函数说明
    draw.rectangle((0, 0, size, size), fill="#e0e0e0")  # 填充浅灰底色
    draw.line((0, size // 2, size, size // 2), fill="#bdbdbd", width=2)  # 绘制横向分隔线
    draw.line((size // 2, 0, size // 2, size), fill="#bdbdbd", width=2)  # 绘制纵向分隔线
    draw.rectangle((1, 1, size - 1, size - 1), outline="#9e9e9e", width=1)  # 边缘描边突出边框


def paint_water(draw: ImageDraw.ImageDraw, size: int) -> None:  # 定义水面纹理绘制函数
    """绘制浅蓝与亮点组成的水面瓦片。"""  # 函数描述
    draw.rectangle((0, 0, size, size), fill="#1e88e5")  # 填充深蓝背景
    for x in range(0, size, 6):  # 按列绘制波纹
        draw.arc((x - 6, size // 2 - 6, x + 6, size // 2 + 6), 30, 150, fill="#64b5f6", width=2)  # 绘制弧线模拟波浪
    draw.ellipse((size // 3, size // 3, size // 3 + 4, size // 3 + 4), fill="#bbdefb")  # 添加高光点增强质感


def paint_lake(draw: ImageDraw.ImageDraw, size: int) -> None:  # 定义湖泊纹理绘制函数
    """绘制深蓝底与亮蓝边缘的湖泊瓦片。"""  # 函数说明
    draw.rectangle((0, 0, size, size), fill="#0d47a1")  # 使用更深蓝色填充背景
    draw.ellipse((2, 2, size - 2, size - 2), outline="#42a5f5", width=2)  # 用亮蓝描边形成湖岸
    draw.ellipse((size // 2 - 3, size // 2 - 3, size // 2 + 3, size // 2 + 3), fill="#1976d2")  # 中心加深形成深水感


def paint_wall(draw: ImageDraw.ImageDraw, size: int) -> None:  # 定义墙体纹理绘制函数
    """绘制深灰砖块墙瓦片。"""  # 函数描述
    draw.rectangle((0, 0, size, size), fill="#424242")  # 填充深灰底色
    brick_height = size // 4  # 计算砖块高度
    for row in range(0, size, brick_height):  # 遍历每一行砖块
        offset = (row // brick_height % 2) * (size // 8)  # 交错偏移增强砖墙效果
        for col in range(-offset, size, size // 4):  # 遍历每列砖块
            draw.rectangle((col, row, col + size // 4, row + brick_height), outline="#616161", width=1)  # 绘制砖块轮廓


def paint_tree(draw: ImageDraw.ImageDraw, size: int) -> None:  # 定义树木纹理绘制函数
    """绘制绿色树冠与棕色树干的树木瓦片。"""  # 函数用途说明
    draw.rectangle((0, 0, size, size), fill="#2e7d32")  # 填充深绿地表
    draw.ellipse((4, 4, size - 4, size - 8), fill="#66bb6a", outline="#1b5e20", width=2)  # 绘制树冠椭圆
    draw.rectangle((size // 2 - 3, size - 10, size // 2 + 3, size - 2), fill="#5d4037")  # 绘制树干矩形


def paint_house(draw: ImageDraw.ImageDraw, size: int) -> None:  # 定义房屋纹理绘制函数
    """绘制红色屋顶与墙体的小房子符号。"""  # 函数描述
    draw.rectangle((0, 0, size, size), fill="#d7ccc8")  # 用浅棕打底模拟地面
    draw.polygon(((size // 2, 4), (size - 4, size // 2), (4, size // 2)), fill="#e53935")  # 绘制红色屋顶三角形
    draw.rectangle((8, size // 2, size - 8, size - 4), fill="#ffebee", outline="#5d4037", width=2)  # 绘制房体矩形
    draw.rectangle((size // 2 - 4, size // 2 + 6, size // 2 + 4, size - 4), fill="#8d6e63")  # 绘制门体


def paint_rock(draw: ImageDraw.ImageDraw, size: int) -> None:  # 定义岩石纹理绘制函数
    """绘制灰色岩石块纹理。"""  # 函数说明
    draw.rectangle((0, 0, size, size), fill="#757575")  # 填充灰色背景
    draw.polygon(((6, size - 6), (size // 2, 4), (size - 6, size - 8)), fill="#bdbdbd", outline="#424242", width=2)  # 绘制岩石多边形
    draw.line((8, size - 6, size // 2, size // 2), fill="#9e9e9e", width=1)  # 添加裂纹线条


def paint_lava(draw: ImageDraw.ImageDraw, size: int) -> None:  # 定义岩浆纹理绘制函数
    """绘制橙红色流动纹理的岩浆瓦片。"""  # 函数描述
    draw.rectangle((0, 0, size, size), fill="#f57c00")  # 填充橙色底
    draw.line((0, size // 3, size, size // 3 + 4), fill="#ffeb3b", width=3)  # 绘制亮黄色熔流
    draw.line((0, size - size // 3, size, size - size // 3 - 4), fill="#d84315", width=3)  # 绘制暗红熔流


@dataclass(frozen=True)
class TileSpec:  # 定义瓦片规格数据类
    """描述单个瓦片名称与绘制函数的配置结构。"""  # 数据类docstring中文说明

    name: str  # 名称字段标注瓦片的逻辑名称
    painter: Callable[[ImageDraw.ImageDraw, int], None]  # painter字段指向绘制函数


TILE_ORDER: Tuple[TileSpec, ...] = (  # 定义瓦片绘制顺序常量
    TileSpec("GRASS", paint_grass),  # 草地瓦片配置
    TileSpec("ROAD", paint_road),  # 道路瓦片配置
    TileSpec("TILE_FLOOR", paint_tile_floor),  # 瓷砖地板配置
    TileSpec("WATER", paint_water),  # 水面瓦片配置
    TileSpec("LAKE", paint_lake),  # 湖泊瓦片配置
    TileSpec("WALL", paint_wall),  # 墙体瓦片配置
    TileSpec("TREE", paint_tree),  # 树木瓦片配置
    TileSpec("HOUSE", paint_house),  # 房屋瓦片配置
    TileSpec("ROCK", paint_rock),  # 岩石瓦片配置
    TileSpec("LAVA", paint_lava),  # 岩浆瓦片配置
)


def ensure_directory(path: Path) -> None:  # 定义目录创建辅助函数
    """确保目标目录存在。"""  # 函数docstring中文说明
    path.mkdir(parents=True, exist_ok=True)  # 创建目录并忽略已存在错误


def generate_tilesheet(output_dir: Path, tile_size: int) -> Path:  # 定义生成瓦片图集的函数
    """根据配置生成包含所有地形的瓦片图集。"""  # 函数说明
    columns = 8  # 固定每行展示8个瓦片
    rows = math.ceil(len(TILE_ORDER) / columns)  # 计算需要的行数
    sheet_width = columns * tile_size  # 计算图集宽度
    sheet_height = rows * tile_size  # 计算图集高度
    sheet = Image.new("RGBA", (sheet_width, sheet_height), (0, 0, 0, 0))  # 创建透明底图
    for index, spec in enumerate(TILE_ORDER):  # 遍历每个瓦片配置
        col = index % columns  # 计算列索引
        row = index // columns  # 计算行索引
        tile_image = Image.new("RGBA", (tile_size, tile_size), (0, 0, 0, 0))  # 创建单个瓦片画布
        tile_draw = ImageDraw.Draw(tile_image)  # 获取绘图对象
        spec.painter(tile_draw, tile_size)  # 调用配置的绘制函数
        sheet.paste(tile_image, (col * tile_size, row * tile_size))  # 将瓦片贴到图集对应位置
    tiles_dir = output_dir / "tiles"  # 计算图集输出目录
    ensure_directory(tiles_dir)  # 确保目录存在
    tilesheet_path = tiles_dir / "tilesheet.png"  # 定义图集文件路径
    sheet.save(tilesheet_path, format="PNG")  # 保存图集为PNG文件
    return tilesheet_path  # 返回文件路径


def generate_player_sprite(output_dir: Path, tile_size: int) -> Path:  # 定义生成玩家精灵图的函数
    """绘制四帧简易小人动画图集。"""  # 函数说明
    frame_count = 4  # 定义帧数量
    sprite = Image.new("RGBA", (tile_size * frame_count, tile_size), (0, 0, 0, 0))  # 创建整体图像
    for frame in range(frame_count):  # 遍历每一帧
        frame_image = Image.new("RGBA", (tile_size, tile_size), (0, 0, 0, 0))  # 创建单帧画布
        draw = ImageDraw.Draw(frame_image)  # 获取绘图对象
        body_color = "#1976d2"  # 定义身体颜色
        limb_offset = 4 if frame % 2 == 1 else 0  # 根据帧数调整四肢摆动
        draw.ellipse((tile_size // 2 - 6, 4, tile_size // 2 + 6, 16), fill="#ffcc80", outline="#e65100", width=1)  # 绘制头部
        draw.rectangle((tile_size // 2 - 5, 16, tile_size // 2 + 5, tile_size - 10), fill=body_color)  # 绘制躯干
        draw.rectangle((tile_size // 2 - 7, 18 + limb_offset, tile_size // 2 - 5, tile_size - 4), fill="#37474f")  # 绘制左腿
        draw.rectangle((tile_size // 2 + 5, 18 - limb_offset, tile_size // 2 + 7, tile_size - 4), fill="#37474f")  # 绘制右腿
        draw.rectangle((tile_size // 2 - 9, 18 - limb_offset, tile_size // 2 - 7, 30), fill="#bbdefb")  # 绘制左臂
        draw.rectangle((tile_size // 2 + 7, 18 + limb_offset, tile_size // 2 + 9, 30), fill="#bbdefb")  # 绘制右臂
        sprite.paste(frame_image, (frame * tile_size, 0), frame_image)  # 将单帧贴入总图
    characters_dir = output_dir / "characters"  # 定义角色输出目录
    ensure_directory(characters_dir)  # 确保目录存在
    player_path = characters_dir / "player.png"  # 计算玩家文件路径
    sprite.save(player_path, format="PNG")  # 保存玩家图像
    return player_path  # 返回文件路径


def mirror_to_frontend(paths: Iterable[Path], output_root: Path) -> None:  # 定义同步资源到前端目录的函数
    """将生成的PNG复制或链接到前端可访问目录。"""  # 函数说明
    frontend_root = Path("frontend/phaser/assets/build")  # 定义前端可访问根目录
    for resource_path in paths:  # 遍历每个资源文件
        relative = resource_path.relative_to(output_root)  # 计算相对路径
        target_path = frontend_root / relative  # 得到目标前端路径
        ensure_directory(target_path.parent)  # 确保目标目录存在
        if target_path.exists() and not target_path.is_symlink():  # 若已存在普通文件
            target_path.unlink()  # 删除旧文件以确保更新
        if target_path.is_symlink():  # 若存在符号链接
            target_path.unlink()  # 删除旧符号链接避免残留
        try:  # 捕获可能的符号链接异常
            os.symlink(resource_path.resolve(), target_path)  # 尝试创建指向绝对路径的符号链接
        except (AttributeError, NotImplementedError, OSError):  # 捕获不支持或失败的情况
            shutil.copy2(resource_path, target_path)  # 退回到复制文件的方案


def parse_arguments() -> argparse.Namespace:  # 定义命令行参数解析函数
    """解析命令行参数，支持自定义输出目录与瓦片尺寸。"""  # 函数说明
    parser = argparse.ArgumentParser(description="生成瓦片图集与玩家精灵。")  # 创建解析器并添加描述
    parser.add_argument("--output", default="assets/build", help="素材输出目录，默认 assets/build。")  # 添加输出目录参数
    parser.add_argument("--tile-size", type=int, default=32, help="瓦片像素尺寸，默认32。")  # 添加瓦片尺寸参数
    parser.add_argument("--skip-frontend-mirror", action="store_true", help="跳过同步到前端目录的步骤。")  # 添加跳过同步选项
    return parser.parse_args()  # 返回解析结果


def main() -> None:  # 定义脚本主函数
    """执行素材生成流程并打印地形索引表。"""  # 函数说明
    args = parse_arguments()  # 解析命令行参数
    output_root = Path(args.output)  # 解析输出目录路径
    ensure_directory(output_root)  # 确保输出根目录存在
    tilesheet_path = generate_tilesheet(output_root, args.tile_size)  # 生成瓦片图集
    player_path = generate_player_sprite(output_root, args.tile_size)  # 生成玩家精灵
    if not args.skip_frontend_mirror:  # 根据参数决定是否同步
        mirror_to_frontend((tilesheet_path, player_path), output_root)  # 将资源同步到前端目录
    print("地形索引对照表：")  # 打印标题提示
    for index, spec in enumerate(TILE_ORDER):  # 遍历瓦片配置输出索引
        print(f"{index}: {spec.name}")  # 输出索引与名称
    print(f"瓦片图集输出：{tilesheet_path}")  # 输出图集路径提示
    print(f"玩家动画输出：{player_path}")  # 输出玩家图路径提示


if __name__ == "__main__":  # 判断是否直接执行脚本
    main()  # 调用主函数执行生成流程
