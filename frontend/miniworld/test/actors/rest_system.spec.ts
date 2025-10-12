import { describe, expect, it } from 'vitest';
import { RestSystem } from '../../src/actors/RestSystem';
import { Stats } from '../../src/actors/Stats';

describe('RestSystem', () => {
  it('advances time to the next target and restores stamina', () => {
    const stats = new Stats({ staminaMax: 40, hpMax: 30, carryCap: 20 });
    stats.spendStamina(30);
    let current = { minute: 45, hour: 22, day: 3, weekDay: 2, season: 'spring' as const, year: 1 };
    const adapter = {
      getState: () => current,
      applyState: (state: typeof current) => {
        current = { ...state };
      },
    };
    const system = new RestSystem(stats, adapter);
    const result = system.sleep('dawn', 'bed');
    expect(result.minutesPassed).toBeGreaterThan(0);
    expect(current.hour).toBe(6);
    expect(stats.getStamina()).toBeGreaterThan(10);
    const sameDay = adapter.getState();
    expect(sameDay.day).toBeGreaterThanOrEqual(4);
  });
});
