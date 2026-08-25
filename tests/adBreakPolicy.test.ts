import { describe, expect, it } from 'vitest';
import { AdBreakPolicy } from '../src/platform/AdBreakPolicy';

describe('AdBreakPolicy', () => {
  it('never allows an interstitial during active gameplay', () => {
    const policy = new AdBreakPolicy({ firstInterstitialDelayMs: 0, sessionStartedAtMs: 0 });
    expect(policy.canShowInterstitial({ breakPoint: 'boss-result', gameplayActive: true, nowMs: 999_999 })).toBe(false);
  });

  it('protects the opening minutes from an immediate interstitial', () => {
    const policy = new AdBreakPolicy({ firstInterstitialDelayMs: 120_000, sessionStartedAtMs: 10_000 });
    expect(policy.canShowInterstitial({ breakPoint: 'boss-result', gameplayActive: false, nowMs: 129_999 })).toBe(false);
    expect(policy.canShowInterstitial({ breakPoint: 'boss-result', gameplayActive: false, nowMs: 130_000 })).toBe(true);
  });

  it('enforces a cooldown after a shown interstitial', () => {
    const policy = new AdBreakPolicy({ minimumIntervalMs: 180_000, firstInterstitialDelayMs: 0 });
    policy.recordInterstitialShown(200_000);
    expect(policy.canShowInterstitial({ breakPoint: 'cycle-boundary', gameplayActive: false, nowMs: 379_999 })).toBe(false);
    expect(policy.canShowInterstitial({ breakPoint: 'run-end', gameplayActive: false, nowMs: 380_000 })).toBe(true);
  });

  it('normalizes unsafe timing configuration', () => {
    const policy = new AdBreakPolicy({ minimumIntervalMs: 1, firstInterstitialDelayMs: -50, sessionStartedAtMs: -1 });
    policy.recordInterstitialShown(0);
    expect(policy.canShowInterstitial({ breakPoint: 'run-end', gameplayActive: false, nowMs: 29_999 })).toBe(false);
    expect(policy.canShowInterstitial({ breakPoint: 'run-end', gameplayActive: false, nowMs: 30_000 })).toBe(true);
  });
});
