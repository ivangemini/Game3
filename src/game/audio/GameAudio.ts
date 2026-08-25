import type { SaveSettings } from '../../persistence/save';
import type { AudioCue } from './audioCues';
import { AudioMixGate, musicDuckForCue } from './audioMix';
import { musicStepFor, type MusicMode } from './musicPattern';
import { synthPatchForCue } from './audioSynthesis';

interface RuntimeVoice {
  readonly oscillators: readonly OscillatorNode[];
  readonly gains: readonly GainNode[];
  readonly releaseTimer: number;
}

export class GameAudio {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicDuckGain: GainNode | null = null;
  private readonly gate = new AudioMixGate(10);
  private readonly voices = new Map<number, RuntimeVoice>();
  private unlocked = false;
  private disposed = false;
  private externallySuspended = false;
  private sfxVolume = 0.9;
  private musicVolume = 0.8;
  private musicMode: MusicMode = 'menu';
  private musicStepIndex = 0;
  private musicTimer: number | null = null;

  constructor(settings?: Pick<SaveSettings, 'sfxVolume' | 'musicVolume'>) {
    if (settings) this.setVolumes(settings);
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  async unlock(): Promise<boolean> {
    if (this.disposed || this.externallySuspended || typeof window === 'undefined' || typeof window.AudioContext !== 'function') return false;
    if (!this.context) this.createContext();
    if (!this.context) return false;

    try {
      if (this.context.state !== 'running') await this.context.resume();
      this.unlocked = this.context.state === 'running';
      if (this.unlocked) this.ensureMusicScheduled();
      return this.unlocked;
    } catch {
      return false;
    }
  }

  playCue(cue: AudioCue): boolean {
    this.updateMusicModeFromCue(cue);
    const context = this.context;
    const output = this.sfxGain;
    if (this.disposed || this.externallySuspended || !this.unlocked || !context || !output || context.state !== 'running') return false;

    const patch = synthPatchForCue(cue);
    const nowMs = runtimeNowMs();
    const decision = this.gate.decide(cue, nowMs, patch.durationMs);
    if (!decision.accepted || decision.token === undefined) return false;
    if (decision.evictToken !== undefined) this.stopVoice(decision.evictToken);
    this.applyMusicDuck(cue, context);

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

  setMusicMode(mode: MusicMode): void {
    if (this.musicMode === mode) return;
    this.musicMode = mode;
    this.musicStepIndex = 0;
  }

  isUnlocked(): boolean {
    return this.unlocked && !this.externallySuspended && this.context?.state === 'running';
  }

  suspendForPlatform(): void {
    this.externallySuspended = true;
    const context = this.context;
    if (context?.state === 'running') void context.suspend();
  }

  resumeFromPlatform(): void {
    this.externallySuspended = false;
    const context = this.context;
    if (!context || !this.unlocked || this.disposed) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (context.state === 'suspended') void context.resume();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    if (this.musicTimer !== null && typeof window !== 'undefined') window.clearTimeout(this.musicTimer);
    this.musicTimer = null;
    for (const token of [...this.voices.keys()]) this.stopVoice(token);
    this.gate.reset();
    this.unlocked = false;
    this.externallySuspended = false;
    const context = this.context;
    this.context = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.musicDuckGain = null;
    if (context && context.state !== 'closed') void context.close();
  }

  private createContext(): void {
    const context = new window.AudioContext({ latencyHint: 'interactive' });
    const masterGain = context.createGain();
    const sfxGain = context.createGain();
    const musicGain = context.createGain();
    const musicDuckGain = context.createGain();
    sfxGain.connect(masterGain);
    musicGain.connect(musicDuckGain);
    musicDuckGain.connect(masterGain);
    masterGain.connect(context.destination);
    masterGain.gain.value = 0.9;
    musicDuckGain.gain.value = 1;
    this.context = context;
    this.masterGain = masterGain;
    this.sfxGain = sfxGain;
    this.musicGain = musicGain;
    this.musicDuckGain = musicDuckGain;
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (this.sfxGain) this.sfxGain.gain.value = volumeCurve(this.sfxVolume);
    if (this.musicGain) this.musicGain.gain.value = volumeCurve(this.musicVolume);
  }

  private applyMusicDuck(cue: AudioCue, context: AudioContext): void {
    const profile = musicDuckForCue(cue);
    const duck = this.musicDuckGain?.gain;
    if (!profile || !duck || this.musicVolume <= 0) return;

    const now = context.currentTime;
    const attackEnd = now + profile.attackMs / 1000;
    const holdEnd = attackEnd + profile.holdMs / 1000;
    const releaseEnd = holdEnd + profile.releaseMs / 1000;
    const current = Math.max(0.0001, duck.value);
    const target = Math.max(0.0001, profile.target);

    duck.cancelScheduledValues(now);
    duck.setValueAtTime(current, now);
    duck.exponentialRampToValueAtTime(target, attackEnd);
    duck.setValueAtTime(target, holdEnd);
    duck.exponentialRampToValueAtTime(1, releaseEnd);
  }

  private updateMusicModeFromCue(cue: AudioCue): void {
    if (cue.id === 'combat.start') {
      this.setMusicMode(cue.priority >= 3 ? 'boss' : 'combat');
      return;
    }
    if (cue.id === 'combat.victory' || cue.id === 'combat.defeat') this.setMusicMode('menu');
  }

  private ensureMusicScheduled(): void {
    if (this.musicTimer !== null || this.disposed || typeof window === 'undefined') return;
    this.scheduleMusicStep(40);
  }

  private scheduleMusicStep(delayMs: number): void {
    if (this.disposed || typeof window === 'undefined') return;
    this.musicTimer = window.setTimeout(() => {
      this.musicTimer = null;
      const interval = this.emitMusicStep();
      this.scheduleMusicStep(interval);
    }, Math.max(20, Math.floor(delayMs)));
  }

  private emitMusicStep(): number {
    const step = musicStepFor(this.musicMode, this.musicStepIndex);
    this.musicStepIndex += 1;
    const context = this.context;
    const output = this.musicGain;
    if (this.externallySuspended || !this.unlocked || !context || !output || context.state !== 'running' || this.musicVolume <= 0) return step.intervalMs;
    this.scheduleMusicTone(context, output, 'triangle', step.rootHz, step.durationMs, step.gain);
    if (step.accentHz !== null) {
      this.scheduleMusicTone(context, output, 'sine', step.accentHz, Math.round(step.durationMs * 0.72), step.gain * 0.55);
    }
    return step.intervalMs;
  }

  private scheduleMusicTone(
    context: AudioContext,
    output: GainNode,
    wave: OscillatorType,
    frequency: number,
    durationMs: number,
    level: number,
  ): void {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startAt = context.currentTime;
    const endAt = startAt + Math.max(30, durationMs) / 1000;
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(Math.max(1, frequency), startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, level), startAt + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
    oscillator.connect(gain);
    gain.connect(output);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(startAt);
    oscillator.stop(endAt + 0.01);
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
    if (!this.externallySuspended && this.unlocked && context.state === 'suspended') void context.resume();
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
