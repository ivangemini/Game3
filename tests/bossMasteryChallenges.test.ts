import { describe, expect, it } from 'vitest';
import {
  bossMasteryChallengeNextGoal,
  evaluateBossMasteryChallenge,
} from '../src/game/domain/bossMasteryChallenges';
import {
  recordBossMasteryChallenge,
  recordBossOutcome,
} from '../src/game/domain/bossGrudges';
import type { CombatBuildItem } from '../src/game/domain/combat';
import type { Cell, ItemTag } from '../src/game/domain/types';

function item(
  instanceId: string,
  cells: readonly Cell[],
  options: {
    readonly definitionId?: string;
    readonly triggerIntervalMs?: number;
    readonly tags?: readonly ItemTag[];
    readonly damage?: number;
  } = {},
): CombatBuildItem {
  return {
    instanceId,
    definitionId: options.definitionId ?? instanceId,
    triggerIntervalMs: options.triggerIntervalMs ?? 1000,
    damage: options.damage ?? 5,
    poisonOnHit: 0,
    shieldOnTrigger: 0,
    bonusLaserShots: 0,
    extraLaserDamage: 0,
    chaosPower: 0,
    scrapArmor: 0,
    occupiedCells: cells,
    magnetic: false,
    tags: options.tags ?? [],
  };
}

function build(...items: readonly CombatBuildItem[]): ReadonlyMap<string, CombatBuildItem> {
  return new Map(items.map((entry) => [entry.instanceId, entry]));
}

describe('boss mastery counterplay challenges', () => {
  it('gives TV Tyrant three stars for five independent active threats spread across all rows', () => {
    const items = build(
      item('a', [{ x: 1, y: 0 }]), item('b', [{ x: 2, y: 1 }]),
      item('c', [{ x: 3, y: 2 }]), item('d', [{ x: 2, y: 3 }]),
      item('e', [{ x: 4, y: 4 }]),
    );
    expect(evaluateBossMasteryChallenge('tv-tyrant', items)).toMatchObject({ bossId: 'tv-tyrant', stars: 3, title: 'Signal Split' });
  });

  it('rewards Deadline Snail redundancy near the fastest trigger instead of one carry item', () => {
    const items = build(
      item('a', [{ x: 1, y: 1 }], { triggerIntervalMs: 1000 }),
      item('b', [{ x: 2, y: 1 }], { triggerIntervalMs: 1100 }),
      item('c', [{ x: 3, y: 1 }], { triggerIntervalMs: 1200 }),
      item('d', [{ x: 4, y: 1 }], { triggerIntervalMs: 1250 }),
      item('slow', [{ x: 2, y: 2 }], { triggerIntervalMs: 2200 }),
    );
    expect(evaluateBossMasteryChallenge('loop-4-deadline-snail', items)?.stars).toBe(3);
  });

  it('maps Closet Monster stars directly to loose-junk exposure', () => {
    const anchored = build(
      item('a', [{ x: 1, y: 1 }]),
      item('b', [{ x: 2, y: 1 }]),
      item('c', [{ x: 3, y: 1 }]),
    );
    const loose = build(
      item('a', [{ x: 1, y: 1 }]),
      item('b', [{ x: 4, y: 3 }]),
      item('c', [{ x: 2, y: 4 }]),
    );
    expect(evaluateBossMasteryChallenge('closet-monster', anchored)?.stars).toBe(3);
    expect(evaluateBossMasteryChallenge('closet-monster', loose)?.stars).toBe(0);
  });

  it('rewards Baby Moon tag diversification using the same affected-item concept as Tag Eclipse', () => {
    const items = build(
      item('a', [{ x: 1, y: 1 }], { tags: ['weapon'] }),
      item('b', [{ x: 2, y: 1 }], { tags: ['weapon'] }),
      item('c', [{ x: 3, y: 1 }], { tags: ['poison'] }),
      item('d', [{ x: 2, y: 2 }], { tags: ['poison'] }),
      item('e', [{ x: 3, y: 2 }], { tags: ['pet'] }),
    );
    expect(evaluateBossMasteryChallenge('baby-moon', items)).toMatchObject({ stars: 3, result: 'dominant tag hits 2 items' });
  });

  it('rewards Copycat Auditor exact-copy discipline', () => {
    const unique = build(
      item('a', [{ x: 1, y: 1 }], { definitionId: 'laser-cat' }),
      item('b', [{ x: 2, y: 1 }], { definitionId: 'mutant-duck' }),
      item('c', [{ x: 3, y: 1 }], { definitionId: 'toxic-fan' }),
    );
    const duplicates = build(
      item('a', [{ x: 1, y: 1 }], { definitionId: 'laser-cat' }),
      item('b', [{ x: 2, y: 1 }], { definitionId: 'laser-cat' }),
      item('c', [{ x: 3, y: 1 }], { definitionId: 'laser-cat' }),
      item('d', [{ x: 4, y: 1 }], { definitionId: 'laser-cat' }),
    );
    expect(evaluateBossMasteryChallenge('copycat-auditor', unique)?.stars).toBe(3);
    expect(evaluateBossMasteryChallenge('copycat-auditor', duplicates)?.stars).toBe(0);
  });

  it('rewards Border Shark layouts that move every item off the backpack perimeter', () => {
    const centered = build(
      item('a', [{ x: 1, y: 1 }]),
      item('b', [{ x: 2, y: 2 }]),
      item('c', [{ x: 4, y: 3 }]),
    );
    expect(evaluateBossMasteryChallenge('border-shark', centered)).toMatchObject({ stars: 3, result: '0 Edge Rent items' });
  });

  it('persists only the best earned challenge tier and never downgrades it', () => {
    const rivalry = recordBossOutcome([], 'tv-tyrant', 'victory', 35_000).history;
    const two = recordBossMasteryChallenge(rivalry, 'tv-tyrant', 2);
    expect(two.improved).toBe(true);
    expect(two.history[0]).toMatchObject({ wins: 1, challengeStars: 2 });

    const lower = recordBossMasteryChallenge(two.history, 'loop-3-tv-tyrant', 1);
    expect(lower.improved).toBe(false);
    expect(lower.history).toBe(two.history);

    const three = recordBossMasteryChallenge(lower.history, 'tv-tyrant', 3);
    expect(three.improved).toBe(true);
    expect(three.history[0]?.challengeStars).toBe(3);
    expect(bossMasteryChallengeNextGoal('tv-tyrant', 3)).toContain('MASTERED');
  });

  it('does not evaluate non-boss enemies', () => {
    expect(evaluateBossMasteryChallenge('static-rats', build(item('a', [{ x: 1, y: 1 }])))).toBeNull();
  });
});
