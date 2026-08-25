export type HudLayoutMode = 'wide' | 'compact';
export type HudActionId = 'daily' | 'archive' | 'trophies' | 'help' | 'settings' | 'reset';

export interface HudActionPlacement {
  readonly id: HudActionId;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly compactLabel: boolean;
}

export interface HudActionLayout {
  readonly mode: HudLayoutMode;
  readonly actions: readonly HudActionPlacement[];
}

const LOGICAL_WIDTH = 1600;
const ACTION_HEIGHT = 34;

export function createHudActionLayout(displayWidthCss: number): HudActionLayout {
  const safeDisplayWidth = Number.isFinite(displayWidthCss) ? Math.max(0, displayWidthCss) : 0;
  const mode: HudLayoutMode = safeDisplayWidth >= 1050 ? 'wide' : 'compact';

  const actions: readonly HudActionPlacement[] = mode === 'wide'
    ? [
        action('daily', 330, 104, 260, false),
        action('help', 930, 104, 110, false),
        action('settings', 1055, 104, 110, false),
        action('archive', 1200, 104, 150, false),
        action('trophies', 1360, 104, 150, false),
        action('reset', 1515, 104, 130, true),
      ]
    : [
        action('daily', 278, 104, 228, true),
        action('help', 1055, 90, 110, true),
        action('settings', 1180, 90, 120, true),
        action('archive', 1325, 90, 150, true),
        action('reset', 1500, 90, 160, true),
        action('trophies', 1370, 132, 330, true),
      ];

  return { mode, actions };
}

export function hudActionBounds(placement: HudActionPlacement): Readonly<{
  left: number;
  right: number;
  top: number;
  bottom: number;
}> {
  return {
    left: placement.x - placement.width / 2,
    right: placement.x + placement.width / 2,
    top: placement.y - placement.height / 2,
    bottom: placement.y + placement.height / 2,
  };
}

export function isHudActionInsideLogicalWidth(placement: HudActionPlacement): boolean {
  const bounds = hudActionBounds(placement);
  return bounds.left >= 8 && bounds.right <= LOGICAL_WIDTH - 8;
}

function action(
  id: HudActionId,
  x: number,
  y: number,
  width: number,
  compactLabel: boolean,
): HudActionPlacement {
  return { id, x, y, width, height: ACTION_HEIGHT, compactLabel };
}
