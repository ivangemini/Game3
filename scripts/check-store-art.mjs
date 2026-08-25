import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const OUTPUT_ROOT = path.join(ROOT, 'public', 'assets', 'store');

const EXPECTED = [
  { file: 'icon-512.png', width: 512, height: 512, maxBytes: 512 * 1024 },
  { file: 'cover-800x470.png', width: 800, height: 470, maxBytes: 768 * 1024 },
  { file: 'hero-1560x520.png', width: 1560, height: 520, maxBytes: 1536 * 1024 },
];

for (const expected of EXPECTED) {
  const filePath = path.join(OUTPUT_ROOT, expected.file);
  const [meta, stat] = await Promise.all([sharp(filePath).metadata(), fs.stat(filePath)]);
  assert(meta.format === 'png', `${expected.file} format ${meta.format ?? 'unknown'} !== png`);
  assert(meta.width === expected.width, `${expected.file} width ${meta.width ?? 'unknown'} !== ${expected.width}`);
  assert(meta.height === expected.height, `${expected.file} height ${meta.height ?? 'unknown'} !== ${expected.height}`);
  assert(stat.size <= expected.maxBytes, `${expected.file} ${formatBytes(stat.size)} > ${formatBytes(expected.maxBytes)}`);
  console.log(`  ${expected.file}: ${meta.width}×${meta.height}, ${formatBytes(stat.size)} / ${formatBytes(expected.maxBytes)}`);
}

console.log('[store-art] validation PASS');

function assert(condition, message) {
  if (!condition) throw new Error(`[store-art] validation FAIL: ${message}`);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KiB`;
}
