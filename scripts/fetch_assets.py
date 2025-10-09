"""脚本：根据外部素材目录生成本地占位目录或下载CC0资源。"""  # 中文docstring说明脚本用途
from __future__ import annotations  # 引入未来注解特性方便类型标注

import argparse  # 导入参数解析库用于命令行选项
import json  # 导入JSON库以读取素材目录
from pathlib import Path  # 导入Path方便处理路径
from typing import Dict, Any  # 导入类型标注辅助说明结构


def slugify(name: str) -> str:  # 定义名称到目录安全字符串的转换函数
    """将素材名称转换为适合作为目录名的短横线风格。"""  # 函数用途中文描述
    return name.lower().replace(" ", "-").replace("/", "-")  # 简单替换空格和斜杠


def load_catalog(catalog_path: Path) -> Dict[str, Any]:  # 载入外部目录并返回字典
    """读取 external_catalog.json 并返回解析后的数据。"""  # 中文docstring说明
    with catalog_path.open("r", encoding="utf-8") as catalog_file:  # 打开JSON文件
        return json.load(catalog_file)  # 解析JSON数据


def render_license_section(source: Dict[str, Any]) -> str:  # 渲染许可证片段
    """根据单个素材源生成许可证说明文本。"""  # docstring说明
    lines = [  # 构建文本行列表
        f"## {source.get('name', '未知来源')}",  # 标题行包含名称
        f"- 许可：{source.get('license', '未知')}",  # 许可信息
        f"- 主页：{source.get('homepage', '未知')}"  # 主页链接
    ]  # 列表结尾
    download = source.get("download")  # 读取下载字段
    notes = source.get("notes")  # 读取备注字段
    if download:  # 若存在直接下载链接
        lines.append(f"- 下载链接：{download}")  # 添加下载链接说明
    if notes:  # 若存在备注
        lines.append(f"- 备注：{notes}")  # 添加备注信息
    lines.append("")  # 添加空行便于分隔
    return "\n".join(lines)  # 返回拼接好的字符串


def ensure_placeholder(target_dir: Path, dry_run: bool) -> None:  # 确保占位文件存在
    """在目标目录中放置占位符提示用户下载素材。"""  # 中文描述
    placeholder_file = target_dir / ".placeholder"  # 定义占位文件路径
    if dry_run:  # 若为干跑模式
        print(f"[干跑] 需要在 {target_dir} 创建 {placeholder_file.name}")  # 输出提示
        return  # 返回不执行写入
    target_dir.mkdir(parents=True, exist_ok=True)  # 创建目录
    if not placeholder_file.exists():  # 若占位文件不存在
        placeholder_file.write_text("此处放置从外部下载的CC0素材。", encoding="utf-8")  # 写入提示文字
        print(f"已生成占位文件：{placeholder_file}")  # 输出创建信息
    else:  # 否则
        print(f"占位文件已存在：{placeholder_file}")  # 输出已存在信息


def main() -> None:  # 主函数入口
    """解析命令行参数并根据目录生成素材占位或下载资源。"""  # 中文描述
    parser = argparse.ArgumentParser(description="拉取或初始化CC0素材目录。")  # 构建解析器
    parser.add_argument("--only-cc0", action="store_true", help="仅处理许可为CC0的来源。")  # 添加仅CC0选项
    parser.add_argument("--dry-run", action="store_true", help="仅输出操作步骤不实际写入。")  # 添加干跑选项
    parser.add_argument("--dest", default="assets/build", help="素材输出目录，默认assets/build。")  # 添加目标目录选项
    args = parser.parse_args()  # 解析命令行参数

    catalog_path = Path("assets/external_catalog.json")  # 定义目录文件路径
    if not catalog_path.exists():  # 若目录文件不存在
        raise FileNotFoundError("未找到 assets/external_catalog.json，请先创建目录配置。")  # 抛出异常
    catalog = load_catalog(catalog_path)  # 读取目录数据

    dest_root = Path(args.dest)  # 解析目标根目录
    if args.dry_run:  # 若为干跑模式
        print(f"[干跑] 将在 {dest_root} 下准备素材目录。")  # 输出提示
    else:  # 否则
        dest_root.mkdir(parents=True, exist_ok=True)  # 创建目标根目录

    sources = catalog.get("sources", [])  # 获取来源列表
    license_sections = ["# 资产许可清单", ""]  # 初始化许可证文档内容
    for source in sources:  # 遍历每个来源
        license_type = source.get("license", "未知")  # 获取许可类型
        if args.only_cc0 and license_type != "CC0":  # 若仅处理CC0且当前来源不是CC0
            print(f"跳过非CC0资源：{source.get('name', '未知来源')}")  # 输出跳过信息
            continue  # 跳过处理
        target_dir = dest_root / slugify(source.get("name", "unnamed"))  # 计算目标目录
        ensure_placeholder(target_dir, args.dry_run)  # 确保占位文件
        license_sections.append(render_license_section(source))  # 添加许可证片段
        print(f"资源目录就绪：{target_dir}")  # 输出目录信息

    licenses_path = Path("assets/licenses/ASSETS_LICENSES.md")  # 定义许可证文件路径
    if args.dry_run:  # 若干跑
        print("[干跑] 将更新许可证文件内容。")  # 输出提示
    else:  # 否则
        licenses_path.parent.mkdir(parents=True, exist_ok=True)  # 确保目录存在
        licenses_path.write_text("\n".join(license_sections), encoding="utf-8")  # 写入许可证信息
        print(f"已更新许可证文件：{licenses_path}")  # 输出成功信息

    print("操作完成。")  # 输出结束提示


if __name__ == "__main__":  # 入口判断
    main()  # 调用主函数
