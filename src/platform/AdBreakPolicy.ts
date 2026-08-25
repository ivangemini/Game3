export type NaturalAdBreak = 'boss-result' | 'cycle-boundary' | 'run-end';

export interface InterstitialDecisionInput {
  readonly breakPoint: NaturalAdBreak;
  readonly gameplayActive: boolean;
  readonly nowMs: number;
}

export interface AdBreakPolicyOptions {
  readonly minimumIntervalMs?: number;
  readonly firstInterstitialDelayMs?: number;
  readonly sessionStartedAtMs?: number;
}

export class AdBreakPolicy {
  private readonly minimumIntervalMs: number;
  private readonly firstInterstitialDelayMs: number;
  private readonly sessionStartedAtMs: number;
  private lastShownAtMs: number | null = null;

  constructor(options: AdBreakPolicyOptions = {}) {
    this.minimumIntervalMs = Math.max(30_000, Math.floor(options.minimumIntervalMs ?? 180_000));
    this.firstInterstitialDelayMs = Math.max(0, Math.floor(options.firstInterstitialDelayMs ?? 120_000));
    this.sessionStartedAtMs = Math.max(0, Math.floor(options.sessionStartedAtMs ?? 0));
  }

  canShowInterstitial(input: InterstitialDecisionInput): boolean {
    if (input.gameplayActive) return false;
    const nowMs = Math.max(0, Math.floor(input.nowMs));
    if (nowMs - this.sessionStartedAtMs < this.firstInterstitialDelayMs) return false;
    if (this.lastShownAtMs !== null && nowMs - this.lastShownAtMs < this.minimumIntervalMs) return false;
    return input.breakPoint === 'boss-result'
      || input.breakPoint === 'cycle-boundary'
      || input.breakPoint === 'run-end';
  }

  recordInterstitialShown(nowMs: number): void {
    this.lastShownAtMs = Math.max(0, Math.floor(nowMs));
  }

  getLastShownAtMs(): number | null {
    return this.lastShownAtMs;
  }
}
