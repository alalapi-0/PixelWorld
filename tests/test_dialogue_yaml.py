import json  # 使用JSON解析兼容的YAML文本
from pathlib import Path  # 处理路径

# 检查每个对话文件结构

def load_dialogue(path: Path):  # 加载对话文件
    return json.loads(path.read_text(encoding="utf-8"))  # 解析JSON文本


def test_dialogue_nodes():  # 测试节点完整性
    folder = Path("assets/dialogue/npcs")  # 对话目录
    files = list(folder.glob("*.yaml"))  # 收集文件列表
    assert files, "缺少对话文件"  # 必须存在文件
    for file_path in files:  # 遍历文件
        data = load_dialogue(file_path)  # 读取内容
        assert "meta" in data, f"{file_path} 缺少 meta"  # 校验元数据
        assert "nodes" in data, f"{file_path} 缺少 nodes"  # 校验节点集
        nodes = data["nodes"]  # 取节点字典
        assert "start" in nodes, f"{file_path} 缺少 start 节点"  # 必须有起始
        for node_id, node in nodes.items():  # 遍历节点
            assert "text" in node, f"{file_path} 节点 {node_id} 缺少 text"  # 校验文本
            if "choices" in node:  # 如果存在选项
                for choice in node["choices"]:  # 遍历选项
                    assert "text" in choice, f"{file_path} 节点 {node_id} 选项缺少文本"  # 校验选项文本
                    if "next" in choice:  # 如果存在跳转
                        assert choice["next"] in nodes, f"{file_path} 节点 {node_id} 指向未知节点"  # 校验引用
            if node.get("next"):  # 存在默认跳转
                assert node["next"] in nodes, f"{file_path} 节点 {node_id} 默认跳转未知"  # 校验跳转
