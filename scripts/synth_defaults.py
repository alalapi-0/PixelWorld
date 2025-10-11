#!/usr/bin/env python3  # 指定使用python3解释器执行脚本
"""生成基于标签与描述的玩法默认草案"""  # 模块文档字符串描述脚本用途

import argparse  # 引入命令行参数解析库
import datetime  # 引入日期时间模块用于生成时间戳
import json  # 引入json库用于处理文本JSON数据
import math  # 引入数学库用于数值调整
from pathlib import Path  # 引入Path便于处理路径
from typing import Any, Dict, List, Tuple  # 引入类型注解提升可读性

# 预设的规则映射字典，缺少外部规则文件时使用
DEFAULT_RULES: Dict[str, Any] = {  # 定义默认规则数据结构
    "version": 1,  # 指定规则版本
    "tags_to_blueprints": [  # 蓝图匹配规则列表
        {  # 第一条蓝图规则
            "match_any": ["tile", "road"],  # 任意包含这些标签则匹配
            "blueprint": {  # 蓝图模板内容
                "id_prefix": "road",  # 蓝图ID前缀
                "tile": "ROAD",  # 对应游戏内瓷砖类型
                "name": "自动道路",  # 默认蓝图名称
                "cost_defaults": [  # 默认成本定义
                    {"id": "stone", "name": "石头", "count": 1}  # 石头1份
                ],  # 成本列表结束
            },  # 蓝图模板结束
        },  # 规则条目结束
        {  # 第二条蓝图规则
            "match_any": ["tile", "wall", "fence"],  # 栅栏墙壁类标签
            "blueprint": {  # 蓝图模板内容
                "id_prefix": "fence",  # 前缀
                "tile": "WALL",  # 瓷砖类型
                "name": "自动栅栏",  # 名称
                "cost_defaults": [  # 成本列表
                    {"id": "wood", "name": "木头", "count": 2}  # 木头成本
                ],  # 成本列表结束
            },  # 蓝图模板结束
        },  # 规则条目结束
        {  # 第三条蓝图规则
            "match_any": ["tile", "house", "building"],  # 房屋相关标签
            "blueprint": {  # 蓝图模板内容
                "id_prefix": "house",  # 前缀
                "tile": "HOUSE",  # 瓷砖类型
                "name": "自动房屋",  # 名称
                "cost_defaults": [  # 成本定义
                    {"id": "wood", "name": "木头", "count": 5},  # 木头成本
                    {"id": "stone", "name": "石头", "count": 3},  # 石头成本
                ],  # 成本列表结束
            },  # 蓝图模板结束
        },  # 规则条目结束
        {  # 第四条蓝图规则
            "match_any": ["tile", "tree", "sapling"],  # 树木相关标签
            "blueprint": {  # 蓝图模板内容
                "id_prefix": "tree",  # 前缀
                "tile": "TREE",  # 瓷砖类型
                "name": "自动树木",  # 名称
                "cost_defaults": [  # 成本列表
                    {"id": "seed", "name": "树苗", "count": 1}  # 树苗成本
                ],  # 成本列表结束
            },  # 蓝图模板结束
        },  # 规则条目结束
    ],  # 蓝图规则列表结束
    "tags_to_shop": [  # 商店规则列表
        {  # 木材商店条目
            "match_any": ["shop", "material:wood"],  # 匹配木材标签
            "goods": {  # 商品模板
                "id": "wood",  # 商品ID
                "name": "木头",  # 名称
                "kind": "material",  # 商品类别
                "basePrice": 5,  # 基础价格
                "maxStock": 99,  # 最大库存
                "buyable": True,  # 可购买
                "sellable": True,  # 可出售
            },  # 商品模板结束
        },  # 条目结束
        {  # 石头商店条目
            "match_any": ["shop", "material:stone"],  # 匹配石头标签
            "goods": {  # 商品模板
                "id": "stone",  # 商品ID
                "name": "石头",  # 名称
                "kind": "material",  # 类别
                "basePrice": 8,  # 基础价格
                "maxStock": 99,  # 最大库存
                "buyable": True,  # 可购买
                "sellable": True,  # 可出售
            },  # 商品模板结束
        },  # 条目结束
        {  # 树苗条目
            "match_any": ["shop", "seed"],  # 匹配树苗标签
            "goods": {  # 商品模板
                "id": "seed",  # 商品ID
                "name": "树苗",  # 名称
                "kind": "material",  # 类别
                "basePrice": 15,  # 基础价格
                "maxStock": 50,  # 最大库存
                "buyable": True,  # 可购买
                "sellable": False,  # 不可出售
            },  # 商品模板结束
        },  # 条目结束
    ],  # 商店规则结束
    "tags_to_quests": [  # 任务规则列表
        {  # 收集木头任务
            "match_any": ["quest", "collect:wood"],  # 匹配收集木头标签
            "quest": {  # 任务模板
                "kind": "side",  # 任务类型
                "title": "收集木头",  # 标题
                "type": "collect",  # 步骤类型
                "targetId": "wood",  # 目标物品
                "count": 10,  # 数量
                "reward": {"gold": 30},  # 奖励
            },  # 任务模板结束
        },  # 条目结束
        {  # 前往湖岸任务
            "match_any": ["quest", "reach:lake"],  # 匹配前往湖岸标签
            "quest": {  # 任务模板
                "kind": "side",  # 任务类型
                "title": "前往湖岸",  # 标题
                "type": "reach",  # 步骤类型
                "target": "lake",  # 目标地点
                "radius": 1,  # 允许半径
                "reward": {},  # 奖励占位
            },  # 任务模板结束
        },  # 条目结束
        {  # 拜访店主任务
            "match_any": ["quest", "talk:shopkeeper"],  # 匹配拜访店主标签
            "quest": {  # 任务模板
                "kind": "main",  # 任务类型
                "title": "拜访店主",  # 标题
                "type": "talk",  # 步骤类型
                "npc": "shopkeeper",  # NPC标识
                "reward": {"gold": 10},  # 奖励
            },  # 任务模板结束
        },  # 条目结束
    ],  # 任务规则结束
    "id_normalize": {  # ID归一化规则
        "strip_prefix": ["images:", "audio:"],  # 需要剥离的前缀
        "replace": [["/", "_"], [".", "_"], ["-", "_"]],  # 替换规则
    },  # 归一化规则结束
}  # 默认规则结束

# 定义类型别名提升可读性
TagsMap = Dict[str, List[str]]  # 标签映射类型
DescriptionsMap = Dict[str, str]  # 描述映射类型
CollectionsMap = Dict[str, Any]  # 集合映射类型

# 工具函数：安全读取JSON文件

def current_utc_iso() -> str:  # 定义获取UTC时间戳的函数
    return datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")  # 返回符合ISO格式并统一后缀


def load_json(path: Path, default: Any) -> Any:  # 定义读取函数
    """读取JSON文件，失败时返回默认值"""  # 函数文档字符串
    if not path.exists():  # 判断文件是否存在
        return default  # 不存在返回默认
    try:  # 尝试读取
        with path.open("r", encoding="utf-8") as handle:  # 打开文件
            return json.load(handle)  # 解析并返回
    except json.JSONDecodeError as error:  # 捕获解析错误
        raise RuntimeError(f"无法解析JSON文件: {path}: {error}")  # 抛出明确错误


# 工具函数：判断标签是否匹配规则

def rule_matches(tags: List[str], candidates: List[str]) -> bool:  # 定义匹配函数
    return any(tag in tags for tag in candidates)  # 只要有任意一个标签匹配即返回True


# 工具函数：根据规则归一化资产ID

def normalize_id(raw_id: str, rules: Dict[str, Any]) -> str:  # 定义归一化函数
    result = raw_id  # 初始化结果
    strip_prefixes = rules.get("strip_prefix", [])  # 获取需要剥离的前缀列表
    for prefix in strip_prefixes:  # 遍历前缀
        if result.startswith(prefix):  # 如果当前ID以该前缀开头
            result = result[len(prefix) :]  # 去掉前缀
    replace_rules: List[Tuple[str, str]] = rules.get("replace", [])  # 获取替换规则
    for old, new in replace_rules:  # 遍历替换规则
        result = result.replace(old, new)  # 执行替换
    return result.lower()  # 统一转为小写返回


# 工具函数：根据标签调整成本数量

def adjust_costs(costs: List[Dict[str, Any]], tags: List[str]) -> List[Dict[str, Any]]:  # 定义成本调整函数
    factor = 1.0  # 初始化调整系数
    if "cheap" in tags:  # 若标签含cheap
        factor *= 0.5  # 将系数减半
    if "expensive" in tags:  # 若标签含expensive
        factor *= 1.5  # 将系数乘以1.5
    adjusted: List[Dict[str, Any]] = []  # 初始化调整后列表
    for entry in costs:  # 遍历成本条目
        count = entry.get("count", 1)  # 获取原始数量
        new_count = max(1, int(math.ceil(count * factor)))  # 应用系数并至少为1
        cloned = dict(entry)  # 克隆条目以避免修改原对象
        cloned["count"] = new_count  # 写入新数量
        adjusted.append(cloned)  # 加入列表
    return adjusted  # 返回调整后的列表


# 根据规则生成蓝图数据

def synthesize_blueprints(
    tags: TagsMap,  # 标签映射
    descriptions: DescriptionsMap,  # 描述映射
    rules: Dict[str, Any],  # 规则数据
    report_lines: List[str],  # 报告文本列表
) -> List[Dict[str, Any]]:  # 返回蓝图列表
    blueprints: List[Dict[str, Any]] = []  # 初始化蓝图列表
    counters: Dict[str, int] = {}  # 前缀计数器字典
    blueprint_rules = rules.get("tags_to_blueprints", [])  # 获取蓝图规则
    normalize_rules = rules.get("id_normalize", {})  # 获取ID归一化配置
    hits: List[int] = [0] * len(blueprint_rules)  # 初始化规则命中统计
    for asset_id, asset_tags in tags.items():  # 遍历每个资产
        description = descriptions.get(asset_id, "")  # 获取描述文本
        for index, rule in enumerate(blueprint_rules):  # 遍历规则列表
            if not rule_matches(asset_tags, rule.get("match_any", [])):  # 若不匹配
                continue  # 跳过
            hits[index] += 1  # 记录命中次数
            template = rule.get("blueprint", {})  # 获取蓝图模板
            prefix = template.get("id_prefix", normalize_id(asset_id, normalize_rules) or "auto")  # 计算ID前缀
            counters[prefix] = counters.get(prefix, 0) + 1  # 更新计数器
            serial = counters[prefix]  # 获取序号
            blueprint_id = f"{prefix}-{serial:03d}"  # 构造蓝图ID
            name_hint = template.get("name") or description or blueprint_id  # 推断蓝图名称
            cost_template = template.get("cost_defaults", [])  # 读取成本模板
            costs = adjust_costs(cost_template, asset_tags)  # 根据标签调整成本
            blueprint_entry = {  # 构造蓝图条目
                "id": blueprint_id,  # 蓝图ID
                "name": name_hint,  # 蓝图名称
                "tile": template.get("tile", "FLOOR"),  # 指定瓷砖类型
                "source_asset": asset_id,  # 记录来源资产
                "cost": costs,  # 写入成本数组
            }  # 条目构造完成
            blueprints.append(blueprint_entry)  # 保存蓝图
    fallback_count = 0  # 初始化兜底计数
    for index, rule in enumerate(blueprint_rules):  # 遍历规则检查未命中项
        if hits[index] > 0:  # 若已有命中
            continue  # 无需兜底
        template = rule.get("blueprint", {})  # 读取模板
        prefix = template.get("id_prefix", f"auto{index}")  # 计算前缀
        counters[prefix] = counters.get(prefix, 0) + 1  # 更新计数
        serial = counters[prefix]  # 获取序号
        blueprint_id = f"{prefix}-{serial:03d}"  # 构造蓝图ID
        name_base = template.get("name") or f"自动蓝图{index + 1}"  # 基础名称
        cost_template = template.get("cost_defaults", [])  # 成本模板
        costs = adjust_costs(cost_template, [])  # 使用默认标签调整
        blueprint_entry = {  # 构造兜底蓝图
            "id": blueprint_id,  # 蓝图ID
            "name": f"{name_base}(fallback)",  # 标注为兜底
            "tile": template.get("tile", "FLOOR"),  # 指定瓷砖类型
            "source_asset": f"rule:{index}",  # 标记来源为规则
            "cost": costs,  # 写入成本
        }  # 兜底条目结束
        blueprints.append(blueprint_entry)  # 添加兜底蓝图
        fallback_count += 1  # 统计兜底数量
    report_lines.append(f"blueprints generated: {len(blueprints)}")  # 报告蓝图总数
    if fallback_count:  # 若存在兜底
        report_lines.append(f"blueprint fallback entries: {fallback_count}")  # 记录兜底数量
    return blueprints  # 返回蓝图列表


# 根据规则生成商店数据

def synthesize_shops(
    tags: TagsMap,  # 标签映射
    rules: Dict[str, Any],  # 规则数据
    report_lines: List[str],  # 报告列表
) -> List[Dict[str, Any]]:  # 返回商店列表
    goods_map: Dict[str, Dict[str, Any]] = {}  # 使用字典避免重复商品
    shop_rules = rules.get("tags_to_shop", [])  # 获取商店规则
    hits: List[int] = [0] * len(shop_rules)  # 初始化规则命中统计
    for asset_id, asset_tags in tags.items():  # 遍历资产
        for index, rule in enumerate(shop_rules):  # 遍历规则
            if not rule_matches(asset_tags, rule.get("match_any", [])):  # 若不匹配
                continue  # 跳过
            goods_template = dict(rule.get("goods", {}))  # 克隆商品模板
            if not goods_template.get("id"):  # 若缺少ID
                continue  # 跳过
            hits[index] += 1  # 记录命中
            goods_id = goods_template["id"]  # 读取ID
            goods_template.setdefault("kind", "material")  # 默认商品类别
            price = goods_template.get("basePrice", 1)  # 获取价格
            if "discount" in asset_tags:  # 折扣标签
                goods_template["basePrice"] = max(1, int(price * 0.8))  # 打折
            if "inflation" in asset_tags:  # 通胀标签
                goods_template["basePrice"] = max(1, int(math.ceil(price * 1.2)))  # 上调
            goods_template["source_asset"] = asset_id  # 记录来源资产
            goods_map[goods_id] = goods_template  # 按ID覆盖存储
    fallback_goods = 0  # 初始化兜底商品计数
    for index, rule in enumerate(shop_rules):  # 检查未命中规则
        if hits[index] > 0:  # 若已有命中
            continue  # 跳过
        goods_template = dict(rule.get("goods", {}))  # 克隆模板
        if not goods_template.get("id"):  # 没有ID
            continue  # 跳过
        goods_template.setdefault("name", goods_template["id"])  # 默认名称
        goods_template.setdefault("kind", "material")  # 默认类别
        goods_template.setdefault("basePrice", 1)  # 默认价格
        goods_template.setdefault("maxStock", 10)  # 默认库存
        goods_template["source_asset"] = f"rule:{index}"  # 标记来源
        goods_map[goods_template["id"]] = goods_template  # 写入字典
        fallback_goods += 1  # 统计兜底数量
    goods_list = list(goods_map.values())  # 转换为列表
    if not goods_list:  # 若依旧为空
        report_lines.append("no shop goods available")  # 写入报告
        return []  # 返回空列表
    shop_entry = {  # 构造商店条目
        "id": "general_store_auto",  # 商店ID
        "name": "自动杂货铺",  # 商店名称
        "type": "buySell",  # 商店类型
        "priceMultiplier": 1.0,  # 价格系数
        "goods": goods_list,  # 商品列表
    }  # 商店条目结束
    report_lines.append(f"shop goods generated: {len(goods_list)}")  # 记录数量
    if fallback_goods:  # 若存在兜底商品
        report_lines.append(f"shop fallback goods: {fallback_goods}")  # 记录数量
    return [shop_entry]  # 返回列表


# 根据规则生成任务数据

def synthesize_quests(
    tags: TagsMap,  # 标签映射
    descriptions: DescriptionsMap,  # 描述映射
    rules: Dict[str, Any],  # 规则数据
    report_lines: List[str],  # 报告列表
) -> List[Dict[str, Any]]:  # 返回任务列表
    quests: List[Dict[str, Any]] = []  # 初始化任务列表
    counters: Dict[str, int] = {}  # 任务ID计数器
    quest_rules = rules.get("tags_to_quests", [])  # 获取任务规则
    normalize_rules = rules.get("id_normalize", {})  # 获取ID归一化
    missing_coordinates = 0  # 未提供坐标的计数
    hits: List[int] = [0] * len(quest_rules)  # 初始化命中统计
    for asset_id, asset_tags in tags.items():  # 遍历资产
        description = descriptions.get(asset_id, "")  # 获取描述
        for index, rule in enumerate(quest_rules):  # 遍历规则
            if not rule_matches(asset_tags, rule.get("match_any", [])):  # 若不匹配
                continue  # 跳过
            hits[index] += 1  # 记录命中
            template = rule.get("quest", {})  # 获取任务模板
            title = template.get("title") or description or "自动任务"  # 决定标题
            base_prefix = normalize_id(title, normalize_rules) or "quest"  # 生成前缀
            counters[base_prefix] = counters.get(base_prefix, 0) + 1  # 更新序号
            quest_id = f"{base_prefix}-{counters[base_prefix]:03d}"  # 生成ID
            step_type = template.get("type", "collect")  # 获取步骤类型
            step_id = f"{quest_id}-step-1"  # 单步骤ID
            step: Dict[str, Any] = {  # 构造步骤
                "id": step_id,  # 步骤ID
                "type": step_type,  # 步骤类型
                "title": title,  # 步骤标题
            }  # 步骤结束
            if step_type == "collect":  # 如果是收集任务
                step["itemId"] = template.get("targetId", "unknown_item")  # 指定物品
                step["count"] = template.get("count", 1)  # 数量
            elif step_type == "talk":  # 如果是对话任务
                step["npcId"] = template.get("npc", "npc")  # 指定NPC
            elif step_type == "reach":  # 如果是到达任务
                step["radius"] = template.get("radius", 1)  # 半径
                if "targetX" in template and "targetY" in template:  # 若提供坐标
                    step["targetX"] = template["targetX"]  # 写入X坐标
                    step["targetY"] = template["targetY"]  # 写入Y坐标
                else:  # 未提供坐标
                    missing_coordinates += 1  # 统计缺失
                    step["desc"] = f"reach target: {template.get('target', 'unknown')}"  # 写入说明
            reward = template.get("reward", {"gold": 10})  # 奖励
            quest_entry = {  # 构造任务条目
                "id": quest_id,  # 任务ID
                "kind": template.get("kind", "side"),  # 任务类别
                "title": title,  # 任务标题
                "desc": description or title,  # 任务简介
                "steps": [step],  # 步骤列表
                "rewards": reward,  # 奖励配置
                "source_asset": asset_id,  # 标记来源资产
            }  # 任务条目结束
            quests.append(quest_entry)  # 添加到列表
    fallback_count = 0  # 初始化兜底计数
    for index, rule in enumerate(quest_rules):  # 遍历规则
        if hits[index] > 0:  # 若已有命中
            continue  # 跳过
        template = rule.get("quest", {})  # 获取模板
        title = template.get("title") or f"自动任务{index + 1}"  # 兜底标题
        base_prefix = normalize_id(title, normalize_rules) or "quest"  # 计算前缀
        counters[base_prefix] = counters.get(base_prefix, 0) + 1  # 更新序号
        quest_id = f"{base_prefix}-{counters[base_prefix]:03d}"  # 构造ID
        step_type = template.get("type", "collect")  # 获取步骤类型
        step_id = f"{quest_id}-step-1"  # 构造步骤ID
        step: Dict[str, Any] = {  # 构造兜底步骤
            "id": step_id,  # 步骤ID
            "type": step_type,  # 步骤类型
            "title": title,  # 步骤标题
        }  # 步骤结束
        if step_type == "collect":  # 收集任务兜底
            step["itemId"] = template.get("targetId", "wood")  # 默认物品
            step["count"] = template.get("count", 1)  # 默认数量
        elif step_type == "talk":  # 对话任务兜底
            step["npcId"] = template.get("npc", "villager")  # 默认NPC
        elif step_type == "reach":  # 到达任务兜底
            step["radius"] = template.get("radius", 1)  # 默认半径
            if "targetX" in template and "targetY" in template:  # 若模板含坐标
                step["targetX"] = template["targetX"]  # 写入X
                step["targetY"] = template["targetY"]  # 写入Y
            else:  # 否则
                step["desc"] = f"reach target: {template.get('target', 'unknown')}"  # 提供说明
        reward = template.get("reward", {"gold": 10})  # 默认奖励
        quest_entry = {  # 构造兜底任务
            "id": quest_id,  # 任务ID
            "kind": template.get("kind", "side"),  # 任务类别
            "title": title,  # 任务标题
            "desc": title,  # 简介
            "steps": [step],  # 步骤列表
            "rewards": reward,  # 奖励配置
            "source_asset": f"rule:{index}",  # 标记来源
        }  # 兜底条目结束
        quests.append(quest_entry)  # 添加兜底任务
        fallback_count += 1  # 累计兜底数量
    report_lines.append(f"quests generated: {len(quests)}")  # 记录数量
    if missing_coordinates:  # 若存在未提供坐标的任务
        report_lines.append(f"quests missing coordinates: {missing_coordinates}")  # 记录警告
    if fallback_count:  # 若存在兜底任务
        report_lines.append(f"quest fallback entries: {fallback_count}")  # 记录数量
    return quests  # 返回任务列表


# 写入JSON文件，确保格式统一

def write_json(path: Path, payload: Dict[str, Any]) -> None:  # 定义写入函数
    path.parent.mkdir(parents=True, exist_ok=True)  # 确保父目录存在
    with path.open("w", encoding="utf-8") as handle:  # 打开文件
        json.dump(payload, handle, ensure_ascii=False, indent=2, sort_keys=True)  # 写入格式化JSON
        handle.write("\n")  # 末尾追加换行


# 生成报告文件

def write_report(path: Path, lines: List[str]) -> None:  # 定义写报告函数
    path.parent.mkdir(parents=True, exist_ok=True)  # 创建目录
    summary = [  # 构造报告头
        "synth_defaults report",  # 标题
        f"generated_at: {current_utc_iso()}",  # 时间戳
        "note: only text outputs generated, no binary output",  # 二进制说明
    ]  # 头部列表结束
    summary.extend(lines)  # 合并详细信息
    summary.append("all outputs located under assets/auto")  # 输出路径说明
    summary.append("no binary generated by this script")  # 再次强调无二进制
    with path.open("w", encoding="utf-8") as handle:  # 打开文件
        handle.write("\n".join(summary))  # 写入文本
        handle.write("\n")  # 补充换行


# 主执行流程

def main() -> None:  # 定义主函数
    parser = argparse.ArgumentParser(description="synthesize default gameplay data")  # 创建参数解析器
    parser.add_argument("--base", type=str, default=str(Path(__file__).resolve().parents[1]), help="项目根目录路径")  # 添加基准路径参数
    args = parser.parse_args()  # 解析参数
    base_path = Path(args.base).resolve()  # 解析基准路径
    assets_path = base_path / "assets"  # 资产目录
    metadata_path = assets_path / "metadata"  # 元数据目录
    auto_path = assets_path / "auto"  # 输出目录
    preview_index_path = assets_path / "preview_index.json"  # 预览索引路径
    tags_path = metadata_path / "tags.json"  # 标签文件路径
    descriptions_path = metadata_path / "descriptions.json"  # 描述文件路径
    collections_path = metadata_path / "collections.json"  # 集合文件路径
    rules_path = base_path / "scripts" / "rules_mapping.json"  # 规则文件路径

    preview_index = load_json(preview_index_path, {})  # 读取预览索引
    tags: TagsMap = load_json(tags_path, {})  # 读取标签映射
    descriptions: DescriptionsMap = load_json(descriptions_path, {})  # 读取描述
    _collections: CollectionsMap = load_json(collections_path, {})  # 读取集合信息（目前未使用但保持读取）
    rules = load_json(rules_path, DEFAULT_RULES)  # 读取规则或使用默认

    report_lines: List[str] = []  # 初始化报告内容列表
    report_lines.append(f"preview_index sections: {len(preview_index.keys())}")  # 记录预览索引规模
    report_lines.append(f"tagged assets: {len(tags.keys())}")  # 记录标签数量

    blueprints = synthesize_blueprints(tags, descriptions, rules, report_lines)  # 生成蓝图
    shops = synthesize_shops(tags, rules, report_lines)  # 生成商店
    quests = synthesize_quests(tags, descriptions, rules, report_lines)  # 生成任务

    timestamp = current_utc_iso()  # 生成统一时间戳
    meta = {"generatedAt": timestamp, "rulesVersion": rules.get("version", 1)}  # 构造元信息

    write_json(auto_path / "blueprints_auto.json", {"meta": meta, "blueprints": blueprints})  # 写入蓝图JSON
    write_json(auto_path / "shops_auto.json", {"meta": meta, "shops": shops})  # 写入商店JSON
    write_json(auto_path / "quests_auto.json", {"meta": meta, "quests": quests})  # 写入任务JSON
    write_report(auto_path / "report.txt", report_lines)  # 写入报告文本


if __name__ == "__main__":  # 确保脚本作为主程序执行时才运行主函数
    main()  # 调用主函数
