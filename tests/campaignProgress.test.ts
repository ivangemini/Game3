import { describe, expect, it } from 'vitest';
import {
  CAMPAIGN_WORLDS,
  completedCampaignWorldCount,
  createInitialRunProgress,
  enterCorruptedLoop,
  registerRunVictory,
} from '../src/game/domain/runProgression';

describe('campaign world progress', () => {
  it('reports completed worlds across the six-world campaign and keeps the total in loops', () => {
    let progress = createInitialRunProgress();
    expect(completedCampaignWorldCount(progress)).toBe(0);

    for (let index = 0; index < 3; index += 1) progress = registerRunVictory(progress, 0);
    expect(completedCampaignWorldCount(progress)).toBe(1);

    for (let index = 0; index < 9; index += 1) progress = registerRunVictory(progress, 0);
    expect(completedCampaignWorldCount(progress)).toBe(4);

    for (let index = 0; index < 3; index += 1) progress = registerRunVictory(progress, 0);
    expect(completedCampaignWorldCount(progress)).toBe(5);

    for (let index = 0; index < 3; index += 1) progress = registerRunVictory(progress, 0);
    expect(progress.mode).toBe('deep-choice');
    expect(completedCampaignWorldCount(progress)).toBe(CAMPAIGN_WORLDS);

    progress = enterCorruptedLoop(progress);
    expect(progress.mode).toBe('loop');
    expect(completedCampaignWorldCount(progress)).toBe(CAMPAIGN_WORLDS);
  });
});
