import { describe, expect, it } from 'vitest';
import {
  cashOutRun,
  createInitialRunProgress,
  endlessRewardMultiplier,
  enterEndless,
  registerRunVictory,
  worldForCampaignEncounter,
} from '../src/game/domain/runProgression';
import { CAMPAIGN_ENCOUNTERS, createEndlessEncounter, getRunEncounter } from '../src/game/data/runEncounters';

describe('run progression', () => {
  it('uses three worlds with three encounters each', () => {
    expect(CAMPAIGN_ENCOUNTERS).toHaveLength(9);
    expect(CAMPAIGN_ENCOUNTERS.filter((encounter) => encounter.kind === 'boss')).toHaveLength(3);
    expect(worldForCampaignEncounter(0)).toBe(1);
    expect(worldForCampaignEncounter(3)).toBe(2);
    expect(worldForCampaignEncounter(8)).toBe(3);
  });

  it('reaches the cashout decision only after the ninth campaign victory', () => {
    let progress = createInitialRunProgress();
    for (let index = 0; index < 8; index += 1) {
      const encounter = getRunEncounter(progress);
      expect(encounter).not.toBeNull();
      progress = registerRunVictory(progress, encounter?.scoreValue ?? 0);
      expect(progress.mode).toBe('campaign');
    }
    const finale = getRunEncounter(progress);
    expect(finale?.encounterId).toBe('w3-final-broadcast');
    progress = registerRunVictory(progress, finale?.scoreValue ?? 0);
    expect(progress.mode).toBe('cashout');
  });

  it('enters endless at wave one and scales difficulty/rewards', () => {
    let progress = createInitialRunProgress();
    for (const encounter of CAMPAIGN_ENCOUNTERS) progress = registerRunVictory(progress, encounter.scoreValue);
    progress = enterEndless(progress);
    expect(progress.mode).toBe('endless');
    expect(progress.endlessWave).toBe(1);

    const wave1 = createEndlessEncounter(1);
    const wave10 = createEndlessEncounter(10);
    expect(wave10.enemy.maxHp).toBeGreaterThan(wave1.enemy.maxHp);
    expect(wave10.rewardCoins).toBeGreaterThan(wave1.rewardCoins);
    expect(wave10.kind).toBe('boss');
    expect(endlessRewardMultiplier(10)).toBeGreaterThan(endlessRewardMultiplier(1));
  });

  it('allows cashing out from either campaign clear or endless', () => {
    const cashout = { ...createInitialRunProgress(), mode: 'cashout' as const };
    expect(cashOutRun(cashout).mode).toBe('complete');
    expect(cashOutRun(enterEndless(cashout)).mode).toBe('complete');
  });
});
