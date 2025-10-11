#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 该脚本扫描素材目录并生成规范命名方案
# 导入 argparse 解析命令行参数
import argparse
# 导入 json 生成输出文件
import json
# 导入 unicodedata 用于半角化字符
import unicodedata
# 导入 re 处理正则匹配
import re
# 导入 sys 以便退出码控制
import sys
# 导入 pathlib 用于文件路径操作
from pathlib import Path
# 导入 typing 提供类型注解
from typing import Dict, Iterable, List, Optional, Tuple
# 定义脚本根目录
SCRIPT_ROOT = Path(__file__).resolve().parent
# 确保仓库根目录在模块搜索路径中
if str(SCRIPT_ROOT.parent) not in sys.path:
    sys.path.insert(0, str(SCRIPT_ROOT.parent))
# 导入本地 PNG 探测工具
from scripts.utils_png_probe import probe_png_size
# 导入本地音频探测工具
from scripts.utils_audio_probe import probe_audio_container

# 定义计划版本常量
PLAN_VERSION = 1

# 定义路径映射模板
DEFAULT_IMAGE_DIR = Path("assets/build/images")
DEFAULT_AUDIO_DIR = Path("assets/build/audio")

# 定义正则用于拆分词语
TOKEN_PATTERN = re.compile(r"[A-Za-z]+|\d+")

# 定义全角转半角函数
def normalise_text(name: str) -> str:
    """统一字符形态并转为小写"""
    # 使用 NFKC 规范化
    collapsed = unicodedata.normalize("NFKC", name)
    # 替换空格与下划线为连字符
    replaced = re.sub(r"[\s_]+", "-", collapsed)
    # 去除多余符号
    stripped = re.sub(r"[^A-Za-z0-9\-]+", "-", replaced)
    # 合并连续连字符
    cleaned = re.sub(r"-+", "-", stripped)
    # 去除首尾连字符
    trimmed = cleaned.strip("-")
    # 返回小写结果
    return trimmed.lower()

# 定义拆分 Token 的函数
def extract_tokens(name: str) -> List[str]:
    """按字母和数字拆分单词"""
    # 匹配字母和数字片段
    raw_tokens = TOKEN_PATTERN.findall(name)
    # 转换为小写
    return [token.lower() for token in raw_tokens if token]

# 定义 RPG Maker 标记解析函数
def parse_rpgm_markers(original_name: str) -> Tuple[str, List[str]]:
    """处理 !$ 前缀并返回后缀列表"""
    # 初始化标记列表
    suffixes: List[str] = []
    # 去掉文件扩展名
    stem = original_name
    # 处理感叹号表示大尺寸
    if stem.startswith("!"):
        suffixes.append("--large")
        stem = stem[1:]
    # 处理美元符号表示单角色
    if stem.startswith("$"):
        suffixes.append("--single")
        stem = stem[1:]
    # 返回处理后的名称与后缀
    return stem, suffixes

# 定义根据父目录推断类型的函数
def infer_category_from_path(path: Path) -> Optional[str]:
    """依据目录结构推测分类"""
    # 获取父目录列表
    parts = [part.lower() for part in path.parts]
    # 检查关键字匹配
    if "characters" in parts:
        return "images.characters"
    if "tilesets" in parts or "tiles" in parts:
        return "images.tiles"
    if "effects" in parts or "animations" in parts:
        return "images.effects"
    if "ui" in parts or "system" in parts:
        return "images.ui"
    if "audio" in parts and "bgm" in parts:
        return "audio.bgm"
    if "audio" in parts and "se" in parts:
        return "audio.se"
    if "audio" in parts and "voice" in parts:
        return "audio.voice"
    if "audio" in parts:
        return "audio.se"
    if "graphics" in parts:
        return "images.ui"
    # 未命中返回 None
    return None

# 定义图片命名生成函数
def build_image_name(tokens: List[str], suffixes: List[str], subtype: str) -> str:
    """组合图片文件名"""
    # 处理特定词汇映射
    replacements = {
        "actor": "actor",
        "people": "people",
        "animal": "animals",
        "animals": "animals",
        "iconset": "iconset",
        "crystal": "crystal",
        "gate": "gate",
        "fire": "fire",
    }
    # 若包含数字且没有 set 则插入
    if any(token.isdigit() for token in tokens) and "set" not in tokens:
        new_tokens: List[str] = []
        for token in tokens:
            if token.isdigit() and new_tokens and new_tokens[-1] != "set":
                new_tokens.append("set")
            new_tokens.append(token)
        tokens = new_tokens
    # 应用映射替换
    mapped = [replacements.get(token, token) for token in tokens]
    # 组装前缀
    prefix = {
        "characters": "char",
        "tiles": "tile",
        "effects": "fx",
        "ui": "ui",
    }.get(subtype, "img")
    # 拼接主体名称
    body = "-".join([token for token in mapped if token])
    # 若主体为空则使用默认
    if not body:
        body = "asset"
    # 合并前缀
    base = f"{prefix}-{body}"
    # 附加标记后缀
    if suffixes:
        base += "".join(suffixes)
    # 返回完整名称
    return f"{base}.png"

# 定义音频命名生成函数
def build_audio_name(tokens: List[str], subtype: str) -> str:
    """组合音频文件名"""
    # 设定前缀映射
    prefix = {
        "bgm": "bgm",
        "se": "se",
        "voice": "voice",
    }.get(subtype, "audio")
    # 若存在纯数字则补充类别
    mapped_tokens: List[str] = []
    for token in tokens:
        mapped_tokens.append(token)
    # 如果没有 token 则默认 generic
    if not mapped_tokens:
        mapped_tokens = ["clip"]
    # 拼接主体
    body = "-".join(mapped_tokens)
    # 返回完整文件名
    return f"{prefix}-{body}.ogg"

# 定义分类主函数
def classify_file(path: Path, rel_path: Path) -> Tuple[str, Path, List[str], List[str]]:
    """根据文件确定类型与目标路径"""
    # 初始化原因列表
    reasons: List[str] = []
    # 获取文件扩展名
    suffix = path.suffix.lower()
    # 记录扩展名原因
    reasons.append(f"ext:{suffix}")
    # 推断初始分类
    inferred = infer_category_from_path(rel_path.parent)
    if inferred:
        reasons.append(f"parent:{rel_path.parent}")
    # 根据扩展名补充分类
    if suffix == ".png":
        category = inferred or "images.ui"
        subtype = category.split(".")[1]
        # 解析 RPG Maker 标记
        stem_with_flags = path.stem
        stem_clean, suffixes = parse_rpgm_markers(stem_with_flags)
        # 记录标记原因
        if suffixes:
            reasons.append("marker:" + ",".join(suffixes))
        # 规范化文本
        normalised = normalise_text(stem_clean)
        # 拆分词语
        tokens = extract_tokens(normalised)
        if not inferred:
            reasons.append("fallback:images.ui")
        # 使用 PNG 尺寸辅助
        size = probe_png_size(path)
        if size:
            reasons.append(f"png:width={size[0]},height={size[1]}")
        else:
            reasons.append("png:unreadable")
        # 生成文件名
        filename = build_image_name(tokens, suffixes, subtype)
        # 构造目标路径
        target = DEFAULT_IMAGE_DIR / subtype / filename
        # 返回信息
        return f"images.{subtype}", target, reasons, ["rmmz"]
    if suffix in {".ogg", ".mp3", ".wav"}:
        category = inferred or "audio.se"
        subtype = category.split(".")[1]
        # 获取容器类型
        container = probe_audio_container(path)
        if container:
            reasons.append(f"audio:{container}")
        else:
            reasons.append("audio:unknown")
        # 规范化名称
        normalised = normalise_text(path.stem)
        tokens = extract_tokens(normalised)
        if not inferred:
            reasons.append("fallback:audio.se")
        filename = build_audio_name(tokens, subtype)
        target = DEFAULT_AUDIO_DIR / subtype / filename
        return f"audio.{subtype}", target, reasons, []
    # 其它扩展名直接放入冲突
    return "unknown", rel_path, reasons, []

# 定义遍历函数
def iterate_files(sources: Iterable[Path]) -> Iterable[Path]:
    """遍历所有文件"""
    # 遍历来源目录
    for base in sources:
        # 若目录不存在则跳过
        if not base.exists():
            continue
        # 遍历文件
        for path in base.rglob("*"):
            # 仅处理文件
            if path.is_file():
                yield path

# 定义生成计划的主逻辑
# 定义仓库根目录
REPO_ROOT = SCRIPT_ROOT.parent

# 定义生成计划的主逻辑
def build_plan(sources: List[Path]) -> Tuple[List[Dict], List[Dict]]:
    """生成改名计划与冲突列表"""
    # 存储计划项目
    plan_items: List[Dict] = []
    # 存储冲突信息
    conflicts: List[Dict] = []
    # 记录目标去重
    target_map: Dict[Path, Path] = {}
    # 遍历所有文件
    for file_path in iterate_files(sources):
        # 计算相对路径（相对于仓库根目录）
        # 获取文件绝对路径
        abs_path = file_path.resolve()
        try:
            # 转换为相对于仓库根目录的相对路径
            rel_path = abs_path.relative_to(REPO_ROOT)
        except ValueError:
            # 若无法转换则退化为文件名
            rel_path = Path(abs_path.name)
        # 分类与命名
        category, target, reasons, tags = classify_file(abs_path, rel_path)
        # 构建计划项
        if category == "unknown":
            conflicts.append({
                "src": str(rel_path),
                "issue": "unsupported-extension",
                "reasons": reasons,
            })
            continue
        # 检查目标重复
        if target in target_map and target_map[target] != file_path:
            try:
                # 尝试转换已存在路径为相对路径
                existing_rel = target_map[target].relative_to(REPO_ROOT)
            except ValueError:
                # 无法转换则退化为绝对路径
                existing_rel = target_map[target]
            conflicts.append({
                "src": str(rel_path),
                "issue": "duplicate-target",
                "existing": str(existing_rel),
                "target": str(target),
            })
            continue
        # 记录目标映射
        target_map[target] = file_path
        # 检查目标是否已存在不同文件
        if target.exists() and target.resolve() != file_path.resolve():
            conflicts.append({
                "src": str(rel_path),
                "issue": "target-exists",
                "target": str(target),
            })
        # 汇总计划数据
        plan_items.append({
            "src": str(rel_path),
            "dst": str(target),
            "type": category,
            "reasons": reasons,
            "tags_append": tags,
            "notes": ["不会修改文件内容，仅改名/移动"],
        })
    # 返回计划与冲突
    return plan_items, conflicts

# 定义写入 JSON 的函数
def write_json(path: Path, payload: Dict) -> None:
    """写入 JSON 文件"""
    # 确保父目录存在
    path.parent.mkdir(parents=True, exist_ok=True)
    # 写入文件并保持中文
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

# 定义主函数
def main(argv: Optional[List[str]] = None) -> int:
    """程序入口"""
    # 构造参数解析器
    parser = argparse.ArgumentParser(description="Analyze assets and propose renames")
    # 添加 sources 参数
    parser.add_argument("--sources", nargs="+", type=Path, required=True, help="需要扫描的目录")
    # 添加计划输出路径
    parser.add_argument("--out-plan", type=Path, required=True, help="改名计划输出路径")
    # 添加冲突输出路径
    parser.add_argument("--out-conflicts", type=Path, required=True, help="冲突列表输出路径")
    # 解析参数
    args = parser.parse_args(argv)
    # 生成计划
    plan_items, conflicts = build_plan(list(args.sources))
    # 构造计划对象
    plan_payload = {
        "plan_version": PLAN_VERSION,
        "items": plan_items,
    }
    # 写入计划文件
    write_json(args.out_plan, plan_payload)
    # 写入冲突文件
    write_json(args.out_conflicts, {"items": conflicts})
    # 打印完成信息
    print("✅ analyze complete (text-only)")
    # 返回成功状态
    return 0

# 脚本入口
if __name__ == "__main__":
    # 执行主函数并根据返回值退出
    sys.exit(main())
