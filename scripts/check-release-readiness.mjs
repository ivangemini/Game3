import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'dist/index.html',
  'public/assets/store/icon-512.png',
  'public/assets/store/cover-800x470.png',
  'public/assets/store/hero-1560x520.png',
  'public/assets/atlas/junk-items.svg',
  'public/assets/atlas/junk-items.json',
  'public/assets/atlas/junk-portraits.svg',
  'public/assets/atlas/junk-portraits.json',
  'public/assets/atlas/junk-ui.svg',
  'public/assets/atlas/junk-ui.json',
  'docs/PLATFORM_INTEGRATION.md',
  'docs/ANALYTICS.md',
];

const failures = [];
for (const relative of requiredFiles) {
  try {
    const stat = await fs.stat(path.join(root, relative));
    if (!stat.isFile() || stat.size <= 0) failures.push(`${relative}: missing/empty`);
  } catch {
    failures.push(`${relative}: missing`);
  }
}

try {
  const html = await fs.readFile(path.join(root, 'dist/index.html'), 'utf8');
  if (/localhost|127\.0\.0\.1/.test(html)) failures.push('dist/index.html contains a local-only URL');
} catch {
  // already reported above
}

const endpoint = (process.env.VITE_ANALYTICS_ENDPOINT ?? '').trim();
if (endpoint) {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:') failures.push('VITE_ANALYTICS_ENDPOINT must use HTTPS for a release build');
  } catch {
    failures.push('VITE_ANALYTICS_ENDPOINT is not a valid absolute URL');
  }
} else {
  console.warn('[release] analytics endpoint is empty; repository checks can pass, but soft-launch measurement will be disabled');
}

if (failures.length > 0) {
  console.error('[release] readiness FAIL');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log('[release] readiness PASS');
  console.log(`  analytics: ${endpoint ? 'configured' : 'not configured'}`);
  console.log(`  required files: ${requiredFiles.length}`);
}
