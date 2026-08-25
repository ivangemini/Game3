import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { zipSync } from 'fflate';

const root = process.cwd();
const distRoot = path.join(root, 'dist');
const releaseRoot = path.join(root, 'release');
const archiveName = 'junkpack-boss-rush.zip';
const archivePath = path.join(releaseRoot, archiveName);

const files = await collectFiles(distRoot);
if (files.length === 0) throw new Error('dist is empty; run the production build before packaging');

const payload = {};
const manifestFiles = [];
for (const relative of files) {
  const absolute = path.join(distRoot, relative);
  const bytes = new Uint8Array(await fs.readFile(absolute));
  payload[toPosix(relative)] = bytes;
  manifestFiles.push({ path: toPosix(relative), bytes: bytes.byteLength });
}

const archive = zipSync(payload, { level: 9 });
await fs.mkdir(releaseRoot, { recursive: true });
await fs.writeFile(archivePath, archive);
const sha256 = createHash('sha256').update(archive).digest('hex');
const manifest = {
  version: 1,
  archive: archiveName,
  bytes: archive.byteLength,
  sha256,
  fileCount: manifestFiles.length,
  files: manifestFiles,
};
await fs.writeFile(path.join(releaseRoot, 'portal-package.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log('[release] portal package built');
console.log(`  ${archiveName}: ${formatBytes(archive.byteLength)}`);
console.log(`  files: ${manifestFiles.length}`);
console.log(`  sha256: ${sha256}`);

async function collectFiles(directory, prefix = '') {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) result.push(...await collectFiles(path.join(directory, entry.name), relative));
    else if (entry.isFile()) result.push(relative);
  }
  return result;
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}
