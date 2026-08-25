import { describe, expect, it } from 'vitest';
import { ONBOARDING_STEPS, shouldAutoShowOnboarding } from '../src/game/domain/onboarding';

describe('field manual onboarding', () => {
  it('keeps the manual compact and ordered around the actual run loop', () => {
    expect(ONBOARDING_STEPS.map((step) => step.id)).toEqual(['hero', 'pack', 'synergy', 'fight', 'fusion']);
    expect(new Set(ONBOARDING_STEPS.map((step) => step.id)).size).toBe(ONBOARDING_STEPS.length);
    expect(ONBOARDING_STEPS).toHaveLength(5);
    for (const step of ONBOARDING_STEPS) {
      expect(step.title.length).toBeGreaterThan(4);
      expect(step.body.length).toBeGreaterThan(20);
      expect(step.callout.length).toBeGreaterThan(10);
    }
  });

  it('keeps the full manual opt-in so first launch reaches the run after hero selection', () => {
    expect(shouldAutoShowOnboarding({ hadActiveRun: false, discoveredItemCount: 0, discoveredRecipeCount: 0 })).toBe(false);
    expect(shouldAutoShowOnboarding({ hadActiveRun: true, discoveredItemCount: 0, discoveredRecipeCount: 0 })).toBe(false);
    expect(shouldAutoShowOnboarding({ hadActiveRun: false, discoveredItemCount: 1, discoveredRecipeCount: 0 })).toBe(false);
    expect(shouldAutoShowOnboarding({ hadActiveRun: false, discoveredItemCount: 0, discoveredRecipeCount: 1 })).toBe(false);
  });
});
