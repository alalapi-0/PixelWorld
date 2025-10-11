#!/usr/bin/env python3
# 严禁生成二进制文件，此脚本仅处理 JSON 文本与统计
"""根据 build/index.json 生成预览清单。"""

from __future__ import annotations  # 启用前向引用以辅助类型提示

import argparse  # 解析命令行参数
import json  # 读取与写入 JSON 文本
from pathlib import Path  # 处理文件路径
from typing import Dict, List  # 类型提示辅助


def build_preview_entries(index_data: Dict[str, Dict[str, List[str]]]) -> Dict[str, List[Dict[str, str]]]:
    """将导入索引结构转换为预览清单结构。"""

    audio_entries: List[Dict[str, str]] = []  # 初始化音频条目列表
    for audio_type, paths in index_data.get("audio", {}).items():  # 遍历音频分类
        for path in paths:  # 遍历每个路径
            audio_entries.append({"type": audio_type, "path": f"assets/build/{path}"})  # 追加条目
    image_entries: List[Dict[str, str]] = []  # 初始化图像条目列表
    for image_type, paths in index_data.get("images", {}).items():  # 遍历图像分类
        for path in paths:  # 遍历每个路径
            image_entries.append({"type": image_type, "path": f"assets/build/{path}"})  # 追加条目
    return {"audio": audio_entries, "images": image_entries}  # 返回组合结果


def run_preview(root: Path) -> Dict[str, List[Dict[str, str]]]:
    """执行预览索引生成流程。"""

    assets_root = root / "assets"  # 资产根目录
    build_root = assets_root / "build"  # build 目录
    index_path = build_root / "index.json"  # 导入索引文件路径
    if not index_path.exists():  # 如果索引不存在
        raise FileNotFoundError("缺少 assets/build/index.json，请先执行导入脚本")  # 抛出异常
    with index_path.open("r", encoding="utf-8") as handle:  # 打开索引文件
        index_data = json.load(handle)  # 解析 JSON 内容
    preview_data = build_preview_entries(index_data)  # 构造预览数据
    preview_path = assets_root / "preview_index.json"  # 预览文件路径
    with preview_path.open("w", encoding="utf-8") as handle:  # 打开输出文件
        json.dump(preview_data, handle, ensure_ascii=False, indent=2)  # 写入 JSON
        handle.write("\n")  # 末尾换行保持整洁
    audio_count = len(preview_data["audio"])  # 统计音频条目数量
    image_count = len(preview_data["images"])  # 统计图像条目数量
    print(
        f"[DONE] Preview index written: {preview_path.as_posix()} (audio={audio_count}, images={image_count})"
    )  # 控制台输出摘要
    return preview_data  # 返回数据供调用方使用


def parse_arguments() -> argparse.Namespace:
    """解析命令行参数。"""

    parser = argparse.ArgumentParser(description="生成用户素材预览清单")  # 创建解析器
    parser.add_argument("--root", type=str, help="指定仓库根目录，默认为脚本上级", default=None)  # 自定义根目录
    return parser.parse_args()  # 返回参数结果


def main() -> None:
    """脚本入口。"""

    args = parse_arguments()  # 获取参数
    root = Path(args.root).resolve() if args.root else Path(__file__).resolve().parents[1]  # 计算根目录
    try:  # 捕获异常
        run_preview(root)  # 执行预览生成
    except Exception as error:  # 捕获错误
        print(f"[ERROR] {error}")  # 输出错误信息
        raise  # 将异常重新抛出方便调试


if __name__ == "__main__":  # 直接执行时运行
    main()  # 调用主函数

