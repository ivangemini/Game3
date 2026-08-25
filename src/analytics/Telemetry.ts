export interface TelemetryEventMap {
  readonly session_start: { readonly returning: boolean; readonly platform: string; readonly viewportMode: string };
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
}

const SEEN_KEY = 'junkpack.telemetry.seen';

export function registerSession(storage?: Storage): SessionStartContext {
  if (!storage) return { returning: false };
  try {
    const returning = storage.getItem(SEEN_KEY) === '1';
    storage.setItem(SEEN_KEY, '1');
    return { returning };
  } catch {
    return { returning: false };
  }
}

class BeaconTelemetryTransport implements TelemetryTransport {
  send(endpoint: string, events: readonly TelemetryEnvelope[]): boolean {
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return false;
    const body = new Blob([JSON.stringify({ version: 1, events })], { type: 'application/json' });
    return navigator.sendBeacon(endpoint, body);
  }
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const endpoint = typeof import.meta !== 'undefined' ? (import.meta.env.VITE_ANALYTICS_ENDPOINT ?? '') : '';

export const telemetry = new TelemetryClient({
  endpoint,
  transport: new BeaconTelemetryTransport(),
});

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) void telemetry.flush();
  });
}
