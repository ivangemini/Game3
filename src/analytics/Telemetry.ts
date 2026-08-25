export type ReturnAgeBucket = 'new' | 'under-24h' | '1-2d' | '3-7d' | '8-30d' | '30d-plus' | 'unknown';

export interface TelemetryEventMap {
  readonly session_start: { readonly returning: boolean; readonly platform: string; readonly viewportMode: string };
  readonly session_age: { readonly bucket: ReturnAgeBucket };
  readonly run_started: { readonly mode: 'standard' | 'daily' };
  readonly tutorial_opened: { readonly step: number };
  readonly tutorial_completed: { readonly stepCount: number };
  readonly tutorial_skipped: { readonly step: number };
  readonly hero_selected: { readonly heroId: string };
  readonly shop_purchase: { readonly definitionId: string; readonly price: number };
  readonly shop_reroll: { readonly source: 'coins' | 'rewarded'; readonly shopIndex: number };
  readonly combat_started: { readonly encounterId: string; readonly stage: string };
  readonly combat_finished: { readonly encounterId: string; readonly outcome: 'victory' | 'defeat'; readonly durationMs: number };
  readonly run_event_choice: { readonly eventId: string; readonly choiceId: string };
  readonly fusion_used: { readonly recipeId: string; readonly resultDefinitionId: string };
  readonly loop_entered: { readonly loopNumber: number };
  readonly run_cashout: { readonly loopNumber: number; readonly score: number };
  readonly ad_result: { readonly placement: 'shop-free-reroll' | 'cycle-boundary'; readonly format: 'rewarded' | 'interstitial'; readonly result: string };
}

export type TelemetryEventName = keyof TelemetryEventMap;

export interface TelemetryEnvelope<K extends TelemetryEventName = TelemetryEventName> {
  readonly name: K;
  readonly payload: TelemetryEventMap[K];
  readonly sessionId: string;
  readonly timestampMs: number;
}

export interface TelemetryTransport {
  send(endpoint: string, events: readonly TelemetryEnvelope[]): boolean | Promise<boolean>;
}

export interface TelemetryClientOptions {
  readonly endpoint?: string;
  readonly transport?: TelemetryTransport;
  readonly sessionId?: string;
  readonly now?: () => number;
  readonly maxBuffer?: number;
}

export class TelemetryClient {
  private readonly endpoint: string;
  private readonly transport?: TelemetryTransport;
  private readonly sessionId: string;
  private readonly now: () => number;
  private readonly maxBuffer: number;
  private readonly buffer: TelemetryEnvelope[] = [];
  private flushInFlight = false;

  constructor(options: TelemetryClientOptions = {}) {
    this.endpoint = options.endpoint?.trim() ?? '';
    this.transport = options.transport;
    this.sessionId = options.sessionId ?? createSessionId();
    this.now = options.now ?? (() => Date.now());
    this.maxBuffer = Math.max(10, Math.floor(options.maxBuffer ?? 60));
  }

  track<K extends TelemetryEventName>(name: K, payload: TelemetryEventMap[K]): void {
    this.buffer.push({ name, payload, sessionId: this.sessionId, timestampMs: this.now() } as TelemetryEnvelope);
    if (this.buffer.length > this.maxBuffer) this.buffer.splice(0, this.buffer.length - this.maxBuffer);
    if (this.buffer.length >= 12) void this.flush();
  }

  async flush(): Promise<boolean> {
    if (this.flushInFlight || this.buffer.length === 0 || !this.endpoint || !this.transport) return false;
    this.flushInFlight = true;
    const batch = [...this.buffer];
    try {
      const sent = await this.transport.send(this.endpoint, batch);
      if (sent) this.buffer.splice(0, batch.length);
      return sent;
    } catch {
      return false;
    } finally {
      this.flushInFlight = false;
    }
  }

  getBufferedEvents(): readonly TelemetryEnvelope[] {
    return [...this.buffer];
  }
}

export interface SessionStartContext {
  readonly returning: boolean;
  readonly returnAgeBucket: ReturnAgeBucket;
}

const SEEN_KEY = 'junkpack.telemetry.seen';
const FIRST_SEEN_AT_KEY = 'junkpack.telemetry.first-seen-at';
const DAY_MS = 24 * 60 * 60 * 1000;

export function registerSession(storage?: Storage, nowMs = Date.now()): SessionStartContext {
  if (!storage) return { returning: false, returnAgeBucket: 'unknown' };
  try {
    const returning = storage.getItem(SEEN_KEY) === '1';
    const storedFirstSeen = Number(storage.getItem(FIRST_SEEN_AT_KEY));
    const validNow = Number.isFinite(nowMs) && nowMs >= 0 ? nowMs : Date.now();

    if (!returning) {
      storage.setItem(SEEN_KEY, '1');
      storage.setItem(FIRST_SEEN_AT_KEY, String(validNow));
      return { returning: false, returnAgeBucket: 'new' };
    }

    if (!Number.isFinite(storedFirstSeen) || storedFirstSeen <= 0 || storedFirstSeen > validNow) {
      storage.setItem(FIRST_SEEN_AT_KEY, String(validNow));
      return { returning: true, returnAgeBucket: 'unknown' };
    }

    return { returning: true, returnAgeBucket: ageBucket(validNow - storedFirstSeen) };
  } catch {
    return { returning: false, returnAgeBucket: 'unknown' };
  }
}

function ageBucket(ageMs: number): ReturnAgeBucket {
  if (ageMs < DAY_MS) return 'under-24h';
  if (ageMs < 3 * DAY_MS) return '1-2d';
  if (ageMs < 8 * DAY_MS) return '3-7d';
  if (ageMs < 31 * DAY_MS) return '8-30d';
  return '30d-plus';
}

export class BrowserTelemetryTransport implements TelemetryTransport {
  async send(endpoint: string, events: readonly TelemetryEnvelope[]): Promise<boolean> {
    const body = JSON.stringify({ version: 1, events });
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const accepted = navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
      if (accepted) return true;
    }
    if (typeof fetch !== 'function') return false;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true,
        credentials: 'omit',
        cache: 'no-store',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const endpoint = typeof import.meta !== 'undefined' ? (import.meta.env.VITE_ANALYTICS_ENDPOINT ?? '') : '';

export const telemetry = new TelemetryClient({
  endpoint,
  transport: new BrowserTelemetryTransport(),
});

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) void telemetry.flush();
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => { void telemetry.flush(); });
}
