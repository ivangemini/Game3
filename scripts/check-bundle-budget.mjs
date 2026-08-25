import { promises as fs } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const ASSETS = path.join(DIST, 'assets');

const BUDGETS = {
  maxTotalJsGzipBytes: 500 * 1024,
  maxLargestJsGzipBytes: 450 * 1024,
  maxAppChunkGzipBytes: 120 * 1024,
};

const names = await fs.readdir(ASSETS);
const jsNames = names.filter((name) => name.endsWith('.js')).sort();
if (jsNames.length === 0) throw new Error('[bundle] budget FAIL: no JavaScript chunks found');

const chunks = [];
for (const name of jsNames) {
  const bytes = await fs.readFile(path.join(ASSETS, name));
  chunks.push({ name, rawBytes: bytes.length, gzipBytes: gzipSync(bytes).length });
}

const totalGzip = chunks.reduce((sum, chunk) => sum + chunk.gzipBytes, 0);
const largest = chunks.reduce((current, chunk) => chunk.gzipBytes > current.gzipBytes ? chunk : current, chunks[0]);
const appChunks = chunks.filter((chunk) => !chunk.name.startsWith('phaser-'));
const appGzip = appChunks.reduce((sum, chunk) => sum + chunk.gzipBytes, 0);

assert(totalGzip <= BUDGETS.maxTotalJsGzipBytes, `total JS gzip ${formatBytes(totalGzip)} > ${formatBytes(BUDGETS.maxTotalJsGzipBytes)}`);
assert(largest.gzipBytes <= BUDGETS.maxLargestJsGzipBytes, `largest JS chunk ${largest.name} is ${formatBytes(largest.gzipBytes)} > ${formatBytes(BUDGETS.maxLargestJsGzipBytes)}`);
assert(appGzip <= BUDGETS.maxAppChunkGzipBytes, `game/app JS gzip ${formatBytes(appGzip)} > ${formatBytes(BUDGETS.maxAppChunkGzipBytes)}`);

console.log('[bundle] budget PASS');
for (const chunk of chunks) console.log(`  ${chunk.name}: ${formatBytes(chunk.rawBytes)} raw / ${formatBytes(chunk.gzipBytes)} gzip`);
console.log(`  total JS gzip: ${formatBytes(totalGzip)} / ${formatBytes(BUDGETS.maxTotalJsGzipBytes)}`);
console.log(`  game/app JS gzip: ${formatBytes(appGzip)} / ${formatBytes(BUDGETS.maxAppChunkGzipBytes)}`);

function assert(condition, message) {
  if (!condition) throw new Error(`[bundle] budget FAIL: ${message}`);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KiB`;
}
