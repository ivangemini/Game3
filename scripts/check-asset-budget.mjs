import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, 'public', 'assets', 'atlas', 'asset-report.json');

const BUDGETS = {
  itemFrames: 60,
  portraitFrames: 10,
  uiFrames: 14,
  maxAtlasDimension: 2048,
  maxSingleSourceBytes: 24 * 1024,
  maxSourceBytes: 768 * 1024,
  maxGeneratedBytes: 2 * 1024 * 1024,
  maxEstimatedTextureBytes: 16 * 1024 * 1024,
  maxRuntimeAtlasRequests: 3,
};

const report = JSON.parse(await fs.readFile(REPORT_PATH, 'utf8'));
const byKey = new Map(report.atlases.map((atlas) => [atlas.textureKey, atlas]));
const items = byKey.get('junk-items');
const portraits = byKey.get('junk-portraits');
const ui = byKey.get('junk-ui');

assert(items, 'missing junk-items atlas report');
assert(portraits, 'missing junk-portraits atlas report');
assert(ui, 'missing junk-ui atlas report');
assert(items.frameCount === BUDGETS.itemFrames, `junk-items frame count ${items.frameCount} !== ${BUDGETS.itemFrames}`);
assert(portraits.frameCount === BUDGETS.portraitFrames, `junk-portraits frame count ${portraits.frameCount} !== ${BUDGETS.portraitFrames}`);
assert(ui.frameCount === BUDGETS.uiFrames, `junk-ui frame count ${ui.frameCount} !== ${BUDGETS.uiFrames}`);
assert(report.runtimeAtlasRequestCount <= BUDGETS.maxRuntimeAtlasRequests, `runtime atlas requests ${report.runtimeAtlasRequestCount} > ${BUDGETS.maxRuntimeAtlasRequests}`);
assert(report.sourceBytes <= BUDGETS.maxSourceBytes, `authored SVG source payload ${formatBytes(report.sourceBytes)} > ${formatBytes(BUDGETS.maxSourceBytes)}`);
assert(report.generatedBytes <= BUDGETS.maxGeneratedBytes, `generated atlas payload ${formatBytes(report.generatedBytes)} > ${formatBytes(BUDGETS.maxGeneratedBytes)}`);
assert(report.estimatedTextureBytes <= BUDGETS.maxEstimatedTextureBytes, `estimated atlas texture memory ${formatBytes(report.estimatedTextureBytes)} > ${formatBytes(BUDGETS.maxEstimatedTextureBytes)}`);

for (const atlas of report.atlases) {
  assert(atlas.width <= BUDGETS.maxAtlasDimension, `${atlas.textureKey} width ${atlas.width} > ${BUDGETS.maxAtlasDimension}`);
  assert(atlas.height <= BUDGETS.maxAtlasDimension, `${atlas.textureKey} height ${atlas.height} > ${BUDGETS.maxAtlasDimension}`);
  assert(atlas.maxSourceBytes <= BUDGETS.maxSingleSourceBytes, `${atlas.textureKey} contains a ${formatBytes(atlas.maxSourceBytes)} source SVG > ${formatBytes(BUDGETS.maxSingleSourceBytes)}`);
}

console.log('[assets] budget PASS');
console.log(`  requests: ${report.sourceRequestCount} standalone sources → ${report.runtimeAtlasRequestCount} atlas requests`);
console.log(`  source payload: ${formatBytes(report.sourceBytes)} / ${formatBytes(BUDGETS.maxSourceBytes)}`);
console.log(`  generated atlases: ${formatBytes(report.generatedBytes)} / ${formatBytes(BUDGETS.maxGeneratedBytes)}`);
console.log(`  estimated RGBA texture memory: ${formatBytes(report.estimatedTextureBytes)} / ${formatBytes(BUDGETS.maxEstimatedTextureBytes)}`);
for (const atlas of report.atlases) {
  console.log(`  ${atlas.textureKey}: ${atlas.frameCount} frames, ${atlas.width}×${atlas.height}, max source ${formatBytes(atlas.maxSourceBytes)}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(`[assets] budget FAIL: ${message}`);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}
