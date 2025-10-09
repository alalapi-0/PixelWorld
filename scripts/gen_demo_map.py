"""生成单层Tiled JSON地图，包含多种不可通行与可通行地形。"""  # 模块docstring中文说明
from __future__ import annotations  # 引入未来注解便于类型标注

import argparse  # 导入参数解析模块
import json  # 导入JSON模块用于写文件
import math  # 导入数学库生成蜿蜒道路
import random  # 导入随机模块用于地图随机化
from collections import Counter  # 导入Counter统计瓦片数量
from pathlib import Path  # 导入Path处理路径
from typing import Dict, List, Tuple  # 导入类型注解辅助说明

TERRAIN_SEQUENCE: Tuple[str, ...] = (  # 定义地形枚举顺序
    "GRASS",  # 草地可行走
    "ROAD",  # 道路可行走
    "TILE_FLOOR",  # 瓷砖地板可行走
    "WATER",  # 水面不可行走
    "LAKE",  # 湖泊不可行走
    "WALL",  # 墙体不可行走
    "TREE",  # 树木不可行走
    "HOUSE",  # 房屋不可行走
    "ROCK",  # 岩石不可行走
    "LAVA",  # 岩浆不可行走
)  # 枚举结束

TERRAIN_INDEX: Dict[str, int] = {name: idx for idx, name in enumerate(TERRAIN_SEQUENCE)}  # 构建名称到索引的映射

BLOCKED_SET = {TERRAIN_INDEX[name] for name in ("WATER", "LAKE", "WALL", "TREE", "HOUSE", "ROCK", "LAVA")}  # 定义不可通行集合


def build_grid(width: int, height: int, fill: int) -> List[List[int]]:  # 定义构建二维网格的函数
    """返回指定尺寸并填充初始值的二维瓦片数组。"""  # 函数docstring中文说明
    return [[fill for _ in range(width)] for _ in range(height)]  # 使用列表推导生成网格


def carve_road(grid: List[List[int]], base_row: int, amplitude: float, seed: int) -> None:  # 定义道路雕刻函数
    """使用正弦波与随机扰动绘制蜿蜒道路。"""  # 函数说明
    random.seed(seed)  # 设置随机种子确保可复现
    height = len(grid)  # 获取网格高度
    width = len(grid[0])  # 获取网格宽度
    for x in range(width):  # 遍历所有列
        wave = math.sin(x / 5.0) * amplitude  # 计算正弦偏移
        jitter = random.randint(-1, 1)  # 添加微小抖动
        center = max(1, min(height - 2, base_row + int(wave) + jitter))  # 限制道路中心在边界内
        for dy in (-1, 0, 1):  # 遍历道路厚度
            grid[center + dy][x] = TERRAIN_INDEX["ROAD"]  # 将位置设置为道路


def scatter_tiles(grid: List[List[int]], tile_name: str, count: int, seed: int, avoid: Tuple[int, ...]) -> None:  # 定义随机撒点函数
    """随机放置指定数量的瓦片，避开给定索引。"""  # 函数说明
    random.seed(seed + hash(tile_name) % 99991)  # 根据名称混合种子
    height = len(grid)  # 读取高度
    width = len(grid[0])  # 读取宽度
    attempts = 0  # 初始化尝试计数
    placed = 0  # 初始化成功计数
    target_index = TERRAIN_INDEX[tile_name]  # 查找目标瓦片索引
    avoid_set = set(avoid)  # 将避开索引转换为集合
    while placed < count and attempts < count * 10:  # 限制尝试次数
        attempts += 1  # 增加尝试计数
        x = random.randint(0, width - 1)  # 随机列坐标
        y = random.randint(0, height - 1)  # 随机行坐标
        if grid[y][x] in avoid_set:  # 如果当前位置在避开集合
            continue  # 跳过
        grid[y][x] = target_index  # 放置目标瓦片
        placed += 1  # 成功数量加一


def place_patch(grid: List[List[int]], center: Tuple[int, int], radius: int, core_tile: str, border_tile: str) -> None:  # 定义区域填充函数
    """以给定中心为核心绘制圆形区域及其边界。"""  # 函数说明
    height = len(grid)  # 获取高度
    width = len(grid[0])  # 获取宽度
    cx, cy = center  # 解包中心坐标
    for y in range(max(1, cy - radius - 1), min(height - 1, cy + radius + 2)):  # 遍历垂直范围
        for x in range(max(1, cx - radius - 1), min(width - 1, cx + radius + 2)):  # 遍历水平范围
            dist = math.hypot(x - cx, y - cy)  # 计算欧几里得距离
            if dist <= radius:  # 若在核心区域
                grid[y][x] = TERRAIN_INDEX[core_tile]  # 设置为核心瓦片
            elif dist <= radius + 1:  # 若在边缘一圈
                if grid[y][x] == TERRAIN_INDEX["GRASS"]:  # 避免覆盖道路等其他区域
                    grid[y][x] = TERRAIN_INDEX[border_tile]  # 设置为边缘瓦片


def sprinkle_lava_rivers(grid: List[List[int]], seed: int, segments: int) -> None:  # 定义岩浆区域生成函数
    """生成短小的岩浆裂缝。"""  # 函数说明
    random.seed(seed * 3 + 7)  # 基于种子初始化随机
    height = len(grid)  # 获取高度
    width = len(grid[0])  # 获取宽度
    for _ in range(segments):  # 遍历段数量
        start_x = random.randint(2, width - 3)  # 随机起点列
        start_y = random.randint(2, height - 3)  # 随机起点行
        length = random.randint(4, 8)  # 随机裂缝长度
        direction = random.choice([(1, 0), (1, 1), (0, 1)])  # 随机方向
        x, y = start_x, start_y  # 初始化当前位置
        for _ in range(length):  # 按长度生成
            if 0 <= x < width and 0 <= y < height:  # 确保在边界内
                grid[y][x] = TERRAIN_INDEX["LAVA"]  # 设置为岩浆
                if y + 1 < height and grid[y + 1][x] == TERRAIN_INDEX["GRASS"]:  # 在岩浆下方添加熔岩光晕
                    grid[y + 1][x] = TERRAIN_INDEX["TILE_FLOOR"]  # 以瓷砖表现烫热地面
            x += direction[0]  # 沿方向移动
            y += direction[1]  # 沿方向移动


def add_houses_and_plazas(grid: List[List[int]], seed: int, count: int) -> None:  # 定义房屋与地砖区域添加函数
    """沿道路附近放置房屋与瓷砖小广场。"""  # 函数说明
    random.seed(seed * 11 + 5)  # 初始化随机种子
    height = len(grid)  # 获取高度
    width = len(grid[0])  # 获取宽度
    plaza_tiles = [(0, 0), (1, 0), (0, 1), (1, 1)]  # 定义地砖相对坐标
    placed = 0  # 初始化已放置计数
    attempts = 0  # 初始化尝试次数
    max_attempts = count * 30  # 设定最大尝试次数
    while placed < count and attempts < max_attempts:  # 循环直到达到数量或超出尝试限制
        attempts += 1  # 增加尝试数
        x = random.randint(2, width - 3)  # 随机列坐标
        y = random.randint(2, height - 3)  # 随机行坐标
        if grid[y][x] != TERRAIN_INDEX["ROAD"]:  # 如果当前不是道路
            continue  # 跳过该位置
        for dx, dy in plaza_tiles:  # 遍历地砖相对位置
            if y + dy < height and x + dx < width:  # 确保在边界内
                grid[y + dy][x + dx] = TERRAIN_INDEX["TILE_FLOOR"]  # 铺设瓷砖地面
        house_pos = random.choice(plaza_tiles)  # 从地砖位置选择房屋位置
        hx, hy = house_pos  # 解包房屋相对坐标
        grid[y + hy][x + hx] = TERRAIN_INDEX["HOUSE"]  # 放置房屋图标
        placed += 1  # 成功放置数量增加


def generate_map_data(width: int, height: int, seed: int) -> Dict[str, object]:  # 定义核心地图生成函数
    """按照规则生成包含单层瓦片数据的Tiled JSON结构。"""  # 函数说明
    random.seed(seed)  # 设置种子确保整体可复现
    grid = build_grid(width, height, TERRAIN_INDEX["GRASS"])  # 创建草地基底
    carve_road(grid, height // 2, amplitude=3.0, seed=seed)  # 在中部雕刻道路
    scatter_tiles(grid, "TREE", width * height // 20, seed, (TERRAIN_INDEX["ROAD"], TERRAIN_INDEX["LAKE"]))  # 随机树木
    scatter_tiles(grid, "ROCK", width * height // 30, seed + 1, (TERRAIN_INDEX["ROAD"],))  # 随机岩石
    lake_count = random.randint(1, 2)  # 随机湖泊数量
    for _ in range(lake_count):  # 遍历湖泊
        center = (random.randint(4, width - 5), random.randint(4, height - 5))  # 随机中心
        radius = random.randint(3, 5)  # 随机半径
        place_patch(grid, center, radius, "LAKE", "WATER")  # 放置湖泊与水圈
    sprinkle_lava_rivers(grid, seed + 2, segments=3)  # 生成少量岩浆裂缝
    scatter_tiles(grid, "WALL", width * height // 40, seed + 3, (TERRAIN_INDEX["ROAD"],))  # 零星墙柱
    add_houses_and_plazas(grid, seed + 4, max(2, width // 10))  # 添加房屋与广场
    data_flat: List[int] = []  # 初始化扁平化数组
    for row in grid:  # 遍历每行
        for value in row:  # 遍历每列值
            data_flat.append(value + 1)  # 转换为Tiled使用的gid（从1开始）
    counts = Counter(value for row in grid for value in row)  # 统计各地形数量
    map_data = {  # 构建地图JSON结构
        "height": height,  # 地图高度
        "width": width,  # 地图宽度
        "tilewidth": 32,  # 单瓦片宽度
        "tileheight": 32,  # 单瓦片高度
        "orientation": "orthogonal",  # 正交地图
        "renderorder": "right-down",  # 右下绘制顺序
        "version": "1.10",  # Tiled版本
        "type": "map",  # 数据类型
        "infinite": False,  # 非无限地图
        "layers": [  # 图层数组
            {
                "type": "tilelayer",  # 图层类型
                "name": "Ground",  # 图层名称
                "width": width,  # 图层宽度
                "height": height,  # 图层高度
                "encoding": "csv",  # 使用CSV编码
                "data": data_flat,  # 实际瓦片数据
            }
        ],
        "tilesets": [  # 瓦片集列表
            {
                "firstgid": 1,  # 第一帧编号
                "name": "world_tiles",  # 瓦片集名称
                "tilewidth": 32,  # 瓦片宽度
                "tileheight": 32,  # 瓦片高度
                "spacing": 0,  # 无间隔
                "margin": 0,  # 无边距
                "tilecount": len(TERRAIN_SEQUENCE),  # 瓦片数量
                "columns": 8,  # 列数量
                "image": "../../assets/build/tiles/tilesheet.png",  # 图集路径
                "imagewidth": 32 * 8,  # 图集宽度
                "imageheight": 32 * math.ceil(len(TERRAIN_SEQUENCE) / 8),  # 图集高度
            }
        ],
        "properties": [  # 自定义属性
            {
                "name": "blocked_indices",  # 属性名称
                "type": "string",  # 属性类型
                "value": ",".join(str(idx + 1) for idx in sorted(BLOCKED_SET)),  # 不可走索引字符串
            }
        ],
    }  # 结构结束
    print(f"地图尺寸：{width}x{height}")  # 输出尺寸信息
    for name, index in TERRAIN_INDEX.items():  # 遍历地形种类
        print(f"{name}: {counts[index]} 格")  # 输出数量统计
    return map_data  # 返回地图数据


def parse_arguments() -> argparse.Namespace:  # 定义参数解析函数
    """解析命令行参数提供输出路径、尺寸与随机种子。"""  # 函数说明
    parser = argparse.ArgumentParser(description="生成单层Tiled地图。")  # 创建解析器
    parser.add_argument("--width", type=int, default=50, help="地图宽度（格），默认50。")  # 添加宽度参数
    parser.add_argument("--height", type=int, default=40, help="地图高度（格），默认40。")  # 添加高度参数
    parser.add_argument("--seed", type=int, default=42, help="随机种子，默认42。")  # 添加随机种子参数
    parser.add_argument("--tile-size", type=int, default=32, help="瓦片像素尺寸，默认32。")  # 添加瓦片尺寸参数
    parser.add_argument("--output", default="frontend/phaser/maps/demo_map.json", help="输出路径，默认写入前端目录。")  # 添加输出路径参数
    return parser.parse_args()  # 返回解析结果


def main() -> None:  # 定义主函数
    """根据命令行参数生成地图并写入JSON文件。"""  # 函数说明
    args = parse_arguments()  # 解析参数
    map_data = generate_map_data(args.width, args.height, args.seed)  # 生成地图数据
    map_data["tilewidth"] = args.tile_size  # 根据参数更新瓦片宽度
    map_data["tileheight"] = args.tile_size  # 根据参数更新瓦片高度
    map_data["tilesets"][0]["tilewidth"] = args.tile_size  # 更新瓦片集宽度
    map_data["tilesets"][0]["tileheight"] = args.tile_size  # 更新瓦片集高度
    map_data["tilesets"][0]["imagewidth"] = args.tile_size * 8  # 更新图集宽度
    map_data["tilesets"][0]["imageheight"] = args.tile_size * math.ceil(len(TERRAIN_SEQUENCE) / 8)  # 更新图集高度
    output_path = Path(args.output)  # 转换输出路径
    output_path.parent.mkdir(parents=True, exist_ok=True)  # 确保目录存在
    with output_path.open("w", encoding="utf-8") as file:  # 打开文件准备写入
        json.dump(map_data, file, ensure_ascii=False, indent=2)  # 写入JSON并格式化
    print(f"地图文件已生成：{output_path}")  # 输出完成提示


if __name__ == "__main__":  # 判断入口
    main()  # 执行主函数
