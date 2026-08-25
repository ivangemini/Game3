const DAILY_PREFIX = 'daily:';
const DAILY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface DailyRunIdentity {
  readonly key: string;
  readonly seed: string;
}

export function createDailyRunIdentity(date: Date = new Date()): DailyRunIdentity {
  const key = utcDateKey(date);
  return { key, seed: `${DAILY_PREFIX}${key}` };
}

export function dailyRunIdentityFromKey(key: string): DailyRunIdentity {
  if (!DAILY_KEY_PATTERN.test(key) || !isValidUtcDateKey(key)) {
    throw new RangeError(`Invalid daily run key: ${key}`);
  }
  return { key, seed: `${DAILY_PREFIX}${key}` };
}

export function isDailyRunSeed(seed: string): boolean {
  if (!seed.startsWith(DAILY_PREFIX)) return false;
  const key = seed.slice(DAILY_PREFIX.length);
  return DAILY_KEY_PATTERN.test(key) && isValidUtcDateKey(key);
}

export function dailyKeyFromSeed(seed: string): string | null {
  return isDailyRunSeed(seed) ? seed.slice(DAILY_PREFIX.length) : null;
}

function utcDateKey(date: Date): string {
  if (Number.isNaN(date.getTime())) throw new RangeError('Daily run date must be valid');
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidUtcDateKey(key: string): boolean {
  const [yearText, monthText, dayText] = key.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() + 1 === month
    && date.getUTCDate() === day;
}
