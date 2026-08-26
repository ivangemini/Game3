import { describe, expect, it } from 'vitest';
import { getRuntimeRunEncounter } from '../src/game/data/dailyRunEncounters';
import { createInitialRunProgress, type RunProgressState } from '../src/game/domain/runProgression';

function campaignAt(index: number): RunProgressState {
  return { ...createInitialRunProgress(), campaignEncounterIndex: index };
}

describe('late-world encounter preview', () => {
  it('teaches World 5 duplicate pressure before the two setup fights', () => {
    const clerks = getRuntimeRunEncounter(campaignAt(12), 'standard:late-world-test');
    const mule = getRuntimeRunEncounter(campaignAt(13), 'standard:late-world-test');
    expect(clerks?.enemy.id).toBe('carbon-copy-clerks');
    expect(clerks?.subtitle).toContain('DISTRICT HAZARD: Carbon Audit');
    expect(clerks?.subtitle).toContain('exact-copy stack');
    expect(mule?.enemy.id).toBe('mirror-mule');
    expect(mule?.subtitle).toContain('DISTRICT HAZARD: Mirror Overtime');
  });

  it('teaches World 6 perimeter pressure before Border Shark', () => {
    const eels = getRuntimeRunEncounter(campaignAt(15), 'standard:late-world-test');
    const crab = getRuntimeRunEncounter(campaignAt(16), 'standard:late-world-test');
    expect(eels?.subtitle).toContain('DISTRICT HAZARD: Perimeter Current');
    expect(eels?.subtitle).toContain('backpack perimeter');
    expect(crab?.subtitle).toContain('DISTRICT HAZARD: Security Deposit');
  });

  it('leaves boss subtitles on their stronger boss-rule language instead of duplicating district preview copy', () => {
    const auditor = getRuntimeRunEncounter(campaignAt(14), 'standard:late-world-test');
    const shark = getRuntimeRunEncounter(campaignAt(17), 'standard:late-world-test');
    expect(auditor?.enemy.id).toBe('copycat-auditor');
    expect(auditor?.subtitle).toContain('Duplicate Debt');
    expect(auditor?.subtitle).not.toContain('DISTRICT HAZARD');
    expect(shark?.enemy.id).toBe('border-shark');
    expect(shark?.subtitle).toContain('Edge Rent');
    expect(shark?.subtitle).not.toContain('DISTRICT HAZARD');
  });

  it('stacks Daily identity copy on top of the district lesson without replacing it', () => {
    const encounter = getRuntimeRunEncounter(campaignAt(12), 'daily:2026-08-26');
    expect(encounter?.subtitle).toContain('DISTRICT HAZARD: Carbon Audit');
    expect(encounter?.subtitle).toContain('DAILY:');
    expect(encounter?.modifiers.some((modifier) => modifier.id.startsWith('daily-'))).toBe(true);
  });
});
