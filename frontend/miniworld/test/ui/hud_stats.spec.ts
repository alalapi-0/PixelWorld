import { describe, expect, it } from 'vitest';
import { Stats } from '../../src/actors/Stats';
import { XPSystem } from '../../src/actors/XPSystem';
import { HUDStats } from '../../src/ui/HUDStats';

describe('HUDStats', () => {
  it('reflects stat and xp changes in the rendered string', () => {
    const stats = new Stats({ level: 1, xp: 0, staminaMax: 30, hpMax: 30, carryCap: 10 });
    const xp = new XPSystem(stats);
    const hud = new HUDStats(stats, xp);
    expect(hud.getDisplay()).toContain('[LV1]');
    xp.addXP('questComplete');
    const afterQuest = hud.getDisplay();
    expect(afterQuest).toContain('XP:');
    stats.spendStamina(10);
    const afterSpend = hud.getDisplay();
    expect(afterSpend).toContain('STA:');
  });
});
