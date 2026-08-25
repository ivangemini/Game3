import { describe, expect, it } from 'vitest';
import { authoredBossKeys, bossMotionSpecForArtKey } from '../src/game/ui/bossPresentation';

describe('boss presentation identity', () => {
  it('defines one presentation profile for every authored boss family', () => {
    expect(authoredBossKeys()).toEqual([
      'boss.baby-moon',
      'boss.border-shark',
      'boss.closet-monster',
      'boss.copycat-auditor',
      'boss.deadline-snail',
      'boss.tv-tyrant',
    ]);
  });

  it('keeps telegraph and impact reactions distinct across the six families', () => {
    const specs = authoredBossKeys().map((key) => bossMotionSpecForArtKey(key)!);
    expect(new Set(specs.map((spec) => spec.telegraph)).size).toBe(6);
    expect(new Set(specs.map((spec) => spec.impact)).size).toBe(6);
    expect(new Set(specs.map((spec) => spec.accent)).size).toBe(6);
  });

  it('returns no motion spec for non-authored enemies', () => {
    expect(bossMotionSpecForArtKey(null)).toBeNull();
    expect(bossMotionSpecForArtKey('boss.static-rats')).toBeNull();
  });
});
