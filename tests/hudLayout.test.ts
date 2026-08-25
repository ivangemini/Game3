import { describe, expect, it } from 'vitest';
import {
  createHudActionLayout,
  hudActionBounds,
  isHudActionInsideLogicalWidth,
  type HudActionPlacement,
} from '../src/game/domain/hudLayout';

function overlaps(a: HudActionPlacement, b: HudActionPlacement): boolean {
  const aa = hudActionBounds(a);
  const bb = hudActionBounds(b);
  return aa.left < bb.right && aa.right > bb.left && aa.top < bb.bottom && aa.bottom > bb.top;
}

describe('responsive top HUD layout', () => {
  it('uses wide chrome on large portal containers and compact chrome on small/mobile containers', () => {
    expect(createHudActionLayout(1440).mode).toBe('wide');
    expect(createHudActionLayout(1050).mode).toBe('wide');
    expect(createHudActionLayout(1049).mode).toBe('compact');
    expect(createHudActionLayout(390).mode).toBe('compact');
  });

  it('keeps every action inside the logical game width in both modes', () => {
    for (const width of [390, 768, 1049, 1050, 1440, 1920]) {
      const layout = createHudActionLayout(width);
      expect(layout.actions).toHaveLength(5);
      for (const placement of layout.actions) {
        expect(isHudActionInsideLogicalWidth(placement), `${layout.mode}:${placement.id}`).toBe(true);
        expect(placement.height).toBeGreaterThanOrEqual(34);
      }
    }
  });

  it('does not overlap action hit targets within either responsive mode', () => {
    for (const width of [390, 1440]) {
      const actions = createHudActionLayout(width).actions;
      for (let index = 0; index < actions.length; index += 1) {
        for (let other = index + 1; other < actions.length; other += 1) {
          expect(overlaps(actions[index]!, actions[other]!), `${actions[index]!.id}/${actions[other]!.id}`).toBe(false);
        }
      }
    }
  });
});
