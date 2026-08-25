import { describe, expect, it } from 'vitest';
import type { AudioCue } from '../src/game/audio/audioCues';
import { AudioMixGate, audioCooldownKey } from '../src/game/audio/audioMix';

function cue(overrides: Partial<AudioCue> = {}): AudioCue {
  return {
    id: 'item.trigger',
    atMs: 0,
    priority: 1,
    group: 'item',
    cooldownMs: 90,
    sourceId: 'item-a',
    ...overrides,
  };
}

describe('audio mix gate', () => {
  it('applies high-frequency item cooldown globally instead of per item', () => {
    const gate = new AudioMixGate(10);
    expect(gate.decide(cue({ sourceId: 'a' }), 1000, 60).accepted).toBe(true);
    expect(gate.decide(cue({ sourceId: 'b' }), 1050, 60)).toMatchObject({ accepted: false, reason: 'cooldown' });
    expect(gate.decide(cue({ sourceId: 'b' }), 1090, 60).accepted).toBe(true);
  });

  it('keeps boss/status cooldowns source-scoped so distinct targets remain readable', () => {
    const first = cue({ id: 'boss.jam.telegraph', group: 'boss', priority: 3, cooldownMs: 260, sourceId: 'a' });
    const second = { ...first, sourceId: 'b' } satisfies AudioCue;
    expect(audioCooldownKey(first)).not.toBe(audioCooldownKey(second));

    const gate = new AudioMixGate(4);
    expect(gate.decide(first, 1000, 220).accepted).toBe(true);
    expect(gate.decide(second, 1010, 220).accepted).toBe(true);
  });

  it('drops equal/lower-priority spam when the semantic voice budget is full', () => {
    const gate = new AudioMixGate(2);
    expect(gate.decide(cue({ id: 'item.trigger', cooldownMs: 0 }), 1000, 500).accepted).toBe(true);
    expect(gate.decide(cue({ id: 'enemy.poison-tick', group: 'impact', cooldownMs: 0 }), 1001, 500).accepted).toBe(true);
    expect(gate.decide(cue({ id: 'poison.apply', group: 'status', cooldownMs: 0 }), 1002, 500))
      .toMatchObject({ accepted: false, reason: 'voice-budget' });
  });

  it('lets a boss impact evict the oldest weakest voice', () => {
    const gate = new AudioMixGate(2);
    const lowA = gate.decide(cue({ cooldownMs: 0 }), 1000, 500);
    const lowB = gate.decide(cue({ id: 'enemy.poison-tick', group: 'impact', cooldownMs: 0 }), 1001, 500);
    expect(lowA.token).toBeDefined();
    expect(lowB.token).toBeDefined();

    const boss = gate.decide(cue({
      id: 'boss.eclipse.impact', group: 'boss', priority: 4, cooldownMs: 0, sourceId: 'poison',
    }), 1002, 260);
    expect(boss).toMatchObject({ accepted: true, evictToken: lowA.token });
    expect(gate.activeVoiceCount(1002)).toBe(2);
  });
});
