"""时间策略单元测试"""  # 中文模块说明
import json  # 引入JSON模块
import pathlib  # 引入路径模块
import subprocess  # 引入子进程模块
# 空行用于分隔
ROOT = pathlib.Path(__file__).resolve().parents[1]  # 计算仓库根目录
POLICY_PATH = ROOT / 'assets' / 'agents' / 'policies.json'  # 策略文件路径
KPI_SCRIPT = ROOT / 'scripts' / 'export_kpi_report.py'  # KPI脚本路径
# 空行用于分隔

def test_policy_time_window():
    """验证策略时间窗口"""  # 测试中文注释
    with POLICY_PATH.open('r', encoding='utf-8') as handle:  # 打开策略文件
        data = json.load(handle)  # 读取JSON
    assert data['workHours'] == '08:00-18:00'  # 断言工作时间
    assert data['curfew'] == '22:00-06:00'  # 断言宵禁时间
# 空行用于分隔

def test_export_kpi_report_runs():
    """验证KPI导出脚本可执行"""  # 测试中文注释
    result = subprocess.run(['python3', str(KPI_SCRIPT)], capture_output=True, text=True, check=False)  # 执行脚本
    assert result.returncode == 0  # 断言执行成功
    assert '道路工匠' in result.stdout  # 报告包含成就标题
