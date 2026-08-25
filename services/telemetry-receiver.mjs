import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const EVENT_NAMES = new Set([
  'session_start',
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

export const MAX_BODY_BYTES = 128 * 1024;
export const MAX_EVENTS_PER_BATCH = 100;

export function validateTelemetryBatch(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, error: 'body must be an object' };
  if (value.version !== 1) return { ok: false, error: 'unsupported telemetry version' };
  if (!Array.isArray(value.events)) return { ok: false, error: 'events must be an array' };
  if (value.events.length === 0 || value.events.length > MAX_EVENTS_PER_BATCH) {
    return { ok: false, error: `events must contain 1-${MAX_EVENTS_PER_BATCH} entries` };
  }

  for (let index = 0; index < value.events.length; index += 1) {
    const event = value.events[index];
    if (!event || typeof event !== 'object' || Array.isArray(event)) return { ok: false, error: `events[${index}] must be an object` };
    if (!EVENT_NAMES.has(event.name)) return { ok: false, error: `events[${index}].name is unknown` };
    if (typeof event.sessionId !== 'string' || event.sessionId.length < 4 || event.sessionId.length > 128) {
      return { ok: false, error: `events[${index}].sessionId is invalid` };
    }
    if (!Number.isFinite(event.timestampMs) || event.timestampMs < 0) return { ok: false, error: `events[${index}].timestampMs is invalid` };
    if (!event.payload || typeof event.payload !== 'object' || Array.isArray(event.payload)) {
      return { ok: false, error: `events[${index}].payload must be an object` };
    }
    if (JSON.stringify(event.payload).length > 4096) return { ok: false, error: `events[${index}].payload is too large` };
  }

  return { ok: true, events: value.events };
}

export function createTelemetryServer(options = {}) {
  const outputFile = path.resolve(options.outputFile ?? process.env.TELEMETRY_FILE ?? 'telemetry/telemetry.ndjson');
  const allowedOrigin = options.allowedOrigin ?? process.env.TELEMETRY_ALLOW_ORIGIN ?? '*';
  let writeChain = Promise.resolve();

  const appendEvents = async (events) => {
    const lines = events.map((event) => JSON.stringify(event)).join('\n') + '\n';
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    writeChain = writeChain.then(() => fs.appendFile(outputFile, lines, 'utf8'));
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

function readBody(request, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    request.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        reject(new Error('request body too large'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
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
    console.log(`[telemetry] POST /v1/events · GET /health`);
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
