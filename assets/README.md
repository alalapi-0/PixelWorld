# 第23轮数据说明

## 对话数据
- 存放于 `assets/dialogue/npcs/`，使用 JSON 兼容 YAML 格式，方便解析。
- 每个文件包含 `meta`、`vars`、`nodes`，供 `DialogueEngine` 载入。

## 好感度
- `assets/npc/relationship_rules.json` 定义段位、每日上限与解锁事件。
- `assets/npc/gifts.yaml` 描述 NPC 的送礼偏好标签。

## 日程
- `assets/npc/schedules.yaml` 规定 NPC 日常时间与节日覆盖。

## 节日
- `assets/festival/calendar.yaml` 列出节日日期、开放时段与奖励 ID。
- `assets/festival/rewards.json` 给出奖励的文本信息。

## 作物与田地
- `assets/farming/crops.yaml` 描述生长阶段与产出区间。
- `assets/farming/fields.json` 提供演示用的田地槽位。 
