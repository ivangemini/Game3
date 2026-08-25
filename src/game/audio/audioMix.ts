import type { AudioCue, AudioCuePriority } from './audioCues';

export interface ActiveAudioVoice {
  readonly token: number;
  readonly priority: AudioCuePriority;
  readonly startedAtMs: number;
  readonly endsAtMs: number;
}

export interface AudioMixDecision {
  readonly accepted: boolean;
  readonly token?: number;
  readonly evictToken?: number;
  readonly reason?: 'cooldown' | 'voice-budget';
}

export interface MusicDuckProfile {
  readonly target: number;
  readonly attackMs: number;
  readonly holdMs: number;
  readonly releaseMs: number;
}

/**
 * Runtime-independent admission control for semantic audio cues.
 *
 * The gate intentionally counts a layered synth patch as one semantic voice.
 * This keeps dense autobattler builds readable instead of letting every item
 * trigger create an unbounded wall of sound.
 */
export class AudioMixGate {
  private readonly lastPlayedAtByKey = new Map<string, number>();
  private readonly activeVoices = new Map<number, ActiveAudioVoice>();
  private nextToken = 1;

  constructor(private readonly maxVoices = 10) {
    if (!Number.isInteger(maxVoices) || maxVoices < 1) {
      throw new Error('maxVoices must be a positive integer');
    }
  }

  decide(cue: AudioCue, nowMs: number, estimatedDurationMs: number): AudioMixDecision {
    const now = finiteMs(nowMs);
    const duration = Math.max(1, finiteMs(estimatedDurationMs));
    this.prune(now);

    const cooldownKey = audioCooldownKey(cue);
    const lastPlayedAt = this.lastPlayedAtByKey.get(cooldownKey);
    if (lastPlayedAt !== undefined && now - lastPlayedAt < cue.cooldownMs) {
      return { accepted: false, reason: 'cooldown' };
    }

    let evictToken: number | undefined;
    if (this.activeVoices.size >= this.maxVoices) {
      const weakest = [...this.activeVoices.values()].sort((left, right) =>
        left.priority - right.priority
        || left.startedAtMs - right.startedAtMs
        || left.token - right.token,
      )[0];
      if (!weakest || cue.priority <= weakest.priority) {
        return { accepted: false, reason: 'voice-budget' };
      }
      evictToken = weakest.token;
      this.activeVoices.delete(weakest.token);
    }

    const token = this.nextToken++;
    this.lastPlayedAtByKey.set(cooldownKey, now);
    this.activeVoices.set(token, {
      token,
      priority: cue.priority,
      startedAtMs: now,
      endsAtMs: now + duration,
    });

    return {
      accepted: true,
      token,
      ...(evictToken !== undefined ? { evictToken } : {}),
    };
  }

  release(token: number): void {
    this.activeVoices.delete(token);
  }

  activeVoiceCount(nowMs?: number): number {
    if (nowMs !== undefined) this.prune(finiteMs(nowMs));
    return this.activeVoices.size;
  }

  reset(): void {
    this.lastPlayedAtByKey.clear();
    this.activeVoices.clear();
    this.nextToken = 1;
  }

  private prune(nowMs: number): void {
    for (const [token, voice] of this.activeVoices) {
      if (voice.endsAtMs <= nowMs) this.activeVoices.delete(token);
    }
  }
}

export function audioCooldownKey(cue: AudioCue): string {
  // High-frequency item/impact cues share a global cooldown by cue id. Boss
  // and status cues may retain a stable source so distinct telegraphs remain
  // audible while duplicate spam from one target is suppressed.
  const sourceScoped = cue.group === 'boss' || cue.group === 'status';
  return sourceScoped && cue.sourceId
    ? `${cue.id}:${cue.sourceId}`
    : cue.id;
}

export function musicDuckForCue(cue: AudioCue): MusicDuckProfile | null {
  if (cue.priority >= 4) {
    return { target: 0.34, attackMs: 28, holdMs: 210, releaseMs: 420 };
  }
  if (cue.priority === 3 && (cue.group === 'boss' || cue.id === 'player.hit')) {
    return { target: 0.58, attackMs: 24, holdMs: 120, releaseMs: 300 };
  }
  return null;
}

function finiteMs(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}
