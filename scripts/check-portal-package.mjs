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
const sha256 = hash(archive);
const failures = [];

if (manifest.version !== 2) failures.push(`unsupported manifest version ${manifest.version}`);
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
  if (!bytes) {
    failures.push(`archive is missing manifest file ${entry.path}`);
    continue;
  }
  if (bytes.byteLength !== entry.bytes) failures.push(`${entry.path} size mismatch: manifest=${entry.bytes} actual=${bytes.byteLength}`);
  const fileHash = hash(bytes);
  if (fileHash !== entry.sha256) failures.push(`${entry.path} sha256 mismatch`);
}

for (const entry of manifest.storeFiles ?? []) {
  const assetPath = path.join(releaseRoot, ...entry.path.split('/'));
  try {
    const bytes = new Uint8Array(await fs.readFile(assetPath));
    if (bytes.byteLength !== entry.bytes) failures.push(`${entry.path} size mismatch: manifest=${entry.bytes} actual=${bytes.byteLength}`);
    if (hash(bytes) !== entry.sha256) failures.push(`${entry.path} sha256 mismatch`);
  } catch {
    failures.push(`${entry.path} is missing`);
  }
}

if ((manifest.storeFiles ?? []).length !== 3) failures.push(`expected 3 store files, found ${(manifest.storeFiles ?? []).length}`);

if (failures.length > 0) {
  console.error('[release] portal package verification FAIL');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log('[release] portal package verification PASS');
  console.log(`  archive: ${manifest.archive}`);
  console.log(`  files: ${archivedPaths.length}`);
  console.log(`  sha256: ${sha256}`);
  console.log(`  store assets: ${manifest.storeFiles.length}`);
}

function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}
