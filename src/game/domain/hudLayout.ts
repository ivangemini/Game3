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
        action('daily', 255, 130, 205, true),
        action('help', 930, 130, 96, true),
        action('settings', 1038, 130, 106, true),
        action('archive', 1164, 130, 126, true),
        action('trophies', 1307, 130, 138, true),
        action('reset', 1460, 130, 126, true),
      ]
    : [
        action('daily', 228, 126, 194, true),
        action('help', 1050, 112, 96, true),
        action('settings', 1160, 112, 112, true),
        action('archive', 1290, 112, 126, true),
        action('reset', 1445, 112, 150, true),
        action('trophies', 1368, 150, 304, true),
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
