export function createStandardRunSeed(nowMs = Date.now(), randomValue = Math.random()): string {
  const safeNow = Number.isFinite(nowMs) ? Math.max(0, Math.floor(nowMs)) : 0;
  const safeRandom = Number.isFinite(randomValue) ? Math.min(0.999999999, Math.max(0, randomValue)) : 0;
  const entropy = Math.floor(safeRandom * 0x1_0000_0000).toString(36).padStart(7, '0');
  return `run:${safeNow.toString(36)}:${entropy}`;
}
