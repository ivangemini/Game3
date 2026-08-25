import { describe, expect, it } from 'vitest';
import {
  backpackUnlockedPocketCount,
  cashOutRun,
  createInitialRunProgress,
  enterCorruptedLoop,
  loopRewardMultiplier,
  registerRunVictory,
  worldForCampaignEncounter,
} from '../src/game/domain/runProgression';
import {
  CAMPAIGN_ENCOUNTERS,
  createLoopEncounter,
  getRunEncounter,
  modifierForWorld,
  modifiersForLoopWorld,
} from '../src/game/data/runEncounters';

describe('long-session run progression', () => {
  it('uses six campaign worlds with three encounters each and all six boss families', () => {
    expect(CAMPAIGN_ENCOUNTERS).toHaveLength(18);
    expect(CAMPAIGN_ENCOUNTERS.filter((encounter) => encounter.kind === 'boss')).toHaveLength(6);
    expect(CAMPAIGN_ENCOUNTERS.filter((encounter) => encounter.kind === 'boss').map((encounter) => encounter.enemy.id)).toEqual([
      'tv-tyrant', 'deadline-snail', 'closet-monster', 'baby-moon', 'copycat-auditor', 'border-shark',
    ]);
    expect(worldForCampaignEncounter(0)).toBe(1);
    expect(worldForCampaignEncounter(3)).toBe(2);
    expect(worldForCampaignEncounter(8)).toBe(3);
    expect(worldForCampaignEncounter(11)).toBe(4);
    expect(worldForCampaignEncounter(14)).toBe(5);
    expect(worldForCampaignEncounter(17)).toBe(6);
  });

  it('reaches the safe exit only after the eighteenth campaign victory', () => {
    let progress = createInitialRunProgress();
    for (let index = 0; index < 17; index += 1) {
      const encounter = getRunEncounter(progress, 'route-seed');
      expect(encounter).not.toBeNull();
      progress = registerRunVictory(progress, encounter?.scoreValue ?? 0);
      expect(progress.mode).toBe('campaign');
    }
    const finale = getRunEncounter(progress, 'route-seed');
    expect(finale?.encounterId).toBe('w6-border-shark');
    progress = registerRunVictory(progress, finale?.scoreValue ?? 0);
    expect(progress.mode).toBe('deep-choice');
    expect(progress.loopNumber).toBe(1);
  });

  it('opens one extra backpack pocket after each of the first three bosses and stays fully open later', () => {
    let progress = createInitialRunProgress();
    expect(backpackUnlockedPocketCount(progress)).toBe(0);
    for (let index = 0; index < 3; index += 1) progress = registerRunVictory(progress, 0);
    expect(backpackUnlockedPocketCount(progress)).toBe(1);
    for (let index = 0; index < 3; index += 1) progress = registerRunVictory(progress, 0);
    expect(backpackUnlockedPocketCount(progress)).toBe(2);
    for (let index = 0; index < 3; index += 1) progress = registerRunVictory(progress, 0);
    expect(backpackUnlockedPocketCount(progress)).toBe(3);
    for (let index = 0; index < 6; index += 1) progress = registerRunVictory(progress, 0);
    expect(backpackUnlockedPocketCount(progress)).toBe(3);
  });

  it('uses all six deterministic campaign mutations once across the six worlds', () => {
    const mutations = [1, 2, 3, 4, 5, 6].map((world) => modifierForWorld('same-seed', world).id);
    expect(new Set(mutations).size).toBe(6);
    expect(modifierForWorld('same-seed', 1)).toEqual(modifierForWorld('same-seed', 1));
  });

  it('stacks more deterministic mutations in deeper loops', () => {
    const loop2 = modifiersForLoopWorld('loop-seed', 2, 1);
    const loop3 = modifiersForLoopWorld('loop-seed', 3, 1);
    const loop4 = modifiersForLoopWorld('loop-seed', 4, 1);
    expect(loop2).toHaveLength(2);
    expect(loop3).toHaveLength(3);
    expect(loop4).toHaveLength(4);
    expect(new Set(loop4.map((modifier) => modifier.id)).size).toBe(4);
    expect(modifiersForLoopWorld('loop-seed', 3, 1)).toEqual(loop3);
  });

  it('keeps corrupted loops at twelve encounters despite the longer base campaign', () => {
    let progress = createInitialRunProgress();
    for (const encounter of CAMPAIGN_ENCOUNTERS) progress = registerRunVictory(progress, encounter.scoreValue);
    expect(progress.mode).toBe('deep-choice');
    progress = enterCorruptedLoop(progress);
    expect(progress.mode).toBe('loop');
    expect(progress.loopNumber).toBe(2);
    expect(progress.loopEncounterIndex).toBe(0);
    expect(cashOutRun(progress)).toEqual(progress);
    for (let index = 0; index < 12; index += 1) {
      const encounter = getRunEncounter(progress, 'loop-seed');
      expect(encounter).not.toBeNull();
      progress = registerRunVictory(progress, encounter?.scoreValue ?? 0);
    }
    expect(progress.mode).toBe('deep-choice');
    expect(progress.loopNumber).toBe(2);
    expect(cashOutRun(progress).mode).toBe('complete');
    progress = enterCorruptedLoop(progress);
    expect(progress.mode).toBe('loop');
    expect(progress.loopNumber).toBe(3);
  });

  it('scales corrupted loop enemies and rewards with depth', () => {
    const loop2 = createLoopEncounter(2, 0, 'depth-seed');
    const loop4 = createLoopEncounter(4, 0, 'depth-seed');
    expect(loop4.enemy.maxHp).toBeGreaterThan(loop2.enemy.maxHp);
    expect(loop4.enemy.attackDamage).toBeGreaterThan(loop2.enemy.attackDamage);
    expect(loop4.rewardCoins).toBeGreaterThan(loop2.rewardCoins);
    expect(loop4.modifiers.length).toBeGreaterThan(loop2.modifiers.length);
    expect(loopRewardMultiplier(4)).toBeGreaterThan(loopRewardMultiplier(2));
  });
});
