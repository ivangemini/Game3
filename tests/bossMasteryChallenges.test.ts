import { describe, expect, it } from 'vitest';
import {
  BOSS_MASTERY_CHALLENGES,
  bossMasteryChallengeStarCount,
  completeBossMasteryChallenges,
  evaluateBossMasteryChallenges,
  normalizeBossMasteryChallengeIds,
} from '../src/game/domain/bossMasteryChallenges';
import { BOSS_FAMILY_IDS } from '../src/game/domain/bossGrudges';
import type { CombatBuildItem } from '../src/game/domain/combat';
import type { Cell, ItemTag } from '../src/game/domain/types';

function item(
  instanceId: string,
  definitionId: string,
  triggerIntervalMs: number,
  cells: readonly Cell[],
  tags: readonly ItemTag[] = ['device'],
): CombatBuildItem {
  return {
    instanceId,
    definitionId,
    triggerIntervalMs,
    damage: 10,
    poisonOnHit: 0,
    shieldOnTrigger: 0,
    bonusLaserShots: 0,
    extraLaserDamage: 10,
    chaosPower: 0,
    scrapArmor: 0,
    occupiedCells: cells,
    magnetic: tags.includes('metal'),
    tags,
  };
}

function map(items: readonly CombatBuildItem[]): ReadonlyMap<string, CombatBuildItem> {
  return new Map(items.map((entry) => [entry.instanceId, entry]));
}

describe('boss mastery counterplay challenges', () => {
  it('defines exactly three unique stars for every boss family', () => {
    expect(BOSS_MASTERY_CHALLENGES).toHaveLength(18);
    expect(new Set(BOSS_MASTERY_CHALLENGES.map((challenge) => challenge.id)).size).toBe(18);
    for (const bossId of BOSS_FAMILY_IDS) {
      const bossChallenges = BOSS_MASTERY_CHALLENGES.filter((challenge) => challenge.bossId === bossId);
      expect(bossChallenges.map((challenge) => challenge.star)).toEqual([1, 2, 3]);
    }
  });

  it('rewards TV Tyrant redundancy, row spread and a linked mesh', () => {
    const items = map([
      item('a', 'a', 1000, [{ x: 1, y: 0 }], ['weapon']),
      item('b', 'b', 1100, [{ x: 2, y: 1 }], ['device']),
      item('c', 'c', 1200, [{ x: 3, y: 2 }], ['poison']),
      item('d', 'd', 1300, [{ x: 4, y: 3 }], ['pet']),
    ]);
    const evaluation = evaluateBossMasteryChallenges('tv-tyrant', { items, synergyConnectionCount: 4 });
    expect(evaluation.passedChallengeIds).toEqual([
      'tv-backup-channel',
      'tv-split-signal',
      'tv-mesh-network',
    ]);

    const rowStacked = map([
      item('a', 'a', 1000, [{ x: 0, y: 2 }]),
      item('b', 'b', 1100, [{ x: 1, y: 2 }]),
      item('c', 'c', 1200, [{ x: 2, y: 2 }]),
      item('d', 'd', 1300, [{ x: 3, y: 2 }]),
    ]);
    expect(evaluateBossMasteryChallenges('tv-tyrant', { items: rowStacked, synergyConnectionCount: 1 }).passedChallengeIds)
      .toEqual(['tv-backup-channel']);
  });

  it('measures Deadline Snail counterplay from near-fast trigger backups', () => {
    const items = map([
      item('a', 'a', 1000, [{ x: 0, y: 0 }]),
      item('b', 'b', 1200, [{ x: 1, y: 0 }]),
      item('c', 'c', 1380, [{ x: 2, y: 0 }]),
      item('d', 'd', 1520, [{ x: 3, y: 0 }]),
      item('e', 'e', 2200, [{ x: 4, y: 0 }]),
    ]);
    const evaluation = evaluateBossMasteryChallenges('deadline-snail', { items, synergyConnectionCount: 0 });
    expect(evaluation.metrics.nearFast25Count).toBe(2);
    expect(evaluation.metrics.nearFast40Count).toBe(3);
    expect(evaluation.metrics.nearFast55Count).toBe(4);
    expect(evaluation.passedChallengeIds).toEqual([
      'snail-twin-clocks',
      'snail-triple-shift',
      'snail-clock-union',
    ]);
  });

  it('uses side-contact anchoring for Closet Monster mastery', () => {
    const connected = map([
      item('a', 'a', 1000, [{ x: 1, y: 1 }]),
      item('b', 'b', 1100, [{ x: 2, y: 1 }]),
      item('c', 'c', 1200, [{ x: 3, y: 1 }]),
      item('d', 'd', 1300, [{ x: 4, y: 1 }]),
    ]);
    const clean = evaluateBossMasteryChallenges('closet-monster', { items: connected, synergyConnectionCount: 0 });
    expect(clean.metrics.looseItemCount).toBe(0);
    expect(clean.passedChallengeIds).toEqual([
      'closet-tidy-enough',
      'closet-neat-freak',
      'closet-zero-clutter',
    ]);
  });

  it('rewards tag diversification against Baby Moon eclipse', () => {
    const diverse = map([
      item('a', 'a', 1000, [{ x: 0, y: 0 }], ['weapon', 'metal']),
      item('b', 'b', 1100, [{ x: 1, y: 0 }], ['device', 'battery']),
      item('c', 'c', 1200, [{ x: 2, y: 0 }], ['poison', 'slime']),
      item('d', 'd', 1300, [{ x: 3, y: 0 }], ['pet', 'cat']),
    ]);
    const evaluation = evaluateBossMasteryChallenges('baby-moon', { items: diverse, synergyConnectionCount: 0 });
    expect(evaluation.metrics.dominantTagShare).toBe(0.25);
    expect(evaluation.passedChallengeIds).toEqual([
      'moon-mixed-sky',
      'moon-split-eclipse',
      'moon-no-majority',
    ]);

    const mono = map([
      item('a', 'a', 1000, [{ x: 0, y: 0 }], ['device']),
      item('b', 'b', 1100, [{ x: 1, y: 0 }], ['device']),
      item('c', 'c', 1200, [{ x: 2, y: 0 }], ['device']),
      item('d', 'd', 1300, [{ x: 3, y: 0 }], ['device']),
    ]);
    expect(evaluateBossMasteryChallenges('baby-moon', { items: mono, synergyConnectionCount: 0 }).passedChallengeIds).toEqual([]);
  });

  it('rewards exact-copy discipline against Copycat Auditor', () => {
    const unique = map([
      item('a', 'a', 1000, [{ x: 0, y: 0 }]),
      item('b', 'b', 1100, [{ x: 1, y: 0 }]),
      item('c', 'c', 1200, [{ x: 2, y: 0 }]),
    ]);
    const clean = evaluateBossMasteryChallenges('copycat-auditor', { items: unique, synergyConnectionCount: 0 });
    expect(clean.metrics.duplicateExtraCopyCount).toBe(0);
    expect(clean.passedChallengeIds).toEqual([
      'auditor-light-paperwork',
      'auditor-single-copy',
      'auditor-originals-only',
    ]);

    const triplicate = map([
      item('a', 'same', 1000, [{ x: 0, y: 0 }]),
      item('b', 'same', 1100, [{ x: 1, y: 0 }]),
      item('c', 'same', 1200, [{ x: 2, y: 0 }]),
    ]);
    expect(evaluateBossMasteryChallenges('copycat-auditor', { items: triplicate, synergyConnectionCount: 0 }).passedChallengeIds)
      .toEqual(['auditor-light-paperwork']);
  });

  it('rewards moving junk off the perimeter against Border Shark', () => {
    const centered = map([
      item('a', 'a', 1000, [{ x: 1, y: 1 }]),
      item('b', 'b', 1100, [{ x: 2, y: 1 }]),
      item('c', 'c', 1200, [{ x: 3, y: 2 }]),
      item('d', 'd', 1300, [{ x: 4, y: 3 }]),
      item('e', 'e', 1400, [{ x: 0, y: 2 }]),
      item('f', 'f', 1500, [{ x: 5, y: 2 }]),
    ]);
    const evaluation = evaluateBossMasteryChallenges('border-shark', { items: centered, synergyConnectionCount: 0 });
    expect(evaluation.metrics.edgeItemCount).toBe(2);
    expect(evaluation.passedChallengeIds).toEqual([
      'shark-cheap-rent',
      'shark-inner-district',
      'shark-rent-control',
    ]);
  });

  it('normalizes stale IDs and completes passed challenges idempotently', () => {
    expect(normalizeBossMasteryChallengeIds(['stale', 'tv-backup-channel', 'tv-backup-channel']))
      .toEqual(['tv-backup-channel']);

    const items = map([
      item('a', 'a', 1000, [{ x: 1, y: 1 }]),
      item('b', 'b', 1100, [{ x: 2, y: 1 }]),
      item('c', 'c', 1200, [{ x: 3, y: 1 }]),
      item('d', 'd', 1300, [{ x: 4, y: 1 }]),
    ]);
    const evaluation = evaluateBossMasteryChallenges('closet-monster', { items, synergyConnectionCount: 0 });
    const first = completeBossMasteryChallenges([], evaluation);
    expect(first.newlyCompletedChallengeIds).toHaveLength(3);
    const second = completeBossMasteryChallenges(first.completedChallengeIds, evaluation);
    expect(second.newlyCompletedChallengeIds).toEqual([]);
    expect(bossMasteryChallengeStarCount(second.completedChallengeIds, 'closet-monster')).toBe(3);
  });
});
