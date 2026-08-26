import { describe, expect, it } from 'vitest';
import type { AudioCue, AudioCueId } from '../src/game/audio/audioCues';
import { synthPatchForCue } from '../src/game/audio/audioSynthesis';

const REPRESENTATIVE_IDS: readonly AudioCueId[] = [
  'combat.start',
  'item.trigger',
  'item.jammed',
  'item.slimed',
  'item.scrambled',
  'item.eclipsed',
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
  'boss.eclipse.telegraph',
  'boss.eclipse.impact',
  'boss.time-tax.telegraph',
  'boss.time-tax.impact',
  'boss.clutter.telegraph',
  'boss.clutter.impact',
  'boss.duplicate-debt.telegraph',
  'boss.duplicate-debt.impact',
  'boss.edge-rent.telegraph',
  'boss.edge-rent.impact',
  'combat.victory',
  'boss.defeat',
  'combat.defeat',
  'ui.purchase',
  'ui.reroll',
  'ui.fusion',
  'ui.reward',
  'ui.error',
  'ui.confirm',
  'ui.pocket',
];

const BOSS_TELEGRAPHS: readonly AudioCueId[] = [
  'boss.jam.telegraph',
  'boss.slime.telegraph',
  'boss.magnet.telegraph',
  'boss.eclipse.telegraph',
  'boss.time-tax.telegraph',
  'boss.clutter.telegraph',
  'boss.duplicate-debt.telegraph',
  'boss.edge-rent.telegraph',
];

function cue(id: AudioCueId, sourceId = 'stable-source'): AudioCue {
  const boss = id.includes('boss.');
  const ui = id.startsWith('ui.');
  return { id, atMs: 0, priority: boss ? 4 : 2, group: boss ? 'boss' : ui ? 'ui' : 'combat', cooldownMs: 0, sourceId };
}

describe('audio synthesis patches', () => {
  it('maps every representative semantic family to a finite audible patch', () => {
    for (const id of REPRESENTATIVE_IDS) {
      const patch = synthPatchForCue(cue(id));
      expect(patch.durationMs, id).toBeGreaterThan(0);
      expect(patch.layers.length, id).toBeGreaterThan(0);
      for (const layer of patch.layers) {
        expect(Number.isFinite(layer.startHz), `${id} startHz`).toBe(true);
        expect(Number.isFinite(layer.endHz), `${id} endHz`).toBe(true);
        expect(layer.startHz, id).toBeGreaterThan(0);
        expect(layer.endHz, id).toBeGreaterThan(0);
        expect(layer.durationMs, id).toBeGreaterThan(0);
        expect(layer.gain, id).toBeGreaterThan(0);
        expect(layer.gain, id).toBeLessThanOrEqual(1);
      }
      for (const layer of patch.noiseLayers) {
        expect(['lowpass', 'highpass', 'bandpass']).toContain(layer.filterType);
        expect(layer.startHz, id).toBeGreaterThan(0);
        expect(layer.endHz, id).toBeGreaterThan(0);
        expect(layer.durationMs, id).toBeGreaterThan(0);
        expect(layer.q, id).toBeGreaterThan(0);
        expect(layer.gain, id).toBeGreaterThan(0);
        expect(layer.gain, id).toBeLessThanOrEqual(1);
      }
    }
  });

  it('is deterministic for the same cue/source and varies source pitch in a bounded way', () => {
    const first = synthPatchForCue(cue('item.trigger', 'item-a'));
    const repeat = synthPatchForCue(cue('item.trigger', 'item-a'));
    const other = synthPatchForCue(cue('item.trigger', 'item-b'));
    expect(repeat).toEqual(first);
    expect(other.layers[0]!.startHz).not.toBe(first.layers[0]!.startHz);
    const ratio = other.layers[0]!.startHz / first.layers[0]!.startHz;
    expect(ratio).toBeGreaterThan(0.85);
    expect(ratio).toBeLessThan(1.15);
  });

  it('adds transient texture to impacts, bosses and staged UI without wasting it on every tiny trigger', () => {
    expect(synthPatchForCue(cue('item.trigger')).noiseLayers).toHaveLength(0);
    expect(synthPatchForCue(cue('player.hit')).noiseLayers.length).toBeGreaterThan(0);
    expect(synthPatchForCue(cue('boss.eclipse.impact')).noiseLayers.length).toBeGreaterThan(0);
    expect(synthPatchForCue(cue('ui.fusion')).noiseLayers.length).toBeGreaterThan(0);
  });

  it('gives boss impacts more peak tonal gain than their telegraphs', () => {
    const telegraph = synthPatchForCue(cue('boss.eclipse.telegraph'));
    const impact = synthPatchForCue(cue('boss.eclipse.impact'));
    const maxGain = (layers: typeof telegraph.layers): number => Math.max(...layers.map((layer) => layer.gain));
    expect(maxGain(impact.layers)).toBeGreaterThan(maxGain(telegraph.layers));
  });

  it('gives every launch boss pressure family a distinct telegraph signature', () => {
    const signatures = BOSS_TELEGRAPHS.map((id) => {
      const bossPatch = synthPatchForCue(cue(id));
      return JSON.stringify({
        durationMs: bossPatch.durationMs,
        tones: bossPatch.layers.map((layer) => [layer.wave, layer.startHz, layer.endHz, layer.startOffsetMs, layer.durationMs]),
        noise: bossPatch.noiseLayers.map((layer) => [layer.filterType, layer.startHz, layer.endHz, layer.durationMs]),
      });
    });
    expect(new Set(signatures).size).toBe(BOSS_TELEGRAPHS.length);
  });

  it('gives fusion a longer staged cue than ordinary purchase feedback', () => {
    expect(synthPatchForCue(cue('ui.fusion')).durationMs)
      .toBeGreaterThan(synthPatchForCue(cue('ui.purchase')).durationMs);
  });
});
