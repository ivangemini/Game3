import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BrowserTelemetryTransport,
  registerSession,
  TelemetryClient,
  type TelemetryEnvelope,
  type TelemetryTransport,
} from '../src/analytics/Telemetry';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

class RecordingTransport implements TelemetryTransport {
  readonly batches: TelemetryEnvelope[][] = [];
  constructor(private readonly succeeds = true) {}
  send(_endpoint: string, events: readonly TelemetryEnvelope[]): boolean {
    this.batches.push([...events]);
    return this.succeeds;
  }
}

afterEach(() => vi.unstubAllGlobals());

describe('TelemetryClient', () => {
  it('buffers typed events with one ephemeral session id and timestamp', () => {
    const client = new TelemetryClient({ endpoint: '', sessionId: 'session-test', now: () => 1234 });
    client.track('hero_selected', { heroId: 'engineer' });
    client.track('fusion_used', { recipeId: 'fusion-a', resultDefinitionId: 'result-a' });
    expect(client.getBufferedEvents()).toEqual([
      { name: 'hero_selected', payload: { heroId: 'engineer' }, sessionId: 'session-test', timestampMs: 1234 },
      { name: 'fusion_used', payload: { recipeId: 'fusion-a', resultDefinitionId: 'result-a' }, sessionId: 'session-test', timestampMs: 1234 },
    ]);
  });

  it('flushes only when an endpoint and transport exist', async () => {
    const transport = new RecordingTransport();
    const client = new TelemetryClient({ endpoint: 'https://metrics.example.test/events', transport, sessionId: 's', now: () => 1 });
    client.track('tutorial_completed', { stepCount: 5 });
    await expect(client.flush()).resolves.toBe(true);
    expect(transport.batches).toHaveLength(1);
    expect(client.getBufferedEvents()).toHaveLength(0);
  });

  it('keeps events buffered when transport rejects a batch', async () => {
    const transport = new RecordingTransport(false);
    const client = new TelemetryClient({ endpoint: 'https://metrics.example.test/events', transport, sessionId: 's', now: () => 1 });
    client.track('ad_result', { placement: 'shop-free-reroll', format: 'rewarded', result: 'failed' });
    await expect(client.flush()).resolves.toBe(false);
    expect(client.getBufferedEvents()).toHaveLength(1);
  });

  it('caps the buffer instead of growing without bound', () => {
    const client = new TelemetryClient({ endpoint: '', sessionId: 's', maxBuffer: 10, now: () => 1 });
    for (let index = 0; index < 15; index += 1) client.track('tutorial_opened', { step: index });
    const events = client.getBufferedEvents();
    expect(events).toHaveLength(10);
    expect(events[0]?.payload).toEqual({ step: 5 });
  });
});

describe('BrowserTelemetryTransport', () => {
  it('falls back to fetch keepalive when beacon is unavailable', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('fetch', fetchMock);
    const transport = new BrowserTelemetryTransport();
    const events: TelemetryEnvelope[] = [
      { name: 'hero_selected', payload: { heroId: 'engineer' }, sessionId: 's', timestampMs: 1 },
    ];

    await expect(transport.send('https://metrics.example.test/events', events)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'POST', keepalive: true, credentials: 'omit', cache: 'no-store' });
  });

  it('does not call fetch after a beacon accepts the batch', async () => {
    const sendBeacon = vi.fn(() => true);
    const fetchMock = vi.fn();
    vi.stubGlobal('navigator', { sendBeacon });
    vi.stubGlobal('fetch', fetchMock);
    const transport = new BrowserTelemetryTransport();

    await expect(transport.send('https://metrics.example.test/events', [])).resolves.toBe(true);
    expect(sendBeacon).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('registerSession', () => {
  it('reports first session once and returning sessions afterwards without an identity', () => {
    const storage = new MemoryStorage();
    expect(registerSession(storage)).toEqual({ returning: false });
    expect(registerSession(storage)).toEqual({ returning: true });
  });
});
