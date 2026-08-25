import type { AudioCue, AudioCueId } from './audioCues';

export type SynthWave = OscillatorType;
export type NoiseFilterType = 'lowpass' | 'highpass' | 'bandpass';

export interface SynthToneLayer {
  readonly wave: SynthWave;
  readonly startHz: number;
  readonly endHz: number;
  readonly startOffsetMs: number;
  readonly durationMs: number;
  readonly gain: number;
}

export interface SynthNoiseLayer {
  readonly filterType: NoiseFilterType;
  readonly startHz: number;
  readonly endHz: number;
  readonly q: number;
  readonly startOffsetMs: number;
  readonly durationMs: number;
  readonly gain: number;
}

export interface SynthPatch {
  readonly durationMs: number;
  readonly layers: readonly SynthToneLayer[];
  readonly noiseLayers: readonly SynthNoiseLayer[];
}

export function synthPatchForCue(cue: AudioCue): SynthPatch {
  const variant = pitchVariant(cue.sourceId ?? cue.id);
  const pitch = (hz: number): number => Math.max(28, hz * variant);

  switch (cue.id) {
    case 'combat.start':
      return patch(
        [
          tone('triangle', pitch(120), pitch(180), 0, 180, 0.045),
          tone('sine', pitch(240), pitch(300), 65, 150, 0.028),
        ],
        [noise('bandpass', 520, 1250, 0.7, 0, 110, 0.012)],
      );
    case 'item.trigger': return patch([tone('square', pitch(430), pitch(520), 0, 58, 0.018)]);
    case 'item.jammed': return patch([tone('sawtooth', pitch(270), pitch(105), 0, 120, 0.026)], [noise('lowpass', 900, 300, 0.5, 5, 95, 0.012)]);
    case 'item.slimed': return patch([tone('sine', pitch(210), pitch(95), 0, 145, 0.027)], [noise('lowpass', 520, 180, 0.8, 0, 130, 0.008)]);
    case 'item.scrambled':
      return patch(
        [
          tone('square', pitch(190), pitch(390), 0, 72, 0.02),
          tone('square', pitch(390), pitch(155), 65, 82, 0.018),
        ],
        [noise('bandpass', 1200, 2600, 1.4, 0, 120, 0.008)],
      );
    case 'item.eclipsed': return patch([tone('triangle', pitch(460), pitch(115), 0, 165, 0.026)], [noise('lowpass', 760, 220, 0.7, 28, 120, 0.01)]);
    case 'enemy.hit': return patch([tone('triangle', pitch(185), pitch(78), 0, 78, 0.036)], [noise('bandpass', 2100, 620, 0.8, 0, 70, 0.028)]);
    case 'enemy.poison-tick': return patch([tone('sine', pitch(305), pitch(218), 0, 96, 0.018)], [noise('bandpass', 900, 520, 1.1, 0, 72, 0.007)]);
    case 'poison.apply':
      return patch(
        [
          tone('sine', pitch(420), pitch(315), 0, 95, 0.019),
          tone('sine', pitch(560), pitch(430), 42, 85, 0.012),
        ],
        [noise('bandpass', 1100, 650, 1.2, 0, 110, 0.009)],
      );
    case 'shield.gain': return patch([tone('sine', pitch(330), pitch(710), 0, 155, 0.028)], [noise('highpass', 1800, 4200, 0.5, 45, 90, 0.006)]);
    case 'player.hit':
      return patch(
        [
          tone('sawtooth', pitch(105), pitch(52), 0, 145, 0.055),
          tone('triangle', pitch(215), pitch(95), 0, 105, 0.025),
        ],
        [noise('lowpass', 1800, 320, 0.6, 0, 125, 0.04)],
      );
    case 'combat.victory':
      return patch(
        [
          tone('triangle', pitch(330), pitch(330), 0, 125, 0.035),
          tone('triangle', pitch(440), pitch(440), 110, 135, 0.035),
          tone('triangle', pitch(660), pitch(660), 225, 190, 0.042),
        ],
        [noise('highpass', 2600, 5200, 0.4, 210, 170, 0.012)],
      );
    case 'combat.defeat':
      return patch(
        [
          tone('sawtooth', pitch(220), pitch(125), 0, 210, 0.035),
          tone('triangle', pitch(112), pitch(55), 155, 260, 0.034),
        ],
        [noise('lowpass', 1300, 120, 0.8, 0, 330, 0.028)],
      );
    case 'ui.purchase':
      return patch(
        [
          tone('triangle', pitch(440), pitch(660), 0, 95, 0.028),
          tone('sine', pitch(660), pitch(880), 70, 110, 0.02),
        ],
        [noise('highpass', 2400, 4200, 0.5, 0, 55, 0.009)],
      );
    case 'ui.reroll':
      return patch(
        [
          tone('square', pitch(280), pitch(420), 0, 65, 0.018),
          tone('square', pitch(420), pitch(310), 58, 72, 0.016),
        ],
        [noise('bandpass', 950, 2800, 0.9, 0, 135, 0.02)],
      );
    case 'ui.fusion':
      return patch(
        [
          tone('triangle', pitch(180), pitch(540), 0, 210, 0.035),
          tone('sine', pitch(360), pitch(900), 80, 260, 0.032),
          tone('triangle', pitch(720), pitch(1080), 220, 180, 0.025),
        ],
        [
          noise('lowpass', 320, 1500, 0.7, 0, 230, 0.018),
          noise('highpass', 2100, 6200, 0.5, 210, 170, 0.022),
        ],
      );
    case 'ui.reward':
      return patch(
        [
          tone('sine', pitch(520), pitch(650), 0, 90, 0.022),
          tone('triangle', pitch(780), pitch(920), 72, 105, 0.024),
        ],
        [noise('highpass', 3000, 5200, 0.4, 65, 75, 0.008)],
      );
    case 'ui.error':
      return patch([tone('sawtooth', pitch(220), pitch(110), 0, 145, 0.028)], [noise('bandpass', 700, 260, 1.2, 0, 110, 0.012)]);
    case 'ui.confirm':
      return patch([tone('sine', pitch(480), pitch(620), 0, 75, 0.018)]);
    case 'ui.pocket':
      return patch(
        [
          tone('triangle', pitch(260), pitch(520), 0, 180, 0.032),
          tone('sine', pitch(520), pitch(1040), 125, 220, 0.028),
        ],
        [noise('bandpass', 420, 2200, 0.6, 0, 260, 0.015)],
      );
    default:
      return bossPatch(cue.id, pitch);
  }
}

export function estimatedCueDurationMs(cue: AudioCue): number {
  return synthPatchForCue(cue).durationMs;
}

function bossPatch(id: AudioCueId, pitch: (hz: number) => number): SynthPatch {
  const telegraph = id.endsWith('.telegraph');
  const familyOffset = bossFamilyPitchOffset(id);
  if (telegraph) {
    return patch(
      [
        tone('sawtooth', pitch(150 + familyOffset), pitch(245 + familyOffset), 0, 220, 0.03),
        tone('sine', pitch(75 + familyOffset / 2), pitch(95 + familyOffset / 2), 80, 210, 0.024),
      ],
      [noise('bandpass', 340 + familyOffset * 4, 1600 + familyOffset * 5, 1.1, 0, 250, 0.018)],
    );
  }
  return patch(
    [
      tone('square', pitch(88 + familyOffset / 3), pitch(44), 0, 205, 0.06),
      tone('triangle', pitch(190 + familyOffset), pitch(72), 0, 175, 0.035),
    ],
    [noise('lowpass', 2100 + familyOffset * 5, 180, 0.7, 0, 190, 0.055)],
  );
}

function bossFamilyPitchOffset(id: AudioCueId): number {
  if (id.includes('slime')) return -18;
  if (id.includes('magnet')) return 34;
  if (id.includes('eclipse')) return 52;
  if (id.includes('time-tax')) return 12;
  if (id.includes('clutter')) return -8;
  if (id.includes('duplicate-debt')) return 24;
  if (id.includes('edge-rent')) return 42;
  return 0;
}

function patch(
  layers: readonly SynthToneLayer[],
  noiseLayers: readonly SynthNoiseLayer[] = [],
): SynthPatch {
  const toneEnd = layers.reduce((max, layer) => Math.max(max, layer.startOffsetMs + layer.durationMs), 1);
  const noiseEnd = noiseLayers.reduce((max, layer) => Math.max(max, layer.startOffsetMs + layer.durationMs), 1);
  return { durationMs: Math.max(toneEnd, noiseEnd), layers, noiseLayers };
}

function tone(
  wave: SynthWave,
  startHz: number,
  endHz: number,
  startOffsetMs: number,
  durationMs: number,
  gain: number,
): SynthToneLayer {
  return {
    wave,
    startHz: positive(startHz),
    endHz: positive(endHz),
    startOffsetMs: Math.max(0, Math.floor(startOffsetMs)),
    durationMs: Math.max(1, Math.floor(durationMs)),
    gain: Math.max(0, Math.min(1, gain)),
  };
}

function noise(
  filterType: NoiseFilterType,
  startHz: number,
  endHz: number,
  q: number,
  startOffsetMs: number,
  durationMs: number,
  gain: number,
): SynthNoiseLayer {
  return {
    filterType,
    startHz: positive(startHz),
    endHz: positive(endHz),
    q: Math.max(0.0001, Math.min(30, q)),
    startOffsetMs: Math.max(0, Math.floor(startOffsetMs)),
    durationMs: Math.max(1, Math.floor(durationMs)),
    gain: Math.max(0, Math.min(1, gain)),
  };
}

function positive(value: number): number {
  return Math.max(1, Number.isFinite(value) ? value : 1);
}

function pitchVariant(key: string): number {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const bucket = (hash >>> 0) % 7;
  return 0.94 + bucket * 0.02;
}
