import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const EVENT_NAMES = new Set([
  'session_start',
  'session_age',
  'run_started',
  'tutorial_opened',
  'tutorial_completed',
  'tutorial_skipped',
  'hero_selected',
  'shop_purchase',
  'shop_reroll',
  'combat_started',
  'combat_finished',
  'run_event_choice',
  'fusion_used',
  'loop_entered',
  'run_cashout',
  'ad_result',
]);

const RETURN_AGE_BUCKETS = new Set(['new', 'under-24h', '1-2d', '3-7d', '8-30d', '30d-plus', 'unknown']);
const SAFE_ID = /^[A-Za-z0-9._:-]+$/;
const SAFE_SESSION_ID = /^[A-Za-z0-9._-]+$/;

export const MAX_BODY_BYTES = 128 * 1024;
export const MAX_EVENTS_PER_BATCH = 100;

export function validateTelemetryBatch(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, error: 'body must be an object' };
  if (value.version !== 1) return { ok: false, error: 'unsupported telemetry version' };
  if (!Array.isArray(value.events)) return { ok: false, error: 'events must be an array' };
  if (value.events.length === 0 || value.events.length > MAX_EVENTS_PER_BATCH) {
    return { ok: false, error: `events must contain 1-${MAX_EVENTS_PER_BATCH} entries` };
  }

  const events = [];
  for (let index = 0; index < value.events.length; index += 1) {
    const event = value.events[index];
    if (!event || typeof event !== 'object' || Array.isArray(event)) return { ok: false, error: `events[${index}] must be an object` };
    if (!EVENT_NAMES.has(event.name)) return { ok: false, error: `events[${index}].name is unknown` };
    if (!validToken(event.sessionId, 4, 128, SAFE_SESSION_ID)) return { ok: false, error: `events[${index}].sessionId is invalid` };
    if (!Number.isFinite(event.timestampMs) || event.timestampMs < 0) return { ok: false, error: `events[${index}].timestampMs is invalid` };
    if (!event.payload || typeof event.payload !== 'object' || Array.isArray(event.payload)) {
      return { ok: false, error: `events[${index}].payload must be an object` };
    }
    if (JSON.stringify(event.payload).length > 4096) return { ok: false, error: `events[${index}].payload is too large` };
    if (!validatePayload(event.name, event.payload)) return { ok: false, error: `events[${index}].payload is invalid for ${event.name}` };

    events.push({
      name: event.name,
      payload: event.payload,
      sessionId: event.sessionId,
      timestampMs: event.timestampMs,
    });
  }

  return { ok: true, events };
}

export function createTelemetryServer(options = {}) {
  const outputFile = path.resolve(options.outputFile ?? process.env.TELEMETRY_FILE ?? 'telemetry/telemetry.ndjson');
  const allowedOrigin = options.allowedOrigin ?? process.env.TELEMETRY_ALLOW_ORIGIN ?? '*';
  let writeChain = Promise.resolve();

  const appendEvents = async (events) => {
    const lines = events.map((event) => JSON.stringify(event)).join('\n') + '\n';
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    writeChain = writeChain.catch(() => undefined).then(() => fs.appendFile(outputFile, lines, 'utf8'));
    await writeChain;
  };

  return createServer(async (request, response) => {
    applyCors(response, allowedOrigin);

    if (request.method === 'OPTIONS') {
      response.writeHead(204).end();
      return;
    }

    const url = new URL(request.url ?? '/', 'http://telemetry.local');
    if (request.method === 'GET' && url.pathname === '/health') {
      json(response, 200, { ok: true, version: 1 });
      return;
    }

    if (request.method !== 'POST' || url.pathname !== '/v1/events') {
      json(response, 404, { ok: false, error: 'not found' });
      return;
    }

    const contentType = String(request.headers['content-type'] ?? '').toLowerCase();
    if (!contentType.startsWith('application/json')) {
      json(response, 415, { ok: false, error: 'content-type must be application/json' });
      return;
    }

    try {
      const body = await readBody(request, MAX_BODY_BYTES);
      const parsed = JSON.parse(body);
      const validation = validateTelemetryBatch(parsed);
      if (!validation.ok) {
        json(response, 400, { ok: false, error: validation.error });
        return;
      }
      await appendEvents(validation.events);
      response.writeHead(204).end();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === 'request body too large') json(response, 413, { ok: false, error: message });
      else if (error instanceof SyntaxError) json(response, 400, { ok: false, error: 'invalid JSON' });
      else {
        console.error('[telemetry] write failed');
        json(response, 500, { ok: false, error: 'telemetry storage failed' });
      }
    }
  });
}

function validatePayload(name, payload) {
  switch (name) {
    case 'session_start':
      return onlyKeys(payload, ['returning', 'platform', 'viewportMode'])
        && typeof payload.returning === 'boolean'
        && validText(payload.platform, 1, 32)
        && validText(payload.viewportMode, 1, 32);
    case 'session_age':
      return onlyKeys(payload, ['bucket']) && RETURN_AGE_BUCKETS.has(payload.bucket);
    case 'run_started':
      return onlyKeys(payload, ['mode']) && (payload.mode === 'standard' || payload.mode === 'daily');
    case 'tutorial_opened':
    case 'tutorial_skipped':
      return onlyKeys(payload, ['step']) && validInteger(payload.step, 1, 20);
    case 'tutorial_completed':
      return onlyKeys(payload, ['stepCount']) && validInteger(payload.stepCount, 1, 20);
    case 'hero_selected':
      return onlyKeys(payload, ['heroId']) && validToken(payload.heroId, 1, 64);
    case 'shop_purchase':
      return onlyKeys(payload, ['definitionId', 'price'])
        && validToken(payload.definitionId, 1, 96)
        && validNumber(payload.price, 0, 1_000_000);
    case 'shop_reroll':
      return onlyKeys(payload, ['source', 'shopIndex'])
        && (payload.source === 'coins' || payload.source === 'rewarded')
        && validInteger(payload.shopIndex, 0, 1_000_000);
    case 'combat_started':
      return onlyKeys(payload, ['encounterId', 'stage'])
        && validToken(payload.encounterId, 1, 96)
        && validText(payload.stage, 1, 128);
    case 'combat_finished':
      return onlyKeys(payload, ['encounterId', 'outcome', 'durationMs'])
        && validToken(payload.encounterId, 1, 96)
        && (payload.outcome === 'victory' || payload.outcome === 'defeat')
        && validNumber(payload.durationMs, 0, 3_600_000);
    case 'run_event_choice':
      return onlyKeys(payload, ['eventId', 'choiceId'])
        && validToken(payload.eventId, 1, 96)
        && validToken(payload.choiceId, 1, 96);
    case 'fusion_used':
      return onlyKeys(payload, ['recipeId', 'resultDefinitionId'])
        && validToken(payload.recipeId, 1, 96)
        && validToken(payload.resultDefinitionId, 1, 96);
    case 'loop_entered':
      return onlyKeys(payload, ['loopNumber']) && validInteger(payload.loopNumber, 1, 1000);
    case 'run_cashout':
      return onlyKeys(payload, ['loopNumber', 'score'])
        && validInteger(payload.loopNumber, 0, 1000)
        && validNumber(payload.score, 0, 1_000_000_000_000);
    case 'ad_result':
      return onlyKeys(payload, ['placement', 'format', 'result'])
        && (payload.placement === 'shop-free-reroll' || payload.placement === 'cycle-boundary')
        && (payload.format === 'rewarded' || payload.format === 'interstitial')
        && ['rewarded', 'dismissed', 'unavailable', 'failed', 'shown'].includes(payload.result);
    default:
      return false;
  }
}

function onlyKeys(value, keys) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function validToken(value, minLength, maxLength, pattern = SAFE_ID) {
  return typeof value === 'string'
    && value.length >= minLength
    && value.length <= maxLength
    && pattern.test(value);
}

function validText(value, minLength, maxLength) {
  return typeof value === 'string' && value.length >= minLength && value.length <= maxLength && !/[\u0000-\u001f\u007f]/.test(value);
}

function validInteger(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function validNumber(value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max;
}

function readBody(request, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    let tooLarge = false;
    request.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      if (!tooLarge) chunks.push(chunk);
    });
    request.on('end', () => {
      if (tooLarge) reject(new Error('request body too large'));
      else resolve(Buffer.concat(chunks).toString('utf8'));
    });
    request.on('error', reject);
  });
}

function applyCors(response, origin) {
  response.setHeader('access-control-allow-origin', origin);
  response.setHeader('access-control-allow-methods', 'POST, OPTIONS');
  response.setHeader('access-control-allow-headers', 'content-type');
  response.setHeader('access-control-max-age', '600');
  response.setHeader('cache-control', 'no-store');
  response.setHeader('x-content-type-options', 'nosniff');
}

function json(response, status, body) {
  const content = JSON.stringify(body);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(content),
  });
  response.end(content);
}

async function runCli() {
  const port = positivePort(process.env.PORT ?? '8787');
  const host = process.env.HOST ?? '127.0.0.1';
  const server = createTelemetryServer();
  server.listen(port, host, () => {
    console.log(`[telemetry] listening on http://${host}:${port}`);
    console.log('[telemetry] POST /v1/events · GET /health');
  });
}

function positivePort(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) throw new Error(`Invalid PORT: ${value}`);
  return parsed;
}

const invokedAsCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedAsCli) {
  runCli().catch((error) => {
    console.error(`[telemetry] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
