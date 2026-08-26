import { describe, expect, it } from 'vitest';
import {
  DAILY_REALITY_RULES,
  DEFAULT_DAILY_RETENTION,
  bonusPocketUnlocksForRun,
  claimDailyContract,
  claimDailyTrackReward,
  createDailyBoardSnapshot,
  dailyRealityRuleForKey,
  ensureDailyRetentionDay,
  evaluateDailyContracts,
  generateDailyContracts,
  incrementDailyCounter,
  isDailyRealityRuleSafe,
  isDailyRetentionState,
  perkChoiceCountForRun,
  rerollCostForRun,
  startingCoinsForRun,
  type DailyRetentionState,
} from '../src/game/domain/dailyRetention';
import { createInitialRunProgress } from '../src/game/domain/runProgression';

describe('daily retention', () => {
  it('generates three deterministic, diverse and valid contracts per UTC day', () => {
    const first = generateDailyContracts('2026-08-26');
    const again = generateDailyContracts('2026-08-26');
    const nextDay = generateDailyContracts('2026-08-27');

    expect(first).toEqual(again);
    expect(first).toHaveLength(3);
    expect(new Set(first.map((contract) => contract.id)).size).toBe(3);
    expect(['boss', 'world', 'score', 'loop']).toContain(first[0]?.archetype);
    expect(['fusion', 'perk']).toContain(first[1]?.archetype);
    expect(['event', 'shop']).toContain(first[2]?.archetype);
    expect(nextDay.map((contract) => contract.id)).not.toEqual(first.map((contract) => contract.id));
  });

  it('ships a 12-rule pool and keeps every daily rule inside safety bounds', () => {
    expect(DAILY_REALITY_RULES).toHaveLength(12);
    expect(new Set(DAILY_REALITY_RULES.map((rule) => rule.id)).size).toBe(12);
    for (const rule of DAILY_REALITY_RULES) expect(isDailyRealityRuleSafe(rule), rule.id).toBe(true);
    expect(dailyRealityRuleForKey('2026-08-26')).toEqual(dailyRealityRuleForKey('2026-08-26'));
  });

  it('applies rule knobs only to daily seeds', () => {
    const key = '2026-08-26';
    const rule = dailyRealityRuleForKey(key);
    expect(startingCoinsForRun(`daily:${key}`)).toBe(110 + rule.startingCoinsDelta);
    expect(rerollCostForRun(`daily:${key}`)).toBe(rule.rerollCost);
    expect(perkChoiceCountForRun(`daily:${key}`)).toBe(rule.perkChoiceCount);
    expect(bonusPocketUnlocksForRun(`daily:${key}`)).toBe(rule.bonusPocketUnlocks);

    expect(startingCoinsForRun('standard:seed')).toBe(110);
    expect(rerollCostForRun('standard:seed')).toBe(7);
    expect(perkChoiceCountForRun('standard:seed')).toBe(3);
    expect(bonusPocketUnlocksForRun('standard:seed')).toBe(0);
  });

  it('persists counters, completes contracts, claims once and resets only daily progress at rollover', () => {
    const key = '2026-08-26';
    let state = incrementDailyCounter(DEFAULT_DAILY_RETENTION, key, 'shopPurchases', 99);
    state = incrementDailyCounter(state, key, 'eventChoices', 99);
    state = incrementDailyCounter(state, key, 'fusionUses', 99);
    state = incrementDailyCounter(state, key, 'perkChoices', 99);
    state = incrementDailyCounter(state, key, 'bossVictories', 99);
    const progress = { ...createInitialRunProgress(), campaignEncounterIndex: 17, score: 99_999 } as const;
    const evaluation = evaluateDailyContracts(state, key, { progress });
    state = evaluation.state;
    expect(evaluation.newlyCompleted).toHaveLength(3);

    const firstId = generateDailyContracts(key)[0]!.id;
    const firstClaim = claimDailyContract(state, key, firstId);
    expect(firstClaim.claimed).toBe(true);
    expect(firstClaim.state.realityStamps).toBe(1);
    expect(firstClaim.state.streakCount).toBe(1);
    const duplicate = claimDailyContract(firstClaim.state, key, firstId);
    expect(duplicate.claimed).toBe(false);
    expect(duplicate.state.realityStamps).toBe(1);

    const rolled = ensureDailyRetentionDay(firstClaim.state, '2026-08-27');
    expect(rolled.day.counters).toEqual({ bossVictories: 0, fusionUses: 0, eventChoices: 0, shopPurchases: 0, perkChoices: 0 });
    expect(rolled.day.completedContractIds).toEqual([]);
    expect(rolled.day.claimedContractIds).toEqual([]);
    expect(rolled.realityStamps).toBe(1);
    expect(rolled.streakCount).toBe(1);
  });

  it('decays missed-day momentum instead of hard-resetting it', () => {
    let state = qualifyOneContract(DEFAULT_DAILY_RETENTION, '2026-08-20');
    state = qualifyOneContract(state, '2026-08-21');
    state = qualifyOneContract(state, '2026-08-22');
    expect(state.streakCount).toBe(3);

    state = qualifyOneContract(state, '2026-08-24');
    expect(state.streakCount).toBe(3);

    state = qualifyOneContract(state, '2026-08-29');
    expect(state.streakCount).toBe(1);
  });

  it('earns recurring 3/5/7-day track rewards and prevents double claims', () => {
    let state = DEFAULT_DAILY_RETENTION;
    for (const key of ['2026-08-20', '2026-08-21', '2026-08-22']) state = qualifyOneContract(state, key);
    expect(state.rewardTrackDay).toBe(3);
    expect(state.earnedTrackMilestoneIds).toContain('0:3');

    const reward = claimDailyTrackReward(state, '0:3');
    expect(reward.claimed).toBe(true);
    expect(reward.reward?.stampReward).toBe(2);
    expect(reward.state.realityStamps).toBe(state.realityStamps + 2);
    expect(claimDailyTrackReward(reward.state, '0:3').claimed).toBe(false);

    state = reward.state;
    for (const key of ['2026-08-23', '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27']) state = qualifyOneContract(state, key);
    expect(state.rewardTrackCycle).toBe(1);
    expect(state.rewardTrackDay).toBe(1);
    expect(state.earnedTrackMilestoneIds).toEqual(expect.arrayContaining(['0:3', '0:5', '0:7']));
  });

  it('creates a board snapshot without mutating the persisted state', () => {
    const key = '2026-08-26';
    const source = DEFAULT_DAILY_RETENTION;
    const board = createDailyBoardSnapshot(source, key, { progress: createInitialRunProgress() });
    expect(board.key).toBe(key);
    expect(board.contracts).toHaveLength(3);
    expect(board.rule).toEqual(dailyRealityRuleForKey(key));
    expect(source.day.key).toBeNull();
    expect(isDailyRetentionState(source)).toBe(true);
  });
});

function qualifyOneContract(state: DailyRetentionState, key: string): DailyRetentionState {
  const normalized = ensureDailyRetentionDay(state, key);
  const id = generateDailyContracts(key)[0]!.id;
  const completed: DailyRetentionState = {
    ...normalized,
    day: { ...normalized.day, completedContractIds: [id] },
  };
  const result = claimDailyContract(completed, key, id);
  expect(result.claimed).toBe(true);
  return result.state;
}
