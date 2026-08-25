export type ViewportMode = 'portrait' | 'compact-landscape' | 'standard-landscape';

export interface ViewportProfile {
  readonly mode: ViewportMode;
  readonly width: number;
  readonly height: number;
  readonly compactHud: boolean;
  readonly shouldShowOrientationGate: boolean;
}

const COMPACT_LANDSCAPE_MAX_WIDTH = 1024;
const COMPACT_LANDSCAPE_MAX_HEIGHT = 600;

export function classifyViewport(width: number, height: number): ViewportProfile {
  const safeWidth = finiteDimension(width);
  const safeHeight = finiteDimension(height);
  const portrait = safeHeight > safeWidth;
  const compactLandscape = !portrait
    && (safeWidth <= COMPACT_LANDSCAPE_MAX_WIDTH || safeHeight <= COMPACT_LANDSCAPE_MAX_HEIGHT);

  return {
    mode: portrait ? 'portrait' : compactLandscape ? 'compact-landscape' : 'standard-landscape',
    width: safeWidth,
    height: safeHeight,
    compactHud: portrait || compactLandscape,
    shouldShowOrientationGate: portrait,
  };
}

export function applyViewportProfile(
  root: HTMLElement,
  profile: ViewportProfile,
): void {
  root.dataset.viewportMode = profile.mode;
  root.dataset.compactHud = profile.compactHud ? 'true' : 'false';
}

function finiteDimension(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}
