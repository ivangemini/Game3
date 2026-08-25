import type { SaveSettings } from '../../persistence/save';
import type { AudioCue } from './audioCues';
import { AudioMixGate } from './audioMix';
import { synthPatchForCue } from './audioSynthesis';

interface RuntimeVoice {
  readonly oscillators: readonly OscillatorNode[];
  readonly gains: readonly GainNode[];
  readonly releaseTimer: number;
}

/**
 * Browser WebAudio renderer for semantic game cues.
 *
 * It deliberately owns no gameplay timing. Combat emits semantic AudioCue
 * records; this class may drop/limit them for mix readability without changing
 * combat state. The context is created/resumed only after a user gesture.
 */
export class GameAudio {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private readonly gate = new AudioMixGate(10);
  private readonly voices = new Map<number, RuntimeVoice>();
  private unlocked = false;
  private disposed = false;
  private sfxVolume = 0.9;
  private musicVolume = 0.8;

  constructor(settings?: Pick<SaveSettings, 'sfxVolume' | 'musicVolume'>) {
    if (settings) this.setVolumes(settings);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  async unlock(): Promise<boolean> {
    if (this.disposed || typeof window === 'undefined' || typeof window.AudioContext !== 'function') return false;
    if (!this.context) this.createContext();
    if (!this.context) return false;

    try {
      if (this.context.state !== 'running') await this.context.resume();
      this.unlocked = this.context.state === 'running';
      return this.unlocked;
    } catch {
      return false;
    }
  }

  playCue(cue: AudioCue): boolean {
    const context = this.context;
    const output = this.sfxGain;
    if (this.disposed || !this.unlocked || !context || !output || context.state !== 'running') return false;

    const patch = synthPatchForCue(cue);
    const nowMs = runtimeNowMs();
    const decision = this.gate.decide(cue, nowMs, patch.durationMs);
    if (!decision.accepted || decision.token === undefined) return false;
    if (decision.evictToken !== undefined) this.stopVoice(decision.evictToken);

    const voiceStart = context.currentTime;
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    for (const layer of patch.layers) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startAt = voiceStart + layer.startOffsetMs / 1000;
      const endAt = startAt + layer.durationMs / 1000;
      const attackEnd = Math.min(endAt, startAt + 0.012);

      oscillator.type = layer.wave;
      oscillator.frequency.setValueAtTime(layer.startHz, startAt);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, layer.endHz), endAt);

      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, layer.gain), attackEnd);
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

      oscillator.connect(gain);
      gain.connect(output);
      oscillator.start(startAt);
      oscillator.stop(endAt + 0.015);
      oscillators.push(oscillator);
      gains.push(gain);
    }

    const token = decision.token;
    const releaseTimer = window.setTimeout(() => this.stopVoice(token), patch.durationMs + 80);
    this.voices.set(token, { oscillators, gains, releaseTimer });
    return true;
  }

  setVolumes(settings: Pick<SaveSettings, 'sfxVolume' | 'musicVolume'>): void {
    this.sfxVolume = clamp01(settings.sfxVolume);
    this.musicVolume = clamp01(settings.musicVolume);
    this.applyVolumes();
  }

  isUnlocked(): boolean {
    return this.unlocked && this.context?.state === 'running';
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    for (const token of [...this.voices.keys()]) this.stopVoice(token);
    this.gate.reset();
    this.unlocked = false;
    const context = this.context;
    this.context = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    if (context && context.state !== 'closed') void context.close();
  }

  private createContext(): void {
    const context = new window.AudioContext({ latencyHint: 'interactive' });
    const masterGain = context.createGain();
    const sfxGain = context.createGain();
    const musicGain = context.createGain();

    sfxGain.connect(masterGain);
    musicGain.connect(masterGain);
    masterGain.connect(context.destination);

    masterGain.gain.value = 0.9;
    this.context = context;
    this.masterGain = masterGain;
    this.sfxGain = sfxGain;
    this.musicGain = musicGain;
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (this.sfxGain) this.sfxGain.gain.value = volumeCurve(this.sfxVolume);
    if (this.musicGain) this.musicGain.gain.value = volumeCurve(this.musicVolume);
  }

  private stopVoice(token: number): void {
    const voice = this.voices.get(token);
    if (voice) {
      window.clearTimeout(voice.releaseTimer);
      for (const oscillator of voice.oscillators) {
        try { oscillator.stop(); } catch { /* already ended */ }
        oscillator.disconnect();
      }
      for (const gain of voice.gains) gain.disconnect();
      this.voices.delete(token);
    }
    this.gate.release(token);
  }

  private readonly handleVisibilityChange = (): void => {
    const context = this.context;
    if (!context || this.disposed) return;
    if (document.hidden) {
      if (context.state === 'running') void context.suspend();
      return;
    }
    // Do not bypass autoplay policy. Resume only after this runtime has already
    // been successfully unlocked by a real interaction.
    if (this.unlocked && context.state === 'suspended') void context.resume();
  };
}

function volumeCurve(value: number): number {
  const clamped = clamp01(value);
  return clamped * clamped;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function runtimeNowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
