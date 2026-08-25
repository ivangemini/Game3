import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { unzipSync } from 'fflate';

const root = process.cwd();
const releaseRoot = path.join(root, 'release');
const manifestPath = path.join(releaseRoot, 'portal-package.json');
const MIB = 1024 * 1024;
const YANDEX_UNCOMPRESSED_LIMIT = 100 * MIB;
const CRAZY_TOTAL_LIMIT = 250 * MIB;
const CRAZY_MOBILE_INITIAL_TARGET = 20 * MIB;
const CRAZY_FILE_COUNT_LIMIT = 1500;
const REQUIRED_RUNTIME_FILES = [
  'index.html',
  'assets/atlas/junk-items.svg',
  'assets/atlas/junk-items.json',
  'assets/atlas/junk-portraits.svg',
  'assets/atlas/junk-portraits.json',
  'assets/atlas/junk-ui.svg',
  'assets/atlas/junk-ui.json',
];

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
const rootIndexCount = archivedPaths.filter((entry) => entry === 'index.html').length;
const uncompressedBytes = Object.values(files).reduce((sum, bytes) => sum + bytes.byteLength, 0);

if (archivedPaths.length !== manifest.fileCount) failures.push(`fileCount mismatch: manifest=${manifest.fileCount} actual=${archivedPaths.length}`);
if (rootIndexCount !== 1) failures.push(`archive must contain exactly one index.html at ZIP root; found ${rootIndexCount}`);
for (const required of REQUIRED_RUNTIME_FILES) {
  if (!archivedPaths.includes(required)) failures.push(`required runtime file is missing: ${required}`);
}
if (archivedPaths.length > CRAZY_FILE_COUNT_LIMIT) failures.push(`CrazyGames file-count limit exceeded: ${archivedPaths.length} > ${CRAZY_FILE_COUNT_LIMIT}`);
if (uncompressedBytes > YANDEX_UNCOMPRESSED_LIMIT) failures.push(`Yandex uncompressed archive limit exceeded: ${formatMiB(uncompressedBytes)} > 100 MiB`);
if (uncompressedBytes > CRAZY_TOTAL_LIMIT) failures.push(`CrazyGames total size limit exceeded: ${formatMiB(uncompressedBytes)} > 250 MiB`);
if (uncompressedBytes > CRAZY_MOBILE_INITIAL_TARGET) failures.push(`mobile initial-download target exceeded: ${formatMiB(uncompressedBytes)} > 20 MiB`);

for (const archivedPath of archivedPaths) {
  if (/\s/u.test(archivedPath)) failures.push(`archive path contains whitespace: ${archivedPath}`);
  if (/[^\x20-\x7E]/u.test(archivedPath)) failures.push(`archive path contains non-ASCII characters: ${archivedPath}`);
  if (archivedPath.endsWith('.map')) failures.push(`source map must not ship in portal archive: ${archivedPath}`);
  if (archivedPath.startsWith('assets/art/')) failures.push(`authored source art must not ship in portal archive: ${archivedPath}`);
  if (archivedPath.startsWith('assets/store/')) failures.push(`store metadata art must remain outside runtime archive: ${archivedPath}`);
}

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
  console.log(`  uncompressed: ${formatMiB(uncompressedBytes)}`);
  console.log(`  sha256: ${sha256}`);
  console.log(`  required runtime files: ${REQUIRED_RUNTIME_FILES.length}`);
  console.log(`  store assets: ${manifest.storeFiles.length}`);
}

function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function formatMiB(bytes) {
  return `${(bytes / MIB).toFixed(2)} MiB`;
}
