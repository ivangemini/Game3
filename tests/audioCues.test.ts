import { describe, expect, it } from 'vitest';
import {
  audioCueForCombatEvent,
  bossDefeatAudioCue,
  combatStartAudioCue,
} from '../src/game/audio/audioCues';
import type { CombatPresentationEvent } from '../src/game/domain/combat';

describe('combat audio cue contract', () => {
  it('emits a stronger start cue for bosses without changing the stable cue id', () => {
    const fight = combatStartAudioCue('trash-brute', false);
    const boss = combatStartAudioCue('tv-tyrant', true);

    expect(fight.id).toBe('combat.start');
    expect(boss.id).toBe('combat.start');
    expect(boss.priority).toBeGreaterThan(fight.priority);
    expect(boss.sourceId).toBe('tv-tyrant');
  });

  it('maps every combat presentation event family to an asset-agnostic cue', () => {
    const events: CombatPresentationEvent[] = [
      { kind: 'item-triggered', atMs: 100, itemInstanceId: 'laser-1' },
      { kind: 'item-jammed', atMs: 200, itemInstanceId: 'laser-1' },
      { kind: 'item-slimed', atMs: 300, itemInstanceId: 'laser-1', cell: { x: 1, y: 2 } },
      { kind: 'item-scrambled', atMs: 400, itemInstanceId: 'laser-1', row: 2 },
      { kind: 'enemy-damaged', atMs: 500, itemInstanceId: 'laser-1', amount: 8, source: 'item' },
      { kind: 'enemy-damaged', atMs: 600, itemInstanceId: 'poison-1', amount: 3, source: 'poison' },
      { kind: 'poison-applied', atMs: 700, itemInstanceId: 'poison-1', amount: 2 },
      { kind: 'shield-gained', atMs: 800, itemInstanceId: 'magnet-1', amount: 4 },
      { kind: 'player-damaged', atMs: 900, amount: 7, absorbedByShield: 2 },
      { kind: 'boss-telegraph', atMs: 1000, itemInstanceId: 'laser-1', impactAtMs: 1800 },
      { kind: 'boss-jammed', atMs: 1800, itemInstanceId: 'laser-1', durationMs: 2200 },
      { kind: 'boss-cell-telegraph', atMs: 2000, cell: { x: 2, y: 1 }, impactAtMs: 2800 },
      { kind: 'boss-cell-slimed', atMs: 2800, cell: { x: 2, y: 1 }, durationMs: 2400 },
      { kind: 'boss-row-telegraph', atMs: 3100, row: 3, impactAtMs: 3900, magneticPriority: true },
      { kind: 'boss-row-scrambled', atMs: 3900, row: 3, durationMs: 2600 },
      { kind: 'outcome', atMs: 5000, outcome: 'victory' },
    ];

    const ids = events.map((event) => audioCueForCombatEvent(event).id);
    expect(ids).toEqual([
      'item.trigger',
      'item.jammed',
      'item.slimed',
      'item.scrambled',
      'enemy.hit',
      'enemy.poison-tick',
      'poison.apply',
      'shield.gain',
      'player.hit',
      'boss.jam.telegraph',
      'boss.jam.impact',
      'boss.slime.telegraph',
      'boss.slime.impact',
      'boss.magnet.telegraph',
      'boss.magnet.impact',
      'combat.victory',
    ]);
  });

  it('prioritizes boss impacts and outcomes over noisy item trigger traffic', () => {
    const item = audioCueForCombatEvent({ kind: 'item-triggered', atMs: 100, itemInstanceId: 'item-1' });
    const boss = audioCueForCombatEvent({ kind: 'boss-row-scrambled', atMs: 200, row: 1, durationMs: 2000 });
    const defeat = audioCueForCombatEvent({ kind: 'outcome', atMs: 300, outcome: 'defeat' });

    expect(item.priority).toBe(1);
    expect(item.cooldownMs).toBeGreaterThan(0);
    expect(boss.priority).toBe(4);
    expect(audioCueForCombatEvent({ kind: 'boss-row-telegraph', atMs: 180, row: 1, impactAtMs: 600, magneticPriority: true }).priority).toBe(4);
    expect(audioCueForCombatEvent({ kind: 'outcome', atMs: 250, outcome: 'victory' }).priority).toBe(3);
    expect(bossDefeatAudioCue(300, 'tv-tyrant')).toMatchObject({ id: 'boss.defeat', priority: 4, group: 'outcome', sourceId: 'tv-tyrant' });
    expect(defeat).toMatchObject({ id: 'combat.defeat', priority: 4, group: 'outcome', cooldownMs: 0 });
  });
});
