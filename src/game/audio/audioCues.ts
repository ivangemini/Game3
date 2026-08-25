import type { ClutterCrushPresentationEvent, TimeTaxPresentationEvent } from '../domain/bossCombat';
import type { CombatPresentationEvent } from '../domain/combat';

export type AudioCuePriority = 1 | 2 | 3 | 4;
export type AudioCueGroup = 'combat' | 'item' | 'impact' | 'status' | 'boss' | 'outcome';

export type AudioCueId =
  | 'combat.start' | 'item.trigger' | 'item.jammed' | 'item.slimed' | 'item.scrambled' | 'item.eclipsed'
  | 'enemy.hit' | 'enemy.poison-tick' | 'poison.apply' | 'shield.gain' | 'player.hit'
  | 'boss.jam.telegraph' | 'boss.jam.impact' | 'boss.slime.telegraph' | 'boss.slime.impact'
  | 'boss.magnet.telegraph' | 'boss.magnet.impact' | 'boss.eclipse.telegraph' | 'boss.eclipse.impact'
  | 'boss.time-tax.telegraph' | 'boss.time-tax.impact' | 'boss.clutter.telegraph' | 'boss.clutter.impact'
  | 'combat.victory' | 'combat.defeat';

export interface AudioCue {
  readonly id: AudioCueId;
  readonly atMs: number;
  readonly priority: AudioCuePriority;
  readonly group: AudioCueGroup;
  readonly cooldownMs: number;
  readonly sourceId?: string;
}

export function combatStartAudioCue(enemyId: string, boss: boolean): AudioCue {
  return { id: 'combat.start', atMs: 0, priority: boss ? 3 : 2, group: 'combat', cooldownMs: 0, sourceId: enemyId };
}

export function audioCueForCombatEvent(event: CombatPresentationEvent): AudioCue {
  switch (event.kind) {
    case 'item-triggered': return cue('item.trigger', event.atMs, 1, 'item', 90, event.itemInstanceId);
    case 'item-jammed': return cue('item.jammed', event.atMs, 2, 'status', 120, event.itemInstanceId);
    case 'item-slimed': return cue('item.slimed', event.atMs, 2, 'status', 140, event.itemInstanceId);
    case 'item-scrambled': return cue('item.scrambled', event.atMs, 2, 'status', 140, event.itemInstanceId);
    case 'item-eclipsed': return cue('item.eclipsed', event.atMs, 2, 'status', 150, event.itemInstanceId);
    case 'enemy-damaged': return event.source === 'poison'
      ? cue('enemy.poison-tick', event.atMs, 1, 'impact', 180, event.itemInstanceId)
      : cue('enemy.hit', event.atMs, 2, 'impact', 70, event.itemInstanceId);
    case 'poison-applied': return cue('poison.apply', event.atMs, 1, 'status', 130, event.itemInstanceId);
    case 'shield-gained': return cue('shield.gain', event.atMs, 2, 'status', 160, event.itemInstanceId);
    case 'player-damaged': return cue('player.hit', event.atMs, 3, 'impact', 110);
    case 'boss-telegraph': return cue('boss.jam.telegraph', event.atMs, 3, 'boss', 260, event.itemInstanceId);
    case 'boss-jammed': return cue('boss.jam.impact', event.atMs, 4, 'boss', 220, event.itemInstanceId);
    case 'boss-cell-telegraph': return cue('boss.slime.telegraph', event.atMs, 3, 'boss', 260);
    case 'boss-cell-slimed': return cue('boss.slime.impact', event.atMs, 4, 'boss', 220);
    case 'boss-row-telegraph': return cue('boss.magnet.telegraph', event.atMs, 3, 'boss', 280);
    case 'boss-row-scrambled': return cue('boss.magnet.impact', event.atMs, 4, 'boss', 240);
    case 'boss-tag-telegraph': return cue('boss.eclipse.telegraph', event.atMs, 3, 'boss', 300, event.tag);
    case 'boss-tag-eclipsed': return cue('boss.eclipse.impact', event.atMs, 4, 'boss', 260, event.tag);
    case 'outcome': return cue(event.outcome === 'victory' ? 'combat.victory' : 'combat.defeat', event.atMs, 4, 'outcome', 0);
    default: { const exhaustive: never = event; return exhaustive; }
  }
}

export function audioCueForTimeTaxEvent(event: TimeTaxPresentationEvent): AudioCue {
  return event.kind === 'boss-time-tax-telegraph'
    ? cue('boss.time-tax.telegraph', event.atMs, 3, 'boss', 300, event.itemInstanceId)
    : cue('boss.time-tax.impact', event.atMs, 4, 'boss', 260, event.itemInstanceId);
}

export function audioCueForClutterCrushEvent(event: ClutterCrushPresentationEvent): AudioCue {
  return event.kind === 'boss-clutter-telegraph'
    ? cue('boss.clutter.telegraph', event.atMs, 3, 'boss', 320)
    : cue('boss.clutter.impact', event.atMs, 4, 'boss', 280);
}

function cue(id: AudioCueId, atMs: number, priority: AudioCuePriority, group: AudioCueGroup, cooldownMs: number, sourceId?: string): AudioCue {
  return { id, atMs: Math.max(0, Math.floor(atMs)), priority, group, cooldownMs: Math.max(0, Math.floor(cooldownMs)), ...(sourceId ? { sourceId } : {}) };
}
