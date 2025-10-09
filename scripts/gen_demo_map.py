"""生成 miniWorld 用的单层 Tiled 地图示例文件"""  # 模块功能说明
from __future__ import annotations  # 启用未来注解支持

import argparse  # 导入命令行参数解析库
import json  # 导入 JSON 序列化库
import math  # 导入数学函数库
import random  # 导入随机数库
from pathlib import Path  # 导入路径处理库
from typing import Dict, List, Tuple  # 导入类型提示工具

TILE_MAPPING: Dict[str, int] = {  # 定义地形名称到 gid 的映射表
    "GRASS": 1,  # 草地 gid
    "ROAD": 2,  # 道路 gid
    "TILE_FLOOR": 3,  # 瓷砖地 gid
    "WATER": 4,  # 水面 gid
    "LAKE": 5,  # 湖泊 gid
    "WALL": 6,  # 墙壁 gid
    "TREE": 7,  # 树木 gid
    "HOUSE": 8,  # 房屋 gid
    "ROCK": 9,  # 岩石 gid
    "LAVA": 10,  # 岩浆 gid
}  # 映射表定义结束

OUTPUT_PATH = Path("frontend/pixi/maps/demo_map.json")  # 指定输出文件路径


def build_parser() -> argparse.ArgumentParser:  # 定义构建解析器的函数
    """创建命令行参数解析器"""  # 提供函数文档字符串
    parser = argparse.ArgumentParser(description="生成 miniWorld 演示地图")  # 创建解析器对象
    parser.add_argument("--width", type=int, default=50, help="地图宽度（格）")  # 添加宽度参数
    parser.add_argument("--height", type=int, default=40, help="地图高度（格）")  # 添加高度参数
    parser.add_argument("--tile-size", type=int, default=32, help="瓦片尺寸")  # 添加瓦片尺寸参数
    parser.add_argument("--seed", type=int, default=42, help="随机种子")  # 添加随机种子参数
    return parser  # 返回解析器


def set_tile(data: List[int], width: int, x: int, y: int, gid: int) -> None:  # 定义设置瓦片的辅助函数
    """在数据数组中设置指定位置的 gid"""  # 提供函数文档字符串
    if 0 <= x < width and 0 <= y < len(data) // width:  # 判断坐标是否越界
        data[y * width + x] = gid  # 写入 gid 值


def generate_road(data: List[int], width: int, height: int) -> None:  # 定义道路生成函数
    """生成一条带有分支的主道路"""  # 函数说明
    current_y = height // 2  # 初始化道路位置
    for x in range(width):  # 遍历每一列
        current_y = max(1, min(height - 2, current_y + random.randint(-1, 1)))  # 调整道路高度
        set_tile(data, width, x, current_y, TILE_MAPPING["ROAD"])  # 设置道路瓦片
        if random.random() < 0.3:  # 随机决定是否生成分支
            set_tile(data, width, x, current_y - 1, TILE_MAPPING["TILE_FLOOR"])  # 设置分支瓦片


def generate_obstacles(data: List[int], width: int, height: int) -> None:  # 定义生成障碍物函数
    """随机放置树木与岩石"""  # 函数说明
    attempts = width * height // 20  # 计算尝试次数
    for _ in range(attempts):  # 执行多次尝试
        tx = random.randint(0, width - 1)  # 随机选择 X 坐标
        ty = random.randint(0, height - 1)  # 随机选择 Y 坐标
        if data[ty * width + tx] == TILE_MAPPING["GRASS"]:  # 仅在草地放置
            data[ty * width + tx] = random.choice([TILE_MAPPING["TREE"], TILE_MAPPING["ROCK"]])  # 设置树或岩石


def generate_structures(data: List[int], width: int, height: int) -> None:  # 定义生成建筑的函数
    """放置房屋与墙壁装饰"""  # 函数说明
    for _ in range(5):  # 固定尝试次数
        hx = random.randint(2, width - 3)  # 随机房屋 X 坐标
        hy = random.randint(2, height - 3)  # 随机房屋 Y 坐标
        set_tile(data, width, hx, hy, TILE_MAPPING["HOUSE"])  # 放置房屋瓦片
        set_tile(data, width, hx + 1, hy, TILE_MAPPING["WALL"])  # 放置墙壁瓦片
        set_tile(data, width, hx - 1, hy, TILE_MAPPING["WALL"])  # 放置墙壁瓦片


def generate_lake(data: List[int], width: int, height: int) -> None:  # 定义生成湖泊函数
    """创建带有外圈水面的湖泊"""  # 函数说明
    center_x = random.randint(width // 4, width * 3 // 4)  # 计算湖泊中心 X
    center_y = random.randint(height // 4, height * 3 // 4)  # 计算湖泊中心 Y
    radius = max(3, min(width, height) // 6)  # 计算湖泊半径
    for y in range(height):  # 遍历所有行
        for x in range(width):  # 遍历所有列
            distance = math.hypot(x - center_x, y - center_y)  # 计算距离
            if distance <= radius * 0.6:  # 判断是否在湖泊核心
                set_tile(data, width, x, y, TILE_MAPPING["LAKE"])  # 设置湖泊瓦片
            elif distance <= radius:  # 判断是否在外圈
                if data[y * width + x] == TILE_MAPPING["GRASS"]:  # 确保当前为草地
                    set_tile(data, width, x, y, TILE_MAPPING["WATER"])  # 设置水面瓦片


def generate_lava(data: List[int], width: int, height: int) -> None:  # 定义生成岩浆的函数
    """随机散布岩浆"""  # 函数说明
    attempts = max(3, width * height // 80)  # 计算放置次数
    for _ in range(attempts):  # 多次尝试
        lx = random.randint(0, width - 1)  # 随机 X 坐标
        ly = random.randint(0, height - 1)  # 随机 Y 坐标
        set_tile(data, width, lx, ly, TILE_MAPPING["LAVA"])  # 设置岩浆瓦片


def generate_map(width: int, height: int, tile_size: int, seed: int) -> Tuple[Dict, Dict[int, int]]:  # 定义生成地图的主函数
    """根据参数生成地图数据并返回统计"""  # 函数说明
    random.seed(seed)  # 设置随机种子
    data = [TILE_MAPPING["GRASS"] for _ in range(width * height)]  # 初始化地图数据为草地
    generate_road(data, width, height)  # 生成道路
    generate_obstacles(data, width, height)  # 生成障碍物
    generate_structures(data, width, height)  # 生成建筑
    generate_lake(data, width, height)  # 生成湖泊
    generate_lava(data, width, height)  # 生成岩浆
    counts: Dict[int, int] = {gid: 0 for gid in TILE_MAPPING.values()}  # 初始化统计字典
    for gid in data:  # 遍历所有瓦片
        counts[gid] = counts.get(gid, 0) + 1  # 更新统计
    map_json = {  # 构建 Tiled JSON 结构
        "height": height,  # 地图高度
        "width": width,  # 地图宽度
        "tilewidth": tile_size,  # 瓦片宽度
        "tileheight": tile_size,  # 瓦片高度
        "orientation": "orthogonal",  # 地图方向
        "renderorder": "right-down",  # 渲染顺序
        "infinite": False,  # 是否无限地图
        "version": "1.10",  # Tiled 版本
        "tiledversion": "1.10.2",  # Tiled 具体版本
        "layers": [  # 图层数组
            {  # 地图图层配置
                "id": 1,  # 图层 ID
                "name": "Ground",  # 图层名称
                "type": "tilelayer",  # 图层类型
                "visible": True,  # 是否可见
                "opacity": 1,  # 透明度
                "width": width,  # 图层宽度
                "height": height,  # 图层高度
                "x": 0,  # 图层 X 位置
                "y": 0,  # 图层 Y 位置
                "data": data,  # 瓦片数据
            }  # 地图图层配置结束
        ],  # 图层数组结束
        "tilesets": [  # 图集数组
            {  # 图集配置
                "firstgid": 1,  # 起始 gid
                "name": "demo",  # 图集名称
                "tilewidth": tile_size,  # 图块宽度
                "tileheight": tile_size,  # 图块高度
                "tilecount": 100,  # 图块数量
                "columns": 10,  # 每行图块数
                "image": "tilesheet.png",  # 图片路径占位
                "imagewidth": tile_size * 10,  # 图集宽度
                "imageheight": tile_size * 10,  # 图集高度
                "margin": 0,  # 图块外边距
                "spacing": 0,  # 图块间距
            }  # 图集配置结束
        ],  # 图集数组结束
        "nextlayerid": 2,  # 下一个图层 ID
        "nextobjectid": 1,  # 下一个对象 ID
        "type": "map",  # 数据类型
    }  # 结构体构建完成
    return map_json, counts  # 返回结果


def main() -> None:  # 定义脚本主入口
    """脚本主入口"""  # 函数说明
    parser = build_parser()  # 构建解析器
    args = parser.parse_args()  # 解析命令行参数
    map_json, counts = generate_map(args.width, args.height, args.tile_size, args.seed)  # 生成地图与统计
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)  # 确保输出目录存在
    with OUTPUT_PATH.open("w", encoding="utf-8") as fp:  # 打开输出文件
        json.dump(map_json, fp, ensure_ascii=False, indent=2)  # 写入 JSON 文件
    print(f"已生成地图文件: {OUTPUT_PATH}")  # 打印生成提示
    for gid, count in sorted(counts.items()):  # 遍历统计信息
        print(f"gid {gid}: {count}")  # 打印每种地形数量


if __name__ == "__main__":  # 判断是否直接执行脚本
    main()  # 调用主函数
