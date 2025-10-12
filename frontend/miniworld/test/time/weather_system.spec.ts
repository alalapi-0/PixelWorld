import { describe, expect, it } from 'vitest';
import { WeatherSystem } from '../../src/time/WeatherSystem';

describe('WeatherSystem', () => {
  it('uses chain boost when selecting next state and keeps duration in range', () => {
    const rolls = [0.95, 0, 0.9, 0.5];
    const rng = () => (rolls.shift() ?? 0.5);
    const system = new WeatherSystem('rain', 1, rng);
    const snapshots: string[] = [];
    system.onChange((snap) => {
      snapshots.push(snap.state);
    });
    const result = system.advance(2, 'spring');
    expect(snapshots.length).toBeGreaterThan(0);
    expect(result.state).toBe('storm');
    expect(result.remainHours).toBeGreaterThanOrEqual(6);
    expect(result.remainHours).toBeLessThanOrEqual(34);
  });
});
