#!/usr/bin/env python3
"""生成KPI汇总报告"""  # 中文模块注释
import json  # 引入JSON模块
import pathlib  # 引入路径模块
import sys  # 引入系统模块
# 空行用于分隔
ROOT = pathlib.Path(__file__).resolve().parents[1]  # 计算仓库根路径
POLICY_PATH = ROOT / 'assets' / 'agents' / 'policies.json'  # 定义策略文件路径
KPI_PATH = ROOT / 'assets' / 'agents' / 'kpi_rules.json'  # 定义KPI文件路径
# 空行用于分隔

def load_json(path: pathlib.Path) -> dict:
    """读取JSON文件"""  # 函数中文注释
    with path.open('r', encoding='utf-8') as handle:  # 打开文件
        return json.load(handle)  # 返回解析结果
# 空行用于分隔

def format_report(policies: dict, kpi: dict) -> str:
    """格式化报告文本"""  # 函数中文注释
    lines = []  # 初始化行列表
    lines.append('=== 策略约束 ===')  # 写入标题
    for key, value in policies.items():  # 遍历策略键值
        lines.append(f"{key}: {value}")  # 写入策略行
    lines.append('')  # 添加空行
    lines.append('=== 成就阈值 ===')  # 写入成就标题
    for rule in kpi.get('achievements', []):  # 遍历成就规则
        lines.append(f"{rule['id']} -> {rule['threshold']} 次 ({rule.get('title', '')})")  # 写入成就信息
    lines.append('')  # 添加空行
    lines.append('=== 任务映射 ===')  # 写入映射标题
    for mapping in kpi.get('questMappings', []):  # 遍历映射
        lines.append(f"{mapping['event']} -> {mapping['mapTo']['type']}")  # 写入映射信息
    return '\n'.join(lines)  # 返回组合字符串
# 空行用于分隔

def main() -> int:
    """脚本入口"""  # 函数中文注释
    if not POLICY_PATH.exists() or not KPI_PATH.exists():  # 检查文件存在
        print('策略或KPI文件缺失', file=sys.stderr)  # 输出错误
        return 1  # 返回错误码
    policies = load_json(POLICY_PATH)  # 读取策略
    kpi = load_json(KPI_PATH)  # 读取KPI
    report = format_report(policies, kpi)  # 构建报告
    print(report)  # 输出报告
    return 0  # 返回成功码
# 空行用于分隔

if __name__ == '__main__':  # 判断脚本入口
    sys.exit(main())  # 执行主函数
