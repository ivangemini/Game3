import { describe, expect, it } from 'vitest';
import {
  HERO_MASTERY_MAX_LEVEL,
  HERO_MASTERY_REWARDS,
  addHeroMasteryXp,
  createHeroMasterySnapshot,
  heroMasteryAwardForAction,
  heroMasteryLevelForXp,
  heroMasteryXpForLevel,
  totalHeroMasteryLevel,
  type HeroMasteryXpState,
} from '../src/game/domain/heroMastery';

const EMPTY: HeroMasteryXpState = { scavenger: 0, engineer: 0, alchemist: 0, beastfriend: 0 };

describe('hero mastery', () => {
  it('uses a monotonic twenty-level XP curve', () => {
    expect(heroMasteryXpForLevel(1)).toBe(0);
    let previous = -1;
    for (let level = 1; level <= HERO_MASTERY_MAX_LEVEL; level += 1) {
      const threshold = heroMasteryXpForLevel(level);
      expect(threshold).toBeGreaterThan(previous);
      expect(heroMasteryLevelForXp(threshold)).toBe(level);
      previous = threshold;
    }
    expect(heroMasteryLevelForXp(999_999)).toBe(20);
  });

  it('ships seven cosmetic milestones per hero and no combat-stat reward kinds', () => {
    expect(HERO_MASTERY_REWARDS).toHaveLength(28);
    expect(new Set(HERO_MASTERY_REWARDS.map((reward) => reward.id)).size).toBe(28);
    expect(new Set(HERO_MASTERY_REWARDS.map((reward) => reward.heroId)).size).toBe(4);
    expect(new Set(HERO_MASTERY_REWARDS.map((reward) => reward.kind))).toEqual(new Set(['title', 'frame', 'trail', 'vfx']));
  });

  it('reports level progress, next cosmetic and newly crossed rewards', () => {
    const before = createHeroMasterySnapshot('engineer', EMPTY);
    expect(before.level).toBe(1);
    expect(before.nextReward?.level).toBe(2);

    const award = addHeroMasteryXp(EMPTY, 'engineer', heroMasteryXpForLevel(4));
    expect(award.state.engineer).toBe(heroMasteryXpForLevel(4));
    expect(award.levelsGained).toBe(3);
    expect(award.rewardsUnlocked.map((reward) => reward.level)).toEqual([2, 4]);
    const after = createHeroMasterySnapshot('engineer', award.state);
    expect(after.level).toBe(4);
    expect(after.unlockedRewards).toHaveLength(2);
    expect(after.nextReward?.level).toBe(7);
  });

  it('awards meaningful actions but never passive time', () => {
    expect(heroMasteryAwardForAction('fight-victory')).toBe(12);
    expect(heroMasteryAwardForAction('elite-victory')).toBeGreaterThan(heroMasteryAwardForAction('fight-victory'));
    expect(heroMasteryAwardForAction('boss-victory')).toBeGreaterThan(heroMasteryAwardForAction('elite-victory'));
    expect(heroMasteryAwardForAction('boss-victory', { loopNumber: 4 })).toBeGreaterThan(heroMasteryAwardForAction('boss-victory'));
    expect(heroMasteryAwardForAction('campaign-clear')).toBeGreaterThan(heroMasteryAwardForAction('boss-victory'));
    expect(heroMasteryAwardForAction('loop-clear', { loopNumber: 5 })).toBeGreaterThan(heroMasteryAwardForAction('campaign-clear'));
  });

  it('ignores negative/invalid grants and aggregates mastery across all four heroes', () => {
    expect(addHeroMasteryXp(EMPTY, 'scavenger', -100).state).toEqual(EMPTY);
    expect(addHeroMasteryXp(EMPTY, 'scavenger', Number.NaN).state).toEqual(EMPTY);
    const state: HeroMasteryXpState = {
      scavenger: heroMasteryXpForLevel(2),
      engineer: heroMasteryXpForLevel(3),
      alchemist: heroMasteryXpForLevel(4),
      beastfriend: heroMasteryXpForLevel(5),
    };
    expect(totalHeroMasteryLevel(state)).toBe(14);
  });
});
