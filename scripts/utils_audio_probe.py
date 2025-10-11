#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 该脚本判断常见音频容器类型
# 导入 pathlib 处理路径
from pathlib import Path
# 导入 typing 提供类型注解
from typing import Optional

# 定义函数检测音频容器
def probe_audio_container(file_path: Path) -> Optional[str]:
    """读取文件头判断 OGG/MP3/WAV"""
    # 统一转换为 Path 对象
    path = Path(file_path)
    # 如果文件不存在则返回 None
    if not path.is_file():
        return None
    # 打开文件读取签名
    with path.open("rb") as handle:
        # 读取前 12 字节足够判断三种格式
        header = handle.read(12)
        # 判断 OGG 容器
        if header.startswith(b"OggS"):
            return "ogg"
        # 判断 WAV 容器（RIFF + WAVE）
        if header.startswith(b"RIFF") and len(header) >= 12 and header[8:12] == b"WAVE":
            return "wav"
        # 判断 MP3：ID3 标签或帧同步
        if header.startswith(b"ID3"):
            return "mp3"
        if len(header) >= 2:
            first, second = header[0], header[1]
            if first == 0xFF and (second & 0xE0) == 0xE0:
                return "mp3"
    # 未识别则返回 None
    return None

# 提供命令行测试入口
if __name__ == "__main__":
    # 导入 argparse 解析命令
    import argparse
    # 构造解析器
    parser = argparse.ArgumentParser(description="Probe audio container")
    # 添加文件参数
    parser.add_argument("path", type=Path, help="音频文件路径")
    # 解析参数
    args = parser.parse_args()
    # 调用检测函数
    kind = probe_audio_container(args.path)
    # 打印结果
    print(kind or "unknown")
