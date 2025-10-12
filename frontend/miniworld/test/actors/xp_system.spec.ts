import { describe, expect, it, vi } from 'vitest';
import { Stats } from '../../src/actors/Stats';
import { XPSystem } from '../../src/actors/XPSystem';

describe('XPSystem', () => {
  it('applies rewards when leveling up through multiple sources', () => {
    const stats = new Stats({ level: 1, xp: 0, staminaMax: 30, hpMax: 30, carryCap: 20 });
    const xpSystem = new XPSystem(stats);
    const listener = vi.fn();
    xpSystem.onLevelUp(listener);
    xpSystem.addXP('buildHouse');
    expect(stats.getXP()).toBeGreaterThan(0);
    expect(stats.getLevel()).toBe(1);
    xpSystem.addXP('buildHouse', 500);
    expect(stats.getLevel()).toBeGreaterThan(1);
    expect(listener).toHaveBeenCalled();
    expect(stats.getBaseStaminaMax()).toBeGreaterThan(30);
    expect(stats.getHPMax()).toBeGreaterThan(30);
    const progress = xpSystem.getXpProgress();
    expect(progress.current).toBeGreaterThanOrEqual(0);
  });
});
