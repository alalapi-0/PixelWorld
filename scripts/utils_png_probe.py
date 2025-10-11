#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 该脚本提供 PNG 文件头部探测的实用函数
# 导入 pathlib 用于处理路径
from pathlib import Path
# 导入 struct 用于解析二进制数据
import struct
# 导入 typing 中的可选类型声明
from typing import Optional, Tuple

# 定义 PNG 标准签名常量
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"

# 定义函数读取 PNG 尺寸
def probe_png_size(file_path: Path) -> Optional[Tuple[int, int]]:
    """读取 PNG 文件的宽高信息"""
    # 将输入统一转换为 Path 对象
    path = Path(file_path)
    # 检查文件是否存在
    if not path.is_file():
        # 不存在则返回 None
        return None
    # 打开文件读取二进制内容
    with path.open("rb") as handle:
        # 读取前 8 字节并校验签名
        signature = handle.read(8)
        # 若签名不正确直接返回 None
        if signature != PNG_SIGNATURE:
            return None
        # 读取下一个 8+13=21 字节（长度+类型+IHDR 数据）
        header = handle.read(25)
        # 如果长度不足则返回 None
        if len(header) < 25:
            return None
        # 解析长度与类型
        length = struct.unpack(">I", header[0:4])[0]
        chunk_type = header[4:8]
        # 验证首个块为 IHDR 且长度正确
        if chunk_type != b"IHDR" or length != 13:
            return None
        # 解包宽度和高度
        width, height = struct.unpack(">II", header[8:16])
        # 返回宽高元组
        return int(width), int(height)

# 定义主函数以便脚本独立运行测试
if __name__ == "__main__":
    # 示例：打印传入文件的尺寸
    # 导入 argparse 用于命令行解析
    import argparse
    # 创建命令行解析器
    parser = argparse.ArgumentParser(description="Probe PNG size")
    # 添加位置参数指定文件路径
    parser.add_argument("path", type=Path, help="PNG 文件路径")
    # 解析命令行参数
    args = parser.parse_args()
    # 调用探测函数获取尺寸
    result = probe_png_size(args.path)
    # 输出探测结果
    if result:
        # 打印宽高信息
        print(f"width={result[0]}, height={result[1]}")
    else:
        # 非法 PNG 输出提示
        print("invalid png")
