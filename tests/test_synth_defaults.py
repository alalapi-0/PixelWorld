import json  # 引入json库读取生成文件
import subprocess  # 引入子进程库调用脚本
import sys  # 引入sys库获取python解释器路径
from pathlib import Path  # 引入Path处理路径


def test_synth_defaults_generates_expected_files(tmp_path):  # 定义测试函数
    base_dir = tmp_path / 'pixelworld'  # 创建模拟项目根目录
    (base_dir / 'assets' / 'metadata').mkdir(parents=True)  # 创建元数据目录
    preview_index_path = base_dir / 'assets' / 'preview_index.json'  # 预览索引路径
    tags_path = base_dir / 'assets' / 'metadata' / 'tags.json'  # 标签文件路径
    descriptions_path = base_dir / 'assets' / 'metadata' / 'descriptions.json'  # 描述文件路径
    collections_path = base_dir / 'assets' / 'metadata' / 'collections.json'  # 集合文件路径
    rules_path = base_dir / 'scripts'  # 规则文件目录
    rules_path.mkdir(parents=True)  # 创建规则目录
    preview_index_path.write_text(json.dumps({"images": []}), encoding='utf-8')  # 写入最小预览索引
    tags_payload = {  # 构造标签映射
        "images:tiles/road.png": ["tile", "road", "shop", "material:stone", "quest", "collect:wood"],  # 组合标签便于命中所有规则
    }  # 标签映射结束
    tags_path.write_text(json.dumps(tags_payload), encoding='utf-8')  # 写入标签文件
    descriptions_path.write_text(json.dumps({"images:tiles/road.png": "示例道路资源"}), encoding='utf-8')  # 写入描述文件
    collections_path.write_text(json.dumps({}), encoding='utf-8')  # 写入空集合

    script_path = Path(__file__).resolve().parents[1] / 'scripts' / 'synth_defaults.py'  # 计算脚本路径
    result = subprocess.run([sys.executable, str(script_path), '--base', str(base_dir)], check=True)  # 执行脚本
    assert result.returncode == 0  # 断言脚本执行成功

    auto_dir = base_dir / 'assets' / 'auto'  # 自动输出目录
    blueprints_file = auto_dir / 'blueprints_auto.json'  # 蓝图输出文件
    shops_file = auto_dir / 'shops_auto.json'  # 商店输出文件
    quests_file = auto_dir / 'quests_auto.json'  # 任务输出文件
    report_file = auto_dir / 'report.txt'  # 报告输出文件

    assert blueprints_file.exists()  # 验证蓝图文件生成
    assert shops_file.exists()  # 验证商店文件生成
    assert quests_file.exists()  # 验证任务文件生成
    assert report_file.exists()  # 验证报告文件生成

    blueprints_data = json.loads(blueprints_file.read_text(encoding='utf-8'))  # 读取蓝图内容
    shops_data = json.loads(shops_file.read_text(encoding='utf-8'))  # 读取商店内容
    quests_data = json.loads(quests_file.read_text(encoding='utf-8'))  # 读取任务内容
    report_text = report_file.read_text(encoding='utf-8')  # 读取报告文本

    assert isinstance(blueprints_data.get('blueprints'), list)  # 断言蓝图为列表
    assert isinstance(shops_data.get('shops'), list)  # 断言商店为列表
    assert isinstance(quests_data.get('quests'), list)  # 断言任务为列表
    assert 'no binary generated' in report_text.lower()  # 确认报告包含无二进制声明
