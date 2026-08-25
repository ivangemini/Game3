import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, 'public', 'assets', 'store-src');
const OUTPUT_ROOT = path.join(ROOT, 'public', 'assets', 'store');

const OUTPUTS = [
  { source: 'icon-512.svg', output: 'icon-512.png', width: 512, height: 512 },
  { source: 'cover-800x470.svg', output: 'cover-800x470.png', width: 800, height: 470 },
  { source: 'hero-1560x520.svg', output: 'hero-1560x520.png', width: 1560, height: 520 },
];

await fs.mkdir(OUTPUT_ROOT, { recursive: true });
const report = [];

for (const target of OUTPUTS) {
  const inputPath = path.join(SOURCE_ROOT, target.source);
  const outputPath = path.join(OUTPUT_ROOT, target.output);
  await sharp(inputPath, { density: 192 })
    .resize(target.width, target.height, { fit: 'fill' })
    .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true })
    .toFile(outputPath);
  const stat = await fs.stat(outputPath);
  report.push({ ...target, bytes: stat.size });
}

await fs.writeFile(
  path.join(OUTPUT_ROOT, 'store-report.json'),
  `${JSON.stringify({ version: 1, files: report }, null, 2)}\n`,
  'utf8',
);

console.log('[store-art] generated portal PNGs');
for (const entry of report) console.log(`  ${entry.output}: ${entry.width}×${entry.height}, ${formatBytes(entry.bytes)}`);

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KiB`;
}
