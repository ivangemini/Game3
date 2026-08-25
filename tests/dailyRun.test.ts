import { describe, expect, it } from 'vitest';
import { createDailyRunIdentity, dailyKeyFromSeed, dailyRunIdentityFromKey, isDailyRunSeed } from '../src/game/domain/dailyRun';

describe('daily run identity', () => {
  it('uses UTC dates for deterministic daily seeds', () => {
    expect(createDailyRunIdentity(new Date('2026-08-25T23:59:59.000Z'))).toEqual({ key: '2026-08-25', seed: 'daily:2026-08-25' });
    expect(createDailyRunIdentity(new Date('2026-08-26T00:00:00.000Z'))).toEqual({ key: '2026-08-26', seed: 'daily:2026-08-26' });
  });

  it('round-trips valid daily keys and seeds', () => {
    expect(dailyRunIdentityFromKey('2026-08-25')).toEqual({ key: '2026-08-25', seed: 'daily:2026-08-25' });
    expect(isDailyRunSeed('daily:2026-08-25')).toBe(true);
    expect(dailyKeyFromSeed('daily:2026-08-25')).toBe('2026-08-25');
  });

  it('rejects malformed or impossible dates', () => {
    expect(isDailyRunSeed('daily:2026-02-30')).toBe(false);
    expect(isDailyRunSeed('prototype-run-001')).toBe(false);
    expect(dailyKeyFromSeed('prototype-run-001')).toBeNull();
    expect(() => dailyRunIdentityFromKey('2026-02-30')).toThrow(RangeError);
  });
});
