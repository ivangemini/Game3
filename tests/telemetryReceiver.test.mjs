import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MAX_BODY_BYTES,
  createTelemetryServer,
  validateTelemetryBatch,
} from '../services/telemetry-receiver.mjs';

const servers = [];
const tempDirs = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))));
  await Promise.all(tempDirs.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

function batch(overrides = {}) {
  return {
    version: 1,
    events: [{
      name: 'session_start',
      payload: { returning: false, platform: 'local', viewportMode: 'standard-landscape' },
      sessionId: 'session-test',
      timestampMs: 1000,
    }],
    ...overrides,
  };
}

function event(name, payload) {
  return { name, payload, sessionId: 'session-test', timestampMs: 1000 };
}

async function startServer() {
  const directory = await mkdtemp(path.join(tmpdir(), 'junkpack-telemetry-'));
  tempDirs.push(directory);
  const outputFile = path.join(directory, 'events.ndjson');
  const server = createTelemetryServer({ outputFile, allowedOrigin: '*' });
  servers.push(server);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Telemetry test server did not expose a TCP address');
  return { outputFile, baseUrl: `http://127.0.0.1:${address.port}` };
}

describe('telemetry receiver', () => {
  it('validates the versioned allowlisted event contract and rejects payload extras', () => {
    expect(validateTelemetryBatch(batch()).ok).toBe(true);
    expect(validateTelemetryBatch(batch({ version: 2 }))).toMatchObject({ ok: false });
    expect(validateTelemetryBatch(batch({ events: [] }))).toMatchObject({ ok: false });
    expect(validateTelemetryBatch(batch({ events: [{ ...batch().events[0], name: 'unknown_event' }] }))).toMatchObject({ ok: false });
    expect(validateTelemetryBatch(batch({ events: [{ ...batch().events[0], sessionId: '' }] }))).toMatchObject({ ok: false });
    expect(validateTelemetryBatch(batch({
      events: [{
        ...batch().events[0],
        payload: { ...batch().events[0].payload, email: 'should-not-be-accepted@example.com' },
      }],
    }))).toMatchObject({ ok: false });
  });

  it('accepts bounded retention events and rejects free-form or impossible values', () => {
    expect(validateTelemetryBatch(batch({ events: [event('daily_board_opened', { ruleId: 'duck-amnesty', streakBucket: '3-6' })] })).ok).toBe(true);
    expect(validateTelemetryBatch(batch({ events: [event('daily_contract_completed', { archetype: 'fusion', target: 2 })] })).ok).toBe(true);
    expect(validateTelemetryBatch(batch({ events: [event('daily_contract_claimed', { archetype: 'boss', streakBucket: '7-13', rewardTrackDay: 5 })] })).ok).toBe(true);
    expect(validateTelemetryBatch(batch({ events: [event('daily_track_claimed', { milestone: 7, cycle: 2, stampReward: 5 })] })).ok).toBe(true);

    expect(validateTelemetryBatch(batch({ events: [event('daily_board_opened', { ruleId: 'duck-amnesty', streakBucket: '999d' })] })).toMatchObject({ ok: false });
    expect(validateTelemetryBatch(batch({ events: [event('daily_contract_completed', { archetype: 'email-address', target: 2 })] })).toMatchObject({ ok: false });
    expect(validateTelemetryBatch(batch({ events: [event('daily_track_claimed', { milestone: 4, cycle: 0, stampReward: 99 })] })).toMatchObject({ ok: false });
  });

  it('accepts a valid batch, writes sanitized NDJSON and exposes health/CORS', async () => {
    const { outputFile, baseUrl } = await startServer();
    const health = await fetch(`${baseUrl}/health`);
    expect(health.status).toBe(200);
    expect(health.headers.get('access-control-allow-origin')).toBe('*');

    const enrichedBatch = batch({
      events: [{ ...batch().events[0], ignoredEnvelopeField: 'drop-me' }],
    });
    const response = await fetch(`${baseUrl}/v1/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(enrichedBatch),
    });
    expect(response.status).toBe(204);

    const written = (await readFile(outputFile, 'utf8')).trim().split('\n').map((line) => JSON.parse(line));
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({ name: 'session_start', sessionId: 'session-test' });
    expect(written[0]).not.toHaveProperty('ignoredEnvelopeField');
    expect(written[0]).not.toHaveProperty('ip');
    expect(written[0]).not.toHaveProperty('userAgent');
  });

  it('rejects invalid media types, unknown schemas and oversized bodies', async () => {
    const { baseUrl } = await startServer();
    const wrongType = await fetch(`${baseUrl}/v1/events`, { method: 'POST', body: JSON.stringify(batch()) });
    expect(wrongType.status).toBe(415);

    const invalid = await fetch(`${baseUrl}/v1/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(batch({ events: [{ ...batch().events[0], name: 'made_up' }] })),
    });
    expect(invalid.status).toBe(400);

    const oversized = await fetch(`${baseUrl}/v1/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ version: 1, events: [], padding: 'x'.repeat(MAX_BODY_BYTES + 1024) }),
    });
    expect(oversized.status).toBe(413);
  });
});
