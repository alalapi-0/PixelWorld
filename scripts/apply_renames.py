#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 该脚本根据改名计划执行文件移动并同步索引
# 导入 argparse 解析命令行参数
import argparse
# 导入 json 读取与写入文本
import json
# 导入 sys 控制退出状态
import sys
# 导入 datetime 记录执行时间并使用 UTC 时区
from datetime import UTC, datetime
# 导入 pathlib 处理路径
from pathlib import Path
# 导入 typing 提供类型注解
from typing import Dict, List, Optional, Tuple

# 定义脚本根目录
SCRIPT_ROOT = Path(__file__).resolve().parent
# 定义仓库根目录
REPO_ROOT = SCRIPT_ROOT.parent
# 定义索引文件路径列表
INDEX_FILES = [
    REPO_ROOT / "assets/build/index.json",
    REPO_ROOT / "assets/preview_index.json",
]
# 定义元数据文件路径列表
METADATA_FILES = [
    REPO_ROOT / "assets/metadata/tags.json",
    REPO_ROOT / "assets/metadata/descriptions.json",
    REPO_ROOT / "assets/metadata/collections.json",
]

# 定义读取 JSON 的辅助函数
def load_json(path: Path) -> Optional[Dict]:
    """读取 JSON 文件"""
    # 如果文件不存在则返回 None
    if not path.exists():
        return None
    # 返回解析后的对象
    return json.loads(path.read_text(encoding="utf-8"))

# 定义写入 JSON 的辅助函数
def dump_json(path: Path, data: Dict) -> None:
    """写入 JSON 文件"""
    # 确保父目录存在
    path.parent.mkdir(parents=True, exist_ok=True)
    # 写入带缩进的中文 JSON
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

# 定义相对路径转换函数
def to_repo_path(path_str: str) -> Path:
    """将计划中的相对路径转换为仓库绝对路径"""
    # 直接拼接仓库根目录
    return (REPO_ROOT / path_str).resolve()

# 定义构建替换表的函数
def build_replacements(pairs: List[Tuple[Path, Path, str]]) -> Dict[str, str]:
    """根据执行的重命名构建替换映射"""
    # 初始化映射字典
    replacements: Dict[str, str] = {}
    # 遍历所有重命名对
    for src, dst, kind in pairs:
        # 初始化变量
        src_rel_str = None
        dst_rel_str = None
        # 计算相对于 build 目录的路径
        try:
            src_rel_build = src.relative_to(REPO_ROOT / "assets/build")
            dst_rel_build = dst.relative_to(REPO_ROOT / "assets/build")
            src_rel_str = str(src_rel_build).replace("\\", "/")
            dst_rel_str = str(dst_rel_build).replace("\\", "/")
        except ValueError:
            # 当源文件不在 build 下时，尝试从 user_imports 推断
            try:
                src_rel_user = src.relative_to(REPO_ROOT / "assets/user_imports")
                dst_rel_build = dst.relative_to(REPO_ROOT / "assets/build")
            except ValueError:
                continue
            src_rel_str = str(src_rel_user).replace("\\", "/")
            dst_rel_str = str(dst_rel_build).replace("\\", "/")
        # 记录基本相对路径替换
        replacements[src_rel_str] = dst_rel_str
        # 记录带 assets/build 前缀的路径
        replacements[f"assets/build/{src_rel_str}"] = f"assets/build/{dst_rel_str}"
        # 记录 metadata 键格式（images:xxx/yyy 或 audio:xxx/yyy）
        if "/" in src_rel_str:
            top, rest = src_rel_str.split("/", 1)
            replacements[f"{top}:{rest}"] = f"{top}:{dst_rel_str.split('/', 1)[1]}"
        # 根据分类类型推测原有 build 路径
        if kind and "." in kind:
            category_top, category_sub = kind.split(".", 1)
            if category_top in {"images", "audio"}:
                legacy_rel = f"{category_top}/{category_sub}/{src.name}"
                replacements.setdefault(legacy_rel, dst_rel_str)
                replacements.setdefault(f"assets/build/{legacy_rel}", f"assets/build/{dst_rel_str}")
                replacements.setdefault(
                    f"{category_top}:{legacy_rel.split('/', 1)[1]}",
                    f"{category_top}:{dst_rel_str.split('/', 1)[1]}",
                )
    # 返回替换映射
    return replacements

# 定义在结构中替换字符串的函数
def replace_in_structure(obj, mapping: Dict[str, str]):
    """递归替换 JSON 中的路径字符串"""
    # 处理字典情况
    if isinstance(obj, dict):
        # 对值递归替换
        return {key: replace_in_structure(value, mapping) for key, value in obj.items()}
    # 处理列表情况
    if isinstance(obj, list):
        # 逐个元素替换
        return [replace_in_structure(item, mapping) for item in obj]
    # 处理字符串情况
    if isinstance(obj, str):
        # 标准化斜杠
        normalized = obj.replace("\\", "/")
        # 若映射存在则返回替换
        return mapping.get(normalized, obj)
    # 其他类型保持原值
    return obj

# 定义更新索引文件的函数
def update_index_files(replacements: Dict[str, str]) -> None:
    """更新 index 与 preview JSON"""
    # 遍历索引文件
    for path in INDEX_FILES:
        # 读取数据
        data = load_json(path)
        # 若不存在则跳过
        if data is None:
            continue
        # 替换结构中的字符串
        updated = replace_in_structure(data, replacements)
        # 写回文件
        dump_json(path, updated)

# 定义更新元数据文件的函数
def update_metadata_files(replacements: Dict[str, str]) -> None:
    """更新 tags/collections/descriptions 键值"""
    # 遍历元数据文件
    for path in METADATA_FILES:
        # 读取数据
        data = load_json(path)
        # 若不存在则跳过
        if data is None:
            continue
        # 处理字典键替换
        new_dict = {}
        for key, value in data.items():
            normalized_key = key.replace("\\", "/")
            new_key = replacements.get(normalized_key, normalized_key)
            # 如果值是列表或字典也要替换内容
            new_value = replace_in_structure(value, replacements)
            new_dict[new_key] = new_value
        # 写回文件
        dump_json(path, new_dict)

# 定义打印摘要的函数
def print_summary(success: int, skipped: int, failed: int) -> None:
    """输出执行摘要"""
    # 打印统计信息
    print(f"Summary: success={success}, skipped={skipped}, failed={failed}")

# 定义执行计划的函数
def execute_plan(plan_path: Path, apply: bool) -> int:
    """执行改名计划"""
    # 读取计划
    plan = load_json(plan_path)
    # 若计划不存在则报错
    if plan is None:
        print("计划文件不存在", file=sys.stderr)
        return 1
    # 获取项目列表
    items = plan.get("items", [])
    # 初始化统计
    success = 0
    skipped = 0
    failed = 0
    # 记录实际操作列表
    performed: List[Tuple[Path, Path, str]] = []
    # 遍历计划项目
    for entry in items:
        # 解析路径
        src_path = to_repo_path(entry["src"])
        dst_path = to_repo_path(entry["dst"])
        # 输出预览信息
        print(f"{('[APPLY]' if apply else '[DRY]')} {src_path} -> {dst_path}")
        # 检查源文件
        if not src_path.exists():
            print("  !! 源文件不存在，跳过")
            failed += 1
            continue
        # 如果目标与源相同则跳过
        if src_path == dst_path:
            print("  .. 目标路径相同，跳过")
            skipped += 1
            continue
        # 若未开启 apply 则仅计数
        if not apply:
            success += 1
            continue
        # 确保目标父目录存在
        dst_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            # 执行重命名
            src_path.rename(dst_path)
            # 记录成功
            success += 1
            # 保存操作记录
            performed.append((src_path, dst_path, entry.get("type", "")))
        except OSError as error:
            # 捕获异常
            print(f"  !! 重命名失败: {error}")
            failed += 1
    # 如果是实际执行并且有操作
    if apply and performed:
        # 构建替换映射
        replacements = build_replacements(performed)
        # 更新索引文件
        update_index_files(replacements)
        # 更新元数据文件
        update_metadata_files(replacements)
        # 输出成功提示
        print("✅ index/metadata references updated")
        # 写入回滚日志
        revert_log = {
            "version": 1,
            # 使用 UTC 确保时间跨平台一致
            "executed_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
            "items": [
                {
                    "src": str(src.relative_to(REPO_ROOT)),
                    "dst": str(dst.relative_to(REPO_ROOT)),
                }
                for src, dst, _ in performed
            ],
        }
        dump_json(REPO_ROOT / "assets/rename/revert_log.json", revert_log)
    # 输出摘要
    print_summary(success, skipped, failed)
    # 打印模式提示
    if apply:
        print("✅ rename applied (no binary modifications)")
    else:
        print("✅ dry-run complete (no changes made)")
    # 根据失败数量返回状态
    return 0 if failed == 0 else 1

# 定义回滚函数
def revert_changes(log_path: Path) -> int:
    """根据回滚日志恢复文件"""
    # 读取日志
    log = load_json(log_path)
    # 若日志不存在
    if log is None:
        print("回滚日志不存在", file=sys.stderr)
        return 1
    # 获取条目
    items = log.get("items", [])
    # 初始化统计
    success = 0
    skipped = 0
    failed = 0
    # 按逆序恢复
    for entry in reversed(items):
        # 计算路径
        dst_path = to_repo_path(entry["dst"])
        src_path = to_repo_path(entry["src"])
        # 打印信息
        print(f"[REVERT] {dst_path} -> {src_path}")
        # 检查目标是否存在
        if not dst_path.exists():
            print("  !! 当前文件缺失，无法回滚")
            failed += 1
            continue
        # 确保父目录存在
        src_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            # 执行回滚
            dst_path.rename(src_path)
            success += 1
        except OSError as error:
            print(f"  !! 回滚失败: {error}")
            failed += 1
    # 输出摘要
    print_summary(success, skipped, failed)
    # 打印完成提示
    print("✅ revert complete (no binary modifications)")
    # 返回状态
    return 0 if failed == 0 else 1

# 定义主函数
def main(argv: Optional[List[str]] = None) -> int:
    """脚本入口"""
    # 构造参数解析器
    parser = argparse.ArgumentParser(description="Apply asset rename plan")
    # 添加计划参数
    parser.add_argument("--plan", type=Path, help="改名计划 JSON")
    # 添加执行开关
    parser.add_argument("--apply", action="store_true", help="执行改名而非干跑")
    # 添加回滚参数
    parser.add_argument("--revert", type=Path, help="回滚日志 JSON")
    # 解析参数
    args = parser.parse_args(argv)
    # 如果提供回滚则执行回滚逻辑
    if args.revert:
        return revert_changes(args.revert)
    # 没有回滚时需要 plan
    if not args.plan:
        parser.error("必须提供 --plan 或 --revert 之一")
    # 执行计划
    return execute_plan(args.plan, args.apply)

# 入口判断
if __name__ == "__main__":
    # 调用主函数并根据返回值退出
    sys.exit(main())
