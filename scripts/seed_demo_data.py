#!/usr/bin/env python3  # 指定解释器
"""文本数据种子脚本"""  # 模块说明
from pathlib import Path  # 引入路径模块
import json  # 引入JSON解析

# 定义需要验证的文件路径
REQUIRED_FILES = [  # 必要文件列表
    Path("assets/dialogue/npcs/shopkeeper.yaml"),  # 店主对话
    Path("assets/farming/crops.yaml"),  # 作物表
    Path("assets/festival/calendar.yaml")  # 节日日历
]  # 列表结束


def main() -> None:  # 主函数
    for file_path in REQUIRED_FILES:  # 遍历文件
        if not file_path.exists():  # 如果缺失
            raise SystemExit(f"缺少示例文件: {file_path}")  # 抛出错误
        if file_path.suffix == ".yaml":  # 针对YAML
            json.loads(file_path.read_text(encoding="utf-8"))  # 尝试解析
    print("示例数据已就绪，无需重新生成。")  # 输出提示


if __name__ == "__main__":  # 入口判断
    main()  # 执行主函数
