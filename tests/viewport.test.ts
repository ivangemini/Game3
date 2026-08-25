import { describe, expect, it } from 'vitest';
import { classifyViewport } from '../src/platform/viewport';

describe('viewport classification', () => {
  it('classifies large landscape viewports as standard', () => {
    expect(classifyViewport(1600, 900)).toMatchObject({
      mode: 'standard-landscape',
      compactHud: false,
      shouldShowOrientationGate: false,
    });
  });

  it('classifies phone-sized landscape viewports as compact', () => {
    expect(classifyViewport(844, 390)).toMatchObject({
      mode: 'compact-landscape',
      compactHud: true,
      shouldShowOrientationGate: false,
    });
  });

  it('uses a portrait orientation gate instead of shrinking the landscape game into illegibility', () => {
    expect(classifyViewport(390, 844)).toMatchObject({
      mode: 'portrait',
      compactHud: true,
      shouldShowOrientationGate: true,
    });
  });

  it('sanitizes invalid dimensions deterministically', () => {
    expect(classifyViewport(Number.NaN, -10)).toEqual({
      mode: 'compact-landscape',
      width: 0,
      height: 0,
      compactHud: true,
      shouldShowOrientationGate: false,
    });
  });
});
