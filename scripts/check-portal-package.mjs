import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { unzipSync } from 'fflate';

const root = process.cwd();
const releaseRoot = path.join(root, 'release');
const manifestPath = path.join(releaseRoot, 'portal-package.json');

const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const archivePath = path.join(releaseRoot, manifest.archive);
const archive = new Uint8Array(await fs.readFile(archivePath));
const sha256 = createHash('sha256').update(archive).digest('hex');
const failures = [];

if (sha256 !== manifest.sha256) failures.push(`sha256 mismatch: manifest=${manifest.sha256} actual=${sha256}`);
if (archive.byteLength !== manifest.bytes) failures.push(`archive byte mismatch: manifest=${manifest.bytes} actual=${archive.byteLength}`);

let files;
try {
  files = unzipSync(archive);
} catch (error) {
  failures.push(`archive cannot be opened: ${error instanceof Error ? error.message : String(error)}`);
  files = {};
}

const archivedPaths = Object.keys(files).sort();
if (archivedPaths.length !== manifest.fileCount) failures.push(`fileCount mismatch: manifest=${manifest.fileCount} actual=${archivedPaths.length}`);
if (!archivedPaths.includes('index.html')) failures.push('archive must contain index.html at ZIP root');

for (const entry of manifest.files ?? []) {
  const bytes = files[entry.path];
  if (!bytes) failures.push(`archive is missing manifest file ${entry.path}`);
  else if (bytes.byteLength !== entry.bytes) failures.push(`${entry.path} size mismatch: manifest=${entry.bytes} actual=${bytes.byteLength}`);
}

const requiredStoreAssets = ['icon-512.png', 'cover-800x470.png', 'hero-1560x520.png'];
for (const asset of requiredStoreAssets) {
  const assetPath = path.join(releaseRoot, 'store', asset);
  try {
    const stat = await fs.stat(assetPath);
    if (!stat.isFile() || stat.size <= 0) failures.push(`release/store/${asset} is missing or empty`);
  } catch {
    failures.push(`release/store/${asset} is missing`);
  }
}

if (failures.length > 0) {
  console.error('[release] portal package verification FAIL');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log('[release] portal package verification PASS');
  console.log(`  archive: ${manifest.archive}`);
  console.log(`  files: ${archivedPaths.length}`);
  console.log(`  sha256: ${sha256}`);
  console.log(`  store assets: ${requiredStoreAssets.length}`);
}
