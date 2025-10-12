import json
from pathlib import Path


def test_xp_curve_monotonic():
    config_path = Path(__file__).resolve().parents[1] / 'frontend/miniworld/assets/config/leveling.json'
    data = json.loads(config_path.read_text(encoding='utf-8'))
    xp_table = data['xpForLevel']
    max_level = data['maxLevel']
    assert len(xp_table) >= max_level + 1
    assert xp_table[0] == 0
    for earlier, later in zip(xp_table, xp_table[1:]):
        assert later >= earlier
    for idx in range(1, max_level + 1):
        assert xp_table[idx] > xp_table[idx - 1]
