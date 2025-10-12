import json  # 使用JSON解析
from pathlib import Path  # 路径操作

# 校验作物配置

def test_crop_definitions():  # 主测试
    data = json.loads(Path("assets/farming/crops.yaml").read_text(encoding="utf-8"))  # 读取作物表
    assert data, "作物配置为空"  # 不允许空配置
    valid_seasons = {"spring", "summer", "autumn", "winter"}  # 合法季节集合
    for crop_id, crop in data.items():  # 遍历作物
        seasons = {season.lower() for season in crop["seasons"]}  # 收集季节
        assert seasons <= valid_seasons, f"{crop_id} 季节非法"  # 校验季节
        stages = crop["stages"]  # 阶段数组
        assert stages, f"{crop_id} 缺少阶段"  # 阶段不能为空
        for stage in stages:  # 遍历阶段
            assert stage["days"] > 0, f"{crop_id} 阶段天数需大于0"  # 校验天数
        yield_info = crop["yield"]  # 取产出
        count = yield_info["count"]  # 数量区间
        if ".." in count:  # 如果是区间
            start, end = count.split("..")  # 拆分
            assert int(start) <= int(end), f"{crop_id} 产出区间非法"  # 区间合法
        else:  # 固定值
            assert int(count) > 0, f"{crop_id} 产出数量需为正"  # 固定数量检查
