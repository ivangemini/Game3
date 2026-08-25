import { describe, expect, it } from 'vitest';
import { registerSession } from '../src/analytics/Telemetry';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

const DAY = 24 * 60 * 60 * 1000;

describe('session return age buckets', () => {
  it('marks the first stored session as new and later sessions by coarse age only', () => {
    const storage = new MemoryStorage();
    expect(registerSession(storage, 1_000_000)).toEqual({ returning: false, returnAgeBucket: 'new' });
    expect(registerSession(storage, 1_000_000 + 2 * 60 * 60 * 1000)).toEqual({ returning: true, returnAgeBucket: 'under-24h' });
    expect(registerSession(storage, 1_000_000 + DAY)).toEqual({ returning: true, returnAgeBucket: '1-2d' });
    expect(registerSession(storage, 1_000_000 + 4 * DAY)).toEqual({ returning: true, returnAgeBucket: '3-7d' });
    expect(registerSession(storage, 1_000_000 + 12 * DAY)).toEqual({ returning: true, returnAgeBucket: '8-30d' });
    expect(registerSession(storage, 1_000_000 + 40 * DAY)).toEqual({ returning: true, returnAgeBucket: '30d-plus' });
  });

  it('uses unknown when storage is unavailable or an existing seen marker has no valid first-seen timestamp', () => {
    expect(registerSession(undefined, 1_000_000)).toEqual({ returning: false, returnAgeBucket: 'unknown' });

    const storage = new MemoryStorage();
    storage.setItem('junkpack.telemetry.seen', '1');
    expect(registerSession(storage, 2_000_000)).toEqual({ returning: true, returnAgeBucket: 'unknown' });
    expect(storage.getItem('junkpack.telemetry.first-seen-at')).toBe('2000000');
  });
});
