import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

export function parseTelemetryText(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];

  try {
    return normalizeTelemetryValue(JSON.parse(trimmed));
  } catch {
    const events = [];
    for (const [index, line] of trimmed.split(/\r?\n/).entries()) {
      const value = line.trim();
      if (!value) continue;
      try {
        events.push(...normalizeTelemetryValue(JSON.parse(value)));
      } catch (error) {
        throw new Error(`Invalid telemetry NDJSON at line ${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return events;
  }
}

export function normalizeTelemetryValue(value) {
  if (Array.isArray(value)) return value.flatMap((entry) => normalizeTelemetryValue(entry));
  if (!value || typeof value !== 'object') throw new Error('Telemetry input must contain objects, arrays or { events } batches.');
  if (Array.isArray(value.events)) return value.events.flatMap((entry) => normalizeTelemetryValue(entry));
  if (typeof value.name === 'string' && typeof value.sessionId === 'string' && Number.isFinite(value.timestampMs)) return [value];
  throw new Error('Telemetry object is neither an event envelope nor a batch with an events array.');
}

export function renderMarkdown(summary) {
  const lines = [
    '# Junkpack Soft-launch Report',
    '',
    `Sessions: **${summary.sessions}** · returning **${percent(summary.returningRate)}**`,
    '',
    '## First-session funnel',
    '',
    `- Hero selection reach: **${percent(summary.heroSelectionSessionRate)}** (${summary.sessionsWithHeroSelection}/${summary.sessions}); p50 ${duration(summary.medianTimeToHeroMs)}, p90 ${duration(summary.p90TimeToHeroMs)}.`,
    `- First combat reach: **${percent(summary.firstCombatSessionRate)}** (${summary.sessionsWithFirstCombat}/${summary.sessions}); p50 ${duration(summary.medianTimeToFirstCombatMs)}, p90 ${duration(summary.p90TimeToFirstCombatMs)}.`,
    `- First boss reach: **${percent(summary.firstBossSessionRate)}** (${summary.sessionsWithFirstBoss}/${summary.sessions}); p50 ${duration(summary.medianTimeToFirstBossMs)}, p90 ${duration(summary.p90TimeToFirstBossMs)}. Target p50: **3–5 min**.`,
    `- Base campaign completion: **${percent(summary.baseCampaignCompletionRate)}** (${summary.sessionsCompletingBaseCampaign}/${summary.sessions}); p50 ${duration(summary.medianBaseCampaignDurationMs)}, p90 ${duration(summary.p90BaseCampaignDurationMs)}. Target p50: **20–25 min**.`,
    `- Field Manual opened/completed/skipped: **${summary.tutorialOpened}/${summary.tutorialCompleted}/${summary.tutorialSkipped}**; completion ${percent(summary.tutorialCompletionRate)}.`,
    '',
    '## Run systems',
    '',
    `- Standard/Daily runs started: **${summary.standardRunsStarted}/${summary.dailyRunsStarted}**.`,
    `- Purchases: **${summary.shopPurchases}** · paid rerolls: **${summary.paidRerolls}** · rewarded rerolls: **${summary.rewardedRerolls}**.`,
    `- Event choices: **${summary.eventChoices}** · fusions: **${summary.fusions}** · cashouts: **${summary.cashouts}** · avg cashout score: **${round(summary.averageCashoutScore)}**.`,
    `- Rewarded ad completion: **${percent(summary.rewardedAdCompletionRate)}** (${summary.rewardedAdCompletions}/${summary.rewardedAdAttempts}).`,
    '',
    '## Encounter pacing',
    '',
  ];

  if (summary.combats.length === 0) {
    lines.push('No completed combats in this export.');
  } else {
    lines.push('| Encounter | Attempts | Win rate | Avg | p50 | p90 |');
    lines.push('| --- | ---: | ---: | ---: | ---: | ---: |');
    for (const combat of summary.combats) {
      lines.push(`| ${escapeCell(combat.encounterId)} | ${combat.attempts} | ${percent(combat.winRate)} | ${duration(combat.averageDurationMs)} | ${duration(combat.medianDurationMs)} | ${duration(combat.p90DurationMs)} |`);
    }
  }

  lines.push('', '## Loop entries', '');
  const loopEntries = Object.entries(summary.loopEntries);
  lines.push(loopEntries.length > 0
    ? loopEntries.map(([loop, count]) => `Loop ${loop}: **${count}**`).join(' · ')
    : 'No corrupted-loop entries in this export.');
  lines.push('');
  return `${lines.join('\n')}\n`;
}

async function loadSummarizer() {
  const sourcePath = path.join(process.cwd(), 'src', 'analytics', 'TelemetrySummary.ts');
  const source = await fs.readFile(sourcePath, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
    fileName: sourcePath,
  }).outputText;
  const url = `data:text/javascript;base64,${Buffer.from(compiled, 'utf8').toString('base64')}`;
  const module = await import(url);
  if (typeof module.summarizeTelemetry !== 'function') throw new Error('TelemetrySummary.ts did not export summarizeTelemetry().');
  return module.summarizeTelemetry;
}

async function runCli() {
  const args = process.argv.slice(2);
  const input = args[0];
  if (!input || input.startsWith('--')) {
    console.error('Usage: npm run analytics:report -- <telemetry.json|ndjson> [--json report.json] [--markdown report.md]');
    process.exitCode = 2;
    return;
  }

  const jsonPath = optionValue(args, '--json');
  const markdownPath = optionValue(args, '--markdown');
  const text = await fs.readFile(path.resolve(input), 'utf8');
  const events = parseTelemetryText(text);
  const summarizeTelemetry = await loadSummarizer();
  const summary = summarizeTelemetry(events);
  const markdown = renderMarkdown(summary);

  if (jsonPath) await writeOutput(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
  if (markdownPath) await writeOutput(markdownPath, markdown);

  if (!jsonPath && !markdownPath) process.stdout.write(markdown);
  console.error(`[analytics] summarized ${events.length} events across ${summary.sessions} sessions`);
}

function optionValue(args, option) {
  const index = args.indexOf(option);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${option} requires an output path`);
  return value;
}

async function writeOutput(filePath, content) {
  const absolute = path.resolve(filePath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, content, 'utf8');
  console.error(`[analytics] wrote ${absolute}`);
}

function percent(value) {
  return `${(Number.isFinite(value) ? value * 100 : 0).toFixed(1)}%`;
}

function duration(ms) {
  const value = Number.isFinite(ms) ? Math.max(0, ms) : 0;
  if (value < 1000) return `${Math.round(value)} ms`;
  if (value < 60_000) return `${(value / 1000).toFixed(1)} s`;
  return `${(value / 60_000).toFixed(1)} min`;
}

function round(value) {
  return Math.round(Number.isFinite(value) ? value : 0);
}

function escapeCell(value) {
  return String(value).replaceAll('|', '\\|');
}

const invokedAsCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedAsCli) {
  runCli().catch((error) => {
    console.error(`[analytics] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
