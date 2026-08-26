import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const ACCEPTANCE_VERSION = 1;
export const ACCEPTANCE_STATUSES = ['pass', 'fail', 'not-tested', 'not-applicable'];

const DEVICE_REQUIRED_CHECKS = ['backgroundForeground', 'orientationRecovery', 'adOverlayResume'];
const PORTAL_REQUIRED_CHECKS = {
  yandex: [
    'init',
    'loadingLifecycle',
    'gameplayLifecycle',
    'backgroundResume',
    'adPauseResume',
    'rewardedNoGrantOnDismiss',
    'fullscreenAd',
    'contextMenu',
    'saveReload',
    'responsive',
    'metadataReview',
  ],
  crazygames: [
    'init',
    'loadingLifecycle',
    'gameplayLifecycle',
    'firstPlayClick',
    'backgroundResume',
    'adPauseResume',
    'rewardedNoGrantOnDismiss',
    'midgameAd',
    'noOutboundLinks',
    'responsive',
    'metadataReview',
  ],
};

export function createAcceptanceTemplate() {
  return {
    version: ACCEPTANCE_VERSION,
    build: {
      sha: 'REPLACE_WITH_COMMIT_SHA',
      ciRunId: 'REPLACE_WITH_CI_RUN_ID',
      portalArtifactDigest: 'sha256:REPLACE_WITH_ARTIFACT_DIGEST',
      testedAtUtc: new Date(0).toISOString(),
    },
    devices: [
      deviceTemplate('ios', 'Older iPhone model', 'iOS version', 'Mobile Safari'),
      deviceTemplate('android', 'Mid-range Android model', 'Android version', 'Chrome'),
    ],
    portals: [
      portalTemplate('yandex'),
      portalTemplate('crazygames'),
    ],
  };
}

export function validateAcceptanceDocument(document) {
  const errors = [];
  if (!isRecord(document)) return { valid: false, errors: ['root must be an object'] };
  if (document.version !== ACCEPTANCE_VERSION) errors.push(`version must equal ${ACCEPTANCE_VERSION}`);

  validateBuild(document.build, errors);

  if (!Array.isArray(document.devices)) {
    errors.push('devices must be an array');
  } else {
    document.devices.forEach((device, index) => validateDevice(device, index, errors));
  }

  if (!Array.isArray(document.portals)) {
    errors.push('portals must be an array');
  } else {
    document.portals.forEach((portal, index) => validatePortal(portal, index, errors));
  }

  return { valid: errors.length === 0, errors };
}

export function evaluateAcceptance(document) {
  const validation = validateAcceptanceDocument(document);
  if (!validation.valid) {
    return {
      status: 'BLOCKED',
      blockers: validation.errors.map((message) => `Schema: ${message}`),
      incomplete: [],
      warnings: [],
    };
  }

  const blockers = [];
  const incomplete = [];
  const warnings = [];

  if (isPlaceholder(document.build.sha) || !/^[0-9a-f]{7,40}$/i.test(document.build.sha)) {
    incomplete.push('Build SHA has not been replaced with a real commit SHA.');
  }
  if (isPlaceholder(document.build.ciRunId) || !/^\d+$/.test(String(document.build.ciRunId))) {
    incomplete.push('CI run ID has not been recorded.');
  }
  if (isPlaceholder(document.build.portalArtifactDigest) || !/^sha256:[0-9a-f]{64}$/i.test(document.build.portalArtifactDigest)) {
    incomplete.push('Verified portal artifact SHA-256 digest has not been recorded.');
  }
  if (document.build.testedAtUtc === new Date(0).toISOString()) {
    incomplete.push('Physical/portal test timestamp has not been recorded.');
  }

  const devicePlatforms = new Set();
  for (const device of document.devices) {
    devicePlatforms.add(device.platform);
    evaluateDevice(device, blockers, incomplete, warnings);
  }
  if (!devicePlatforms.has('ios')) incomplete.push('At least one physical iOS/WebKit device profile is required.');
  if (!devicePlatforms.has('android')) incomplete.push('At least one physical Android/Chromium device profile is required.');

  const portalKinds = new Set();
  for (const portal of document.portals) {
    portalKinds.add(portal.portal);
    evaluatePortal(portal, blockers, incomplete);
  }
  if (!portalKinds.has('yandex')) incomplete.push('A real Yandex Games draft acceptance record is required.');
  if (!portalKinds.has('crazygames')) incomplete.push('A real CrazyGames Preview acceptance record is required.');

  return {
    status: blockers.length > 0 ? 'BLOCKED' : incomplete.length > 0 ? 'INCOMPLETE' : 'READY',
    blockers: unique(blockers),
    incomplete: unique(incomplete),
    warnings: unique(warnings),
  };
}

export function renderAcceptanceMarkdown(document, evaluation = evaluateAcceptance(document)) {
  const lines = [
    '# Junkpack Release Acceptance',
    '',
    `Status: **${evaluation.status}**`,
    '',
  ];

  if (isRecord(document?.build)) {
    lines.push(
      '## Candidate',
      '',
      `- Commit: \`${String(document.build.sha ?? '—')}\``,
      `- CI run: \`${String(document.build.ciRunId ?? '—')}\``,
      `- Portal artifact: \`${String(document.build.portalArtifactDigest ?? '—')}\``,
      `- Tested UTC: ${String(document.build.testedAtUtc ?? '—')}`,
      '',
    );
  }

  appendFindings(lines, 'Blockers', evaluation.blockers);
  appendFindings(lines, 'Incomplete evidence', evaluation.incomplete);
  appendFindings(lines, 'Warnings', evaluation.warnings);

  lines.push('## Physical devices', '');
  if (Array.isArray(document?.devices) && document.devices.length > 0) {
    lines.push('| Platform | Device / browser | Drag p50 / p95 | Boss p50 / p95 | Cold / warm transfer | Lifecycle |', '| --- | --- | ---: | ---: | ---: | --- |');
    for (const device of document.devices) {
      const drag = device?.performance?.drag ?? {};
      const boss = device?.performance?.boss ?? {};
      const cold = device?.network?.cold ?? {};
      const warm = device?.network?.warm ?? {};
      const lifecycle = DEVICE_REQUIRED_CHECKS.map((key) => `${key}: ${device?.checks?.[key] ?? 'missing'}`).join('<br>');
      lines.push(`| ${escapeCell(device?.platform ?? '—')} | ${escapeCell(`${device?.device ?? '—'} / ${device?.browser ?? '—'}`)} | ${durationMs(drag.medianFrameMs)} / ${durationMs(drag.p95FrameMs)} | ${durationMs(boss.medianFrameMs)} / ${durationMs(boss.p95FrameMs)} | ${bytes(cold.bytes)} / ${bytes(warm.bytes)} | ${escapeCell(lifecycle)} |`);
    }
  } else {
    lines.push('No physical-device evidence recorded.');
  }
  lines.push('');

  lines.push('## Portal acceptance', '');
  if (Array.isArray(document?.portals) && document.portals.length > 0) {
    for (const portal of document.portals) {
      lines.push(`### ${portalLabel(portal?.portal)}`);
      const required = PORTAL_REQUIRED_CHECKS[portal?.portal] ?? [];
      for (const key of required) lines.push(`- ${key}: **${portal?.checks?.[key] ?? 'missing'}**`);
      if (portal?.notes) lines.push(`- Notes: ${portal.notes}`);
      lines.push('');
    }
  } else {
    lines.push('No real portal evidence recorded.', '');
  }

  lines.push('## Interpretation', '', 'READY means the repository gates are paired with one recorded iOS profile, one Android profile, and real acceptance passes in both Yandex Games Draft and CrazyGames Preview. It does **not** mean portal moderation or player-retention targets are guaranteed.', '');
  return lines.join('\n');
}

function deviceTemplate(platform, device, os, browser) {
  return {
    platform,
    device,
    os,
    browser,
    orientation: 'landscape',
    firstInteractiveMs: 0,
    performance: {
      drag: { medianFrameMs: 0, p95FrameMs: 0, worstFrameMs: 0 },
      boss: { medianFrameMs: 0, p95FrameMs: 0, worstFrameMs: 0 },
    },
    canvas: { width: 0, height: 0, devicePixelRatio: 0 },
    memory: { peakJsHeapBytes: null, approximateTextureBytes: null },
    network: {
      cold: { requestCount: 0, bytes: 0 },
      warm: { requestCount: 0, bytes: 0 },
    },
    checks: {
      backgroundForeground: 'not-tested',
      orientationRecovery: 'not-tested',
      adOverlayResume: 'not-tested',
      webglContextLoss: 'not-tested',
    },
    notes: '',
  };
}

function portalTemplate(portal) {
  const checks = {};
  for (const key of PORTAL_REQUIRED_CHECKS[portal]) checks[key] = 'not-tested';
  return { portal, mode: portal === 'yandex' ? 'Draft + debug panel' : 'Developer Portal Preview', checks, notes: '' };
}

function validateBuild(build, errors) {
  if (!isRecord(build)) {
    errors.push('build must be an object');
    return;
  }
  for (const key of ['sha', 'ciRunId', 'portalArtifactDigest', 'testedAtUtc']) {
    if (typeof build[key] !== 'string' || build[key].length === 0) errors.push(`build.${key} must be a non-empty string`);
  }
  if (typeof build.testedAtUtc === 'string' && Number.isNaN(Date.parse(build.testedAtUtc))) errors.push('build.testedAtUtc must be an ISO-compatible timestamp');
}

function validateDevice(device, index, errors) {
  const prefix = `devices[${index}]`;
  if (!isRecord(device)) {
    errors.push(`${prefix} must be an object`);
    return;
  }
  if (!['ios', 'android'].includes(device.platform)) errors.push(`${prefix}.platform must be ios or android`);
  for (const key of ['device', 'os', 'browser']) {
    if (typeof device[key] !== 'string' || device[key].length === 0) errors.push(`${prefix}.${key} must be a non-empty string`);
  }
  if (device.orientation !== 'landscape') errors.push(`${prefix}.orientation must be landscape`);
  validateNonNegative(device.firstInteractiveMs, `${prefix}.firstInteractiveMs`, errors);
  validateFrameBlock(device.performance?.drag, `${prefix}.performance.drag`, errors);
  validateFrameBlock(device.performance?.boss, `${prefix}.performance.boss`, errors);
  validateNonNegative(device.canvas?.width, `${prefix}.canvas.width`, errors);
  validateNonNegative(device.canvas?.height, `${prefix}.canvas.height`, errors);
  validateNonNegative(device.canvas?.devicePixelRatio, `${prefix}.canvas.devicePixelRatio`, errors);
  validateNetworkBlock(device.network?.cold, `${prefix}.network.cold`, errors);
  validateNetworkBlock(device.network?.warm, `${prefix}.network.warm`, errors);
  if (!isRecord(device.checks)) {
    errors.push(`${prefix}.checks must be an object`);
  } else {
    for (const key of [...DEVICE_REQUIRED_CHECKS, 'webglContextLoss']) validateStatus(device.checks[key], `${prefix}.checks.${key}`, errors);
  }
}

function validatePortal(portal, index, errors) {
  const prefix = `portals[${index}]`;
  if (!isRecord(portal)) {
    errors.push(`${prefix} must be an object`);
    return;
  }
  if (!['yandex', 'crazygames'].includes(portal.portal)) {
    errors.push(`${prefix}.portal must be yandex or crazygames`);
    return;
  }
  if (typeof portal.mode !== 'string' || portal.mode.length === 0) errors.push(`${prefix}.mode must be a non-empty string`);
  if (!isRecord(portal.checks)) {
    errors.push(`${prefix}.checks must be an object`);
    return;
  }
  for (const key of PORTAL_REQUIRED_CHECKS[portal.portal]) validateStatus(portal.checks[key], `${prefix}.checks.${key}`, errors);
}

function validateFrameBlock(block, prefix, errors) {
  if (!isRecord(block)) {
    errors.push(`${prefix} must be an object`);
    return;
  }
  for (const key of ['medianFrameMs', 'p95FrameMs', 'worstFrameMs']) validateNonNegative(block[key], `${prefix}.${key}`, errors);
}

function validateNetworkBlock(block, prefix, errors) {
  if (!isRecord(block)) {
    errors.push(`${prefix} must be an object`);
    return;
  }
  validateNonNegativeInteger(block.requestCount, `${prefix}.requestCount`, errors);
  validateNonNegativeInteger(block.bytes, `${prefix}.bytes`, errors);
}

function validateStatus(value, prefix, errors) {
  if (!ACCEPTANCE_STATUSES.includes(value)) errors.push(`${prefix} must be one of ${ACCEPTANCE_STATUSES.join(', ')}`);
}

function evaluateDevice(device, blockers, incomplete, warnings) {
  const label = `${device.platform} ${device.device}`;
  if (device.firstInteractiveMs <= 0) incomplete.push(`${label}: first interactive timing has not been recorded.`);
  for (const scenario of ['drag', 'boss']) {
    const frames = device.performance[scenario];
    if (frames.medianFrameMs <= 0 || frames.p95FrameMs <= 0 || frames.worstFrameMs <= 0) {
      incomplete.push(`${label}: ${scenario} frame-time profile is incomplete.`);
      continue;
    }
    if (frames.medianFrameMs > 33.4) blockers.push(`${label}: ${scenario} median frame time ${frames.medianFrameMs.toFixed(1)} ms implies sustained performance below ~30 FPS.`);
    if (frames.p95FrameMs > 150) blockers.push(`${label}: ${scenario} p95 frame time ${frames.p95FrameMs.toFixed(1)} ms indicates repeated >150 ms stalls.`);
    else if (frames.p95FrameMs > 50) warnings.push(`${label}: ${scenario} p95 frame time is ${frames.p95FrameMs.toFixed(1)} ms; review visible smoothness.`);
  }
  if (device.canvas.width <= 0 || device.canvas.height <= 0 || device.canvas.devicePixelRatio <= 0) incomplete.push(`${label}: canvas backing-store/DPR evidence is incomplete.`);
  if (device.network.cold.requestCount <= 0 || device.network.cold.bytes <= 0) incomplete.push(`${label}: cold-cache network capture is incomplete.`);
  if (device.network.warm.requestCount <= 0 || device.network.warm.bytes <= 0) incomplete.push(`${label}: warm-cache network capture is incomplete.`);
  for (const key of DEVICE_REQUIRED_CHECKS) evaluateRequiredStatus(device.checks[key], `${label}: ${key}`, blockers, incomplete);
  if (device.checks.webglContextLoss === 'fail') blockers.push(`${label}: WebGL context loss/recovery check failed.`);
  else if (device.checks.webglContextLoss === 'not-tested') incomplete.push(`${label}: WebGL context-loss observation has not been recorded.`);
}

function evaluatePortal(portal, blockers, incomplete) {
  const label = portalLabel(portal.portal);
  for (const key of PORTAL_REQUIRED_CHECKS[portal.portal]) evaluateRequiredStatus(portal.checks[key], `${label}: ${key}`, blockers, incomplete);
}

function evaluateRequiredStatus(status, label, blockers, incomplete) {
  if (status === 'fail') blockers.push(`${label} failed.`);
  else if (status !== 'pass' && status !== 'not-applicable') incomplete.push(`${label} has not been tested.`);
}

function appendFindings(lines, title, findings) {
  lines.push(`## ${title}`, '');
  if (findings.length === 0) lines.push('- None.');
  else for (const finding of findings) lines.push(`- ${finding}`);
  lines.push('');
}

function validateNonNegative(value, prefix, errors) {
  if (!Number.isFinite(value) || value < 0) errors.push(`${prefix} must be a non-negative finite number`);
}

function validateNonNegativeInteger(value, prefix, errors) {
  if (!Number.isInteger(value) || value < 0) errors.push(`${prefix} must be a non-negative integer`);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isPlaceholder(value) {
  return typeof value !== 'string' || value.includes('REPLACE_WITH');
}

function unique(values) {
  return [...new Set(values)];
}

function durationMs(value) {
  return Number.isFinite(value) && value > 0 ? `${value.toFixed(1)} ms` : '—';
}

function bytes(value) {
  if (!Number.isFinite(value) || value <= 0) return '—';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`;
  return `${(value / 1024 / 1024).toFixed(2)} MiB`;
}

function escapeCell(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

function portalLabel(portal) {
  return portal === 'yandex' ? 'Yandex Games' : portal === 'crazygames' ? 'CrazyGames' : String(portal ?? 'Unknown portal');
}

async function runCli() {
  const [command, inputArg, ...rest] = process.argv.slice(2);
  if (command === 'template') {
    const output = inputArg ?? path.join('reports', 'release-acceptance.json');
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `${JSON.stringify(createAcceptanceTemplate(), null, 2)}\n`, 'utf8');
    console.log(`[acceptance] template written: ${output}`);
    return;
  }
  if (command !== 'check' && command !== 'report') {
    throw new Error('usage: node scripts/release-acceptance-report.mjs template [output.json] | check <input.json> [--out report.md]');
  }
  if (!inputArg) throw new Error(`${command} requires an input JSON path`);
  const outIndex = rest.indexOf('--out');
  const output = outIndex >= 0 ? rest[outIndex + 1] : null;
  if (outIndex >= 0 && !output) throw new Error('--out requires a Markdown output path');

  const document = JSON.parse(fs.readFileSync(inputArg, 'utf8'));
  const validation = validateAcceptanceDocument(document);
  if (!validation.valid) {
    for (const error of validation.errors) console.error(`[acceptance] schema: ${error}`);
    process.exitCode = 2;
    return;
  }
  const evaluation = evaluateAcceptance(document);
  const markdown = renderAcceptanceMarkdown(document, evaluation);
  if (output) {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `${markdown}\n`, 'utf8');
    console.log(`[acceptance] report written: ${output}`);
  } else {
    console.log(markdown);
  }
  if (evaluation.status !== 'READY') process.exitCode = 1;
}

const invokedAsCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedAsCli) {
  runCli().catch((error) => {
    console.error(`[acceptance] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 2;
  });
}
