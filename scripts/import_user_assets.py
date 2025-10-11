#!/usr/bin/env python3
# 严禁生成二进制文件，此脚本仅处理文本记录与复制或移动已存在的文件
"""导入用户素材到统一 build 目录的脚本。"""

from __future__ import annotations  # 保证类型提示前向引用，纯文本操作

import argparse  # 解析命令行参数
import json  # 处理 JSON 文本
import logging  # 记录日志到文本文件
import shutil  # 执行复制或移动操作但不生成二进制
from datetime import datetime, timezone  # 生成 UTC 时间戳
from pathlib import Path  # 进行路径运算
from typing import Dict, List, Optional, Tuple  # 类型提示辅助

# 默认规则映射，键为用户素材目录，值为 build 下的目标相对路径
DEFAULT_RULES: Dict[str, str] = {
    "audio/bgm": "audio/bgm",  # 背景音乐归类
    "audio/bgs": "audio/bgs",  # 背景环境音归类
    "audio/me": "audio/me",  # 事件音乐归类
    "audio/se": "audio/se",  # 音效归类
    "graphics/characters": "characters",  # 角色图归类
    "graphics/animations": "effects",  # 动画特效归类
    "graphics/battlebacks1": "tiles",  # 战斗背景推送至瓦片
    "graphics/battlebacks2": "tiles",  # 战斗背景推送至瓦片
    "graphics/tilesets": "tiles",  # 瓦片集归类
    "graphics/parallaxes": "tiles",  # 视差图归类
    "characters": "characters",  # 兼容旧结构
    "tiles": "tiles",  # 兼容旧结构
    "effects": "effects",  # 兼容旧结构
    "ui": "ui",  # 兼容旧结构
}

# 图像二级分类关键字，用于未匹配目录时简单判断
TILE_KEYWORDS = ["tile", "battleback", "parallax", "world", "map"]  # 判定为瓦片
UI_KEYWORDS = ["icon", "ui", "menu", "button", "cursor"]  # 判定为界面


def load_rules(rule_path: Optional[Path]) -> Dict[str, str]:
    """载入自定义规则，若不存在则返回默认规则副本。"""

    if rule_path is None:  # 未提供规则文件
        return {key.lower(): value for key, value in DEFAULT_RULES.items()}  # 返回默认规则副本
    if not rule_path.exists():  # 文件不存在时报错
        raise FileNotFoundError(f"规则文件不存在: {rule_path}")  # 抛出异常
    with rule_path.open("r", encoding="utf-8") as handle:  # 读取 JSON 文本
        data = json.load(handle)  # 解析 JSON 内容
    merged = dict(DEFAULT_RULES)  # 复制默认规则
    merged.update({str(k).lower(): str(v) for k, v in data.items()})  # 合并自定义规则
    return {key.lower(): value for key, value in merged.items()}  # 返回小写键映射


def classify_graphics(sub_path: Path, logger: logging.Logger) -> str:
    """根据图形子目录名称推断目标分类。"""

    name = sub_path.name.lower()  # 取小写目录名
    if any(keyword in name for keyword in TILE_KEYWORDS):  # 包含瓦片关键字
        logger.warning("[WARN] 未识别目录 %s → 归入 build/tiles", sub_path)  # 记录警告
        return "tiles"  # 返回瓦片分类
    if any(keyword in name for keyword in UI_KEYWORDS):  # 包含界面关键字
        logger.warning("[WARN] 未识别目录 %s → 归入 build/ui", sub_path)  # 记录警告
        return "ui"  # 返回界面分类
    logger.warning("[WARN] 未识别目录 %s → 默认归入 build/ui", sub_path)  # 无匹配则归入 UI
    return "ui"  # 默认返回界面分类


def determine_target(
    relative: Path,
    rules: Dict[str, str],
    logger: logging.Logger,
) -> Optional[Tuple[str, str]]:
    """根据规则确定目标子目录与索引类别。"""

    parts = relative.parts  # 拆分路径片段
    if not parts:  # 若没有有效片段
        logger.error("[ERROR] 空路径无法处理: %s", relative)  # 记录错误
        return None  # 返回空
    first = parts[0].lower()  # 第一层目录
    second = parts[1].lower() if len(parts) > 1 else ""  # 第二层目录
    candidates = []  # 候选键集合
    if second:  # 若存在二级目录
        candidates.append(f"{first}/{second}")  # 加入组合键
    candidates.append(first)  # 加入一级目录键
    if len(parts) > 1:  # 兼容原始大小写键
        candidates.append(f"{parts[0]}/{parts[1]}".lower())  # 加入原始组合键的小写形式
    for candidate in candidates:  # 遍历候选键
        if candidate in rules:  # 若命中规则
            target_dir = rules[candidate]  # 获取目标目录
            category_key = target_dir.split("/")[-1]  # 提取类别键
            return target_dir, category_key  # 返回映射
    if first == "graphics" and len(parts) > 1:  # 处理图像未匹配目录
        fallback = classify_graphics(Path(parts[1]), logger)  # 使用分类器
        return fallback, fallback  # 返回 fallback 分类
    logger.warning("[WARN] 未匹配的目录 %s 已跳过", relative)  # 其余情况跳过
    return None  # 返回空


def ensure_directory(path: Path) -> None:
    """确保目标目录存在。"""

    path.mkdir(parents=True, exist_ok=True)  # 创建目录（若已存在不会报错）


def copy_or_move(src: Path, dst: Path, move: bool) -> None:
    """根据模式复制或移动文件，若已存在则覆盖。"""

    if dst.exists():  # 若目标已存在
        if dst.is_file():  # 仅对文件执行删除
            dst.unlink()  # 删除旧文件
    if move:  # 移动模式
        shutil.move(str(src), str(dst))  # 移动文件
    else:  # 复制模式
        shutil.copy2(src, dst)  # 复制文件


def gather_user_files(user_root: Path) -> List[Path]:
    """收集用户素材目录下的所有文件。"""

    if not user_root.exists():  # 若目录不存在
        raise FileNotFoundError(f"用户素材目录不存在: {user_root}")  # 抛出异常
    return [path for path in user_root.rglob("*") if path.is_file()]  # 返回所有文件路径


def build_index_structure() -> Dict[str, Dict[str, List[str]]]:
    """初始化索引结构。"""

    return {
        "audio": {"bgm": [], "bgs": [], "me": [], "se": []},  # 音频分类
        "images": {"characters": [], "tiles": [], "effects": [], "ui": []},  # 图像分类
    }


def update_index(
    index: Dict[str, Dict[str, List[str]]],
    category: str,
    subcategory: str,
    relative_path: str,
) -> None:
    """向索引结构中追加条目。"""

    container = index.get(category, {})  # 获取一级分类容器
    if subcategory not in container:  # 若不存在子分类
        container[subcategory] = []  # 初始化子分类列表
    if relative_path not in container[subcategory]:  # 避免重复
        container[subcategory].append(relative_path)  # 追加路径


def run_import(
    root: Path,
    move_mode: bool = False,
    rule_file: Optional[Path] = None,
) -> Dict[str, Dict[str, List[str]]]:
    """执行导入流程并返回索引结构。"""

    assets_root = root / "assets"  # 资产根目录
    user_root = assets_root / "user_imports"  # 用户素材目录
    build_root = assets_root / "build"  # build 目录
    log_root = root / "logs"  # 日志目录
    ensure_directory(log_root)  # 确保日志目录存在
    logger = logging.getLogger("user_imports")  # 获取日志记录器
    logger.setLevel(logging.INFO)  # 设置日志等级
    log_path = log_root / "user_imports.log"  # 日志文件路径
    handler = logging.FileHandler(log_path, encoding="utf-8")  # 创建文件处理器
    formatter = logging.Formatter("%(message)s")  # 定义输出格式
    handler.setFormatter(formatter)  # 设置格式化器
    logger.handlers = [handler]  # 替换旧处理器确保幂等
    mode_label = "move" if move_mode else "copy"  # 记录模式标签
    rules = load_rules(rule_file)  # 加载规则
    logger.info("[INFO] Start import (%s mode). Rules = %s", mode_label, rule_file or "default")  # 写入日志
    files = gather_user_files(user_root)  # 收集用户文件
    audio_count = 0  # 统计音频数量
    image_count = 0  # 统计图像数量
    index_data = build_index_structure()  # 初始化索引
    for path in files:  # 遍历每个文件
        relative = path.relative_to(user_root)  # 计算相对路径
        mapping = determine_target(relative, rules, logger)  # 判断目标目录
        if not mapping:  # 若无法映射
            continue  # 跳过
        target_dir_name, category_key = mapping  # 解包目标信息
        if target_dir_name.startswith("audio/"):  # 音频类
            category = "audio"  # 一级分类
            if category_key not in index_data[category]:  # 若子分类未初始化
                index_data[category][category_key] = []  # 初始化空列表
            audio_count += 1  # 增加计数
        else:  # 图像类
            category = "images"  # 一级分类
            if category_key not in index_data[category]:  # 若子分类未初始化
                index_data[category][category_key] = []  # 初始化空列表
            image_count += 1  # 增加计数
        destination_dir = build_root / target_dir_name  # 计算目标目录路径
        ensure_directory(destination_dir)  # 确保目录存在
        destination_file = destination_dir / path.name  # 目标文件路径
        copy_or_move(path, destination_file, move_mode)  # 执行复制或移动
        relative_record = destination_file.relative_to(build_root).as_posix()  # 相对路径记录
        update_index(index_data, category, category_key, relative_record)  # 更新索引
        logger.info(
            "[OK]  %s: %s → %s",
            "Moved" if move_mode else "Copied",  # 记录动作
            path.as_posix(),  # 源路径
            destination_file.as_posix(),  # 目标路径
        )
    logger.info("[INFO] Found %s audio files, %s image files", audio_count, image_count)  # 统计日志
    index_payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),  # 生成时间
        "sources": "assets/user_imports/",  # 数据源说明
        "audio": index_data["audio"],  # 音频索引
        "images": index_data["images"],  # 图像索引
        "notes": [
            "该文件仅记录相对 build/ 的路径。",  # 说明文字
            "不包含任何二进制内容。",  # 重申原则
        ],
    }
    ensure_directory(build_root)  # 确保 build 目录存在
    index_path = build_root / "index.json"  # 索引文件路径
    with index_path.open("w", encoding="utf-8") as handle:  # 打开文本文件
        json.dump(index_payload, handle, ensure_ascii=False, indent=2)  # 写入 JSON
        handle.write("\n")  # 结尾换行
    logger.info("[INFO] Wrote index: %s", index_path.as_posix())  # 记录索引写入
    logger.info("[DONE] Import finished without binary generation.")  # 完成日志
    print("[DONE] Import finished without binary generation.")  # 控制台提示
    handler.close()  # 关闭处理器
    logger.handlers = []  # 清空处理器避免重复
    return index_data  # 返回索引数据供调用方使用


def parse_arguments() -> argparse.Namespace:
    """解析命令行参数。"""

    parser = argparse.ArgumentParser(description="导入用户素材到统一目录")  # 创建解析器
    parser.add_argument("--move", action="store_true", help="是否将文件移动而非复制")  # move 参数
    parser.add_argument("--rules", type=str, help="自定义规则 JSON 路径", default=None)  # 规则文件参数
    parser.add_argument("--root", type=str, help="指定仓库根目录，默认为脚本上级", default=None)  # 自定义根目录
    return parser.parse_args()  # 返回解析结果


def main() -> None:
    """脚本入口函数。"""

    args = parse_arguments()  # 获取命令行参数
    root = Path(args.root).resolve() if args.root else Path(__file__).resolve().parents[1]  # 计算根目录
    rules_path = Path(args.rules).resolve() if args.rules else None  # 解析规则路径
    try:  # 捕获运行过程中的异常
        run_import(root, move_mode=args.move, rule_file=rules_path)  # 执行导入
    except Exception as error:  # 捕获异常
        print(f"[ERROR] {error}")  # 控制台输出错误
        raise  # 重新抛出以便上层处理


if __name__ == "__main__":  # 仅在直接执行时运行
    main()  # 调用入口函数

