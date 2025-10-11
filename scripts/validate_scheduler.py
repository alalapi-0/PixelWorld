#!/usr/bin/env python3
"""校验 scheduler.json：依赖环、时间冲突、资源冲突。"""
import datetime  # 引入日期时间模块
import json  # 引入JSON解析
import pathlib  # 引入路径工具
import sys  # 引入系统模块
from typing import Dict, List, Set  # 引入类型注解

BASE = pathlib.Path(__file__).resolve().parents[1]  # 计算仓库根目录
SCHED_PATH = BASE / 'assets' / 'scheduler' / 'scheduler.json'  # 排程文件路径
POLICY_PATH = BASE / 'assets' / 'agents' / 'policies.json'  # 策略文件路径

if not SCHED_PATH.exists():  # 如果排程文件缺失
    print('缺少 scheduler.json', file=sys.stderr)  # 输出错误
    sys.exit(1)  # 返回错误码

scheduler = json.loads(SCHED_PATH.read_text(encoding='utf-8'))  # 读取排程
policies = json.loads(POLICY_PATH.read_text(encoding='utf-8')) if POLICY_PATH.exists() else {}  # 读取策略

errors: List[str] = []  # 存放错误列表

# 依赖环检测
edges: Dict[str, List[str]] = {}  # 构造依赖图
for task in scheduler.get('tasks', []):  # 遍历任务
    edges[task['id']] = task.get('dependsOn', [])  # 记录依赖列表

visiting: Set[str] = set()  # DFS中的访问栈
visited: Set[str] = set()  # 已访问集合

def dfs(node: str) -> bool:  # 定义深度优先检测函数
    if node in visiting:  # 如果节点在栈中
        return True  # 检测到环
    if node in visited:  # 如果已经检查过
        return False  # 无需重复
    visiting.add(node)  # 标记节点在访问栈中
    for dep in edges.get(node, []):  # 遍历依赖
        if dfs(dep):  # 递归检测
            return True  # 传播环信息
    visiting.remove(node)  # 移除访问栈标记
    visited.add(node)  # 标记为已访问
    return False  # 未发现环

for task_id in edges:  # 遍历所有节点
    if dfs(task_id):  # 如果检测到环
        errors.append(f'依赖环: {task_id}')  # 记录错误
        break  # 发现环即可停止

# 时间冲突检测
work_hours = policies.get('workHours', '00:00-23:59')  # 读取工作时段
curfew = policies.get('curfew')  # 读取宵禁
holidays = set(policies.get('holiday', []))  # 读取假日列表

work_start, work_end = work_hours.split('-')  # 拆分工作时段
work_start_minutes = int(work_start[:2]) * 60 + int(work_start[3:5])  # 转换为分钟
work_end_minutes = int(work_end[:2]) * 60 + int(work_end[3:5])  # 转换为分钟

curfew_start = curfew.split('-')[0] if curfew else None  # 获取宵禁开始
curfew_end = curfew.split('-')[1] if curfew else None  # 获取宵禁结束
curfew_start_min = int(curfew_start[:2]) * 60 + int(curfew_start[3:5]) if curfew_start else None  # 宵禁开始分钟
curfew_end_min = int(curfew_end[:2]) * 60 + int(curfew_end[3:5]) if curfew_end else None  # 宵禁结束分钟

def in_curfew(minute: int) -> bool:  # 判断分钟是否处于宵禁
    if curfew_start_min is None and curfew_end_min is None:  # 如果未配置
        return False  # 不受限制
    if curfew_start_min is not None and curfew_end_min is not None:  # 两端均存在
        if curfew_start_min <= curfew_end_min:  # 未跨日
            return curfew_start_min <= minute < curfew_end_min  # 判断区间
        return minute >= curfew_start_min or minute < curfew_end_min  # 跨日判断
    if curfew_start_min is not None:  # 仅有开始
        return minute >= curfew_start_min  # 判断是否晚于开始
    if curfew_end_min is not None:  # 仅有结束
        return minute < curfew_end_min  # 判断是否早于结束
    return False  # 默认不在宵禁

for task in scheduler.get('tasks', []):  # 遍历任务
    start = datetime.datetime.fromisoformat(task['start'].replace('Z', '+00:00'))  # 解析开始时间
    duration = task.get('durationMin') or (task.get('durationHr', 0) * 60)  # 获取持续时间
    end = start + datetime.timedelta(minutes=duration)  # 计算结束时间
    if start.date().isoformat() in holidays:  # 如果处于假日
        errors.append(f"假日冲突: {task['id']}")  # 记录错误
        continue  # 跳过后续判断
    start_minute = start.hour * 60 + start.minute  # 计算开始分钟
    end_minute = end.hour * 60 + end.minute  # 计算结束分钟
    if start_minute < work_start_minutes or end_minute > work_end_minutes:  # 判断是否超出工作时段
        errors.append(f"工作时间冲突: {task['id']}")  # 记录错误
    if in_curfew(start_minute) or in_curfew(end_minute % (24 * 60)):  # 判断是否触发宵禁
        errors.append(f"宵禁冲突: {task['id']}")  # 记录错误

# 资源冲突检测
rows: Dict[str, List[tuple]] = {}  # 记录每个行的任务区间
for task in scheduler.get('tasks', []):  # 遍历任务
    start = datetime.datetime.fromisoformat(task['start'].replace('Z', '+00:00'))  # 解析开始
    duration = task.get('durationMin') or (task.get('durationHr', 0) * 60)  # 获取持续时间
    end = start + datetime.timedelta(minutes=duration)  # 计算结束
    rows.setdefault(task['rowId'], []).append((start, end, task['id']))  # 按行保存

for row_id, intervals in rows.items():  # 遍历每个资源行
    intervals.sort(key=lambda item: item[0])  # 按开始时间排序
    for i in range(1, len(intervals)):  # 遍历相邻区间
        prev_end = intervals[i - 1][1]  # 前一个结束时间
        current_start = intervals[i][0]  # 当前开始时间
        if current_start < prev_end:  # 如果重叠
            errors.append(f"资源冲突: {row_id} -> {intervals[i - 1][2]} 与 {intervals[i][2]}")  # 记录冲突

if errors:  # 如果存在错误
    print('排程校验失败:')  # 输出标题
    for issue in errors:  # 遍历错误
        print(f'- {issue}')  # 输出错误详情
    sys.exit(1)  # 返回错误码

print('排程校验通过')  # 如果无错误则输出成功
