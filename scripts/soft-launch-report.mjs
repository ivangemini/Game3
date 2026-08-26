import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const SESSION_AGE_COVERAGE_SAMPLE = 10;
const SESSION_AGE_COVERAGE_TARGET = 0.95;
const FIRST_BOSS_PACING_SAMPLE = 20;
const FIRST_BOSS_MIN_MS = 3 * 60_000;
const FIRST_BOSS_MAX_MS = 5 * 60_000;
const BASE_CAMPAIGN_PACING_SAMPLE = 15;
const BASE_CAMPAIGN_MIN_MS = 32 * 60_000;
const BASE_CAMPAIGN_MAX_MS = 42 * 60_000;

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

export function buildReviewSignals(summary) {
  const signals = [];
  const ageCoverage = sessionAgeCoverage(summary);
  const ageSample = Number.isFinite(summary.sessions) ? Math.max(0, summary.sessions) : 0;

  if (ageSample < SESSION_AGE_COVERAGE_SAMPLE) {
    signals.push(`[DATA] Return-age instrumentation: ${ageSample}/${SESSION_AGE_COVERAGE_SAMPLE} session starts collected before applying the coverage gate.`);
  } else if (ageCoverage < SESSION_AGE_COVERAGE_TARGET) {
    signals.push(`[WATCH] Return-age instrumentation coverage is ${percent(ageCoverage)}; target is at least ${percent(SESSION_AGE_COVERAGE_TARGET)} before interpreting age-bucket mix.`);
  } else {
    signals.push(`[ON TARGET] Return-age instrumentation coverage is ${percent(ageCoverage)}.`);
  }

  const firstBossSample = finiteCount(summary.sessionsWithFirstBoss);
  if (firstBossSample < FIRST_BOSS_PACING_SAMPLE) {
    signals.push(`[DATA] First-boss pacing: ${firstBossSample}/${FIRST_BOSS_PACING_SAMPLE} reached sessions; hold tuning until the operational sample floor is met.`);
  } else {
    signals.push(pacingSignal('First-boss pacing', summary.medianTimeToFirstBossMs, FIRST_BOSS_MIN_MS, FIRST_BOSS_MAX_MS));
  }

  const campaignSample = finiteCount(summary.sessionsCompletingBaseCampaign);
  if (campaignSample < BASE_CAMPAIGN_PACING_SAMPLE) {
    signals.push(`[DATA] Base-campaign pacing: ${campaignSample}/${BASE_CAMPAIGN_PACING_SAMPLE} completions; hold tuning until the operational sample floor is met.`);
  } else {
    signals.push(pacingSignal('Base-campaign pacing', summary.medianBaseCampaignDurationMs, BASE_CAMPAIGN_MIN_MS, BASE_CAMPAIGN_MAX_MS));
  }

  return signals;
}

export function renderMarkdown(summary) {
  const returnBuckets = Object.entries(summary.returnAgeBuckets ?? {});
  const reviewSignals = buildReviewSignals(summary);
  const daily = summary.dailyRetention ?? emptyDailyRetention();
  const mastery = summary.heroMastery ?? emptyHeroMastery();
  const grudges = summary.bossGrudges ?? emptyBossGrudges();
  const archive = summary.archiveDiscovery ?? emptyArchiveDiscovery();
  const dailyStreakBuckets = Object.entries(daily.streakBuckets ?? {});
  const masteryLevelUpsByHero = Object.entries(mastery.levelUpsByHero ?? {});
  const masteryMaxByHero = Object.entries(mastery.maxObservedLevelByHero ?? {});
  const grudgeBossIds = [...new Set([
    ...Object.keys(grudges.startsByBoss ?? {}),
    ...Object.keys(grudges.resolutionsByBoss ?? {}),
  ])].sort();
  const lines = [
    '# Junkpack Soft-launch Report',
    '',
    `Sessions: **${summary.sessions}** · returning **${percent(summary.returningRate)}**`,
    `Return-age telemetry coverage: **${percent(sessionAgeCoverage(summary))}** (${finiteCount(summary.sessionsWithAgeBucket)}/${summary.sessions}).`,
    returnBuckets.length > 0
      ? `Return age buckets: ${returnBuckets.map(([bucket, count]) => `${bucket} **${count}**`).join(' · ')}`
      : 'Return age buckets: no session-age events matched to session starts in this export.',
    '',
    '## Review signals',
    '',
    ...reviewSignals.map((signal) => `- ${signal}`),
    '',
    'These are operational triage signals, not statistical-significance claims. Return-age buckets describe the age mix of observed sessions; they are not D1/D7 cohort-retention rates.',
    '',
    '## First-session funnel',
    '',
    `- Hero selection reach: **${percent(summary.heroSelectionSessionRate)}** (${summary.sessionsWithHeroSelection}/${summary.sessions}); p50 ${duration(summary.medianTimeToHeroMs)}, p90 ${duration(summary.p90TimeToHeroMs)}.`,
    `- First combat reach: **${percent(summary.firstCombatSessionRate)}** (${summary.sessionsWithFirstCombat}/${summary.sessions}); p50 ${duration(summary.medianTimeToFirstCombatMs)}, p90 ${duration(summary.p90TimeToFirstCombatMs)}.`,
    `- First boss reach: **${percent(summary.firstBossSessionRate)}** (${summary.sessionsWithFirstBoss}/${summary.sessions}); p50 ${duration(summary.medianTimeToFirstBossMs)}, p90 ${duration(summary.p90TimeToFirstBossMs)}. Target p50: **3–5 min**.`,
    `- Base campaign completion: **${percent(summary.baseCampaignCompletionRate)}** (${summary.sessionsCompletingBaseCampaign}/${summary.sessions}); p50 ${duration(summary.medianBaseCampaignDurationMs)}, p90 ${duration(summary.p90BaseCampaignDurationMs)}. Target p50: **32–42 min**.`,
    `- Field Manual opened/completed/skipped: **${summary.tutorialOpened}/${summary.tutorialCompleted}/${summary.tutorialSkipped}**; completion ${percent(summary.tutorialCompletionRate)}.`,
    '',
    '## Run systems',
    '',
    `- Standard/Daily runs started: **${summary.standardRunsStarted}/${summary.dailyRunsStarted}**.`,
    `- Purchases: **${summary.shopPurchases}** · paid rerolls: **${summary.paidRerolls}** · rewarded rerolls: **${summary.rewardedRerolls}**.`,
    `- Event choices: **${summary.eventChoices}** · fusions: **${summary.fusions}** · cashouts: **${summary.cashouts}** · avg cashout score: **${round(summary.averageCashoutScore)}**.`,
    `- Rewarded ad completion: **${percent(summary.rewardedAdCompletionRate)}** (${summary.rewardedAdCompletions}/${summary.rewardedAdAttempts}).`,
    '',
    '## Daily retention funnel',
    '',
    `- Daily start reach: **${percent(daily.dailyStartSessionRate)}** (${daily.sessionsStartingDaily}/${summary.sessions} sessions).`,
    `- Daily Board open: **${percent(daily.boardOpenRateAmongDailySessions)}** (${daily.sessionsOpeningBoard}/${daily.sessionsStartingDaily} Daily sessions).`,
    `- Contract completion: **${percent(daily.contractCompletionRateAmongDailySessions)}** (${daily.sessionsCompletingContract}/${daily.sessionsStartingDaily} Daily sessions; ${daily.contractCompletions} completion events).`,
    `- Complete → claim: **${percent(daily.contractClaimRateAmongCompletedSessions)}** (${daily.sessionsClaimingContract}/${daily.sessionsCompletingContract} completing sessions; ${daily.contractClaims} claims).`,
    `- 3/5/7-day track rewards claimed: **${daily.trackRewardClaims}** across **${daily.sessionsClaimingTrackReward}** sessions.`,
    dailyStreakBuckets.length > 0
      ? `- Daily Board streak buckets: ${dailyStreakBuckets.map(([bucket, count]) => `${bucket} **${count}**`).join(' · ')}.`
      : '- Daily Board streak buckets: no board-open samples in this export.',
    '',
    'Daily streak buckets are local progression-state samples from sessions that opened the board; they are not D1/D7 retention measurements.',
    '',
    '## Mastery & revenge retention',
    '',
    `- Sessions with a Hero Mastery level-up: **${percent(mastery.sessionLevelUpRate)}** (${mastery.sessionsLevelingUp}/${summary.sessions}).`,
    `- Mastery level-ups: **${mastery.levelUpEvents}** · cosmetic milestones crossed: **${mastery.cosmeticRewardUnlocks}** · max observed emitted level: **${mastery.maxObservedLevel}**.`,
    masteryLevelUpsByHero.length > 0
      ? `- Level-up events by hero: ${masteryLevelUpsByHero.map(([hero, count]) => `${hero} **${count}**`).join(' · ')}.`
      : '- Level-up events by hero: no mastery level-up events in this export.',
    masteryMaxByHero.length > 0
      ? `- Max observed emitted level by hero: ${masteryMaxByHero.map(([hero, level]) => `${hero} **${level}**`).join(' · ')}.`
      : '- Max observed emitted level by hero: no mastery level-up events in this export.',
    `- Grudge start reach: **${percent(grudges.grudgeStartSessionRate)}** (${grudges.sessionsStartingGrudge}/${summary.sessions} sessions; ${grudges.grudgeStarts} starts).`,
    `- Grudge resolve reach: **${percent(grudges.grudgeResolveSessionRate)}** (${grudges.sessionsResolvingGrudge}/${summary.sessions} sessions; ${grudges.grudgeResolutions} resolutions).`,
    `- Aggregate resolve/start volume ratio: **${percent(grudges.aggregateResolveToStartRatio)}** (${grudges.grudgeResolutions}/${grudges.grudgeStarts}).`,
    '',
    'Because analytics uses ephemeral session IDs, aggregate grudge resolve/start volume is not a player-level revenge conversion rate. A revenge may start in one session and resolve in another, so use this ratio only as a trend signal alongside the per-boss volumes below.',
    '',
  ];

  if (grudgeBossIds.length === 0) {
    lines.push('No boss-grudge transitions in this export.');
  } else {
    lines.push('| Boss family | Grudges started | Grudges resolved | Aggregate ratio |');
    lines.push('| --- | ---: | ---: | ---: |');
    for (const bossId of grudgeBossIds) {
      const starts = finiteCount(grudges.startsByBoss?.[bossId]);
      const resolutions = finiteCount(grudges.resolutionsByBoss?.[bossId]);
      lines.push(`| ${escapeCell(bossId)} | ${starts} | ${resolutions} | ${percent(starts > 0 ? resolutions / starts : 0)} |`);
    }
  }

  lines.push(
    '',
    '## Archive discovery',
    '',
    `- Junk Archive reach: **${percent(archive.archiveViewSessionRate)}** (${archive.sessionsViewingArchive}/${summary.sessions} sessions).`,
    `- Recipe Book reach: **${percent(archive.recipeViewSessionRate)}** (${archive.sessionsViewingRecipes}/${summary.sessions} sessions; ${archive.recipeTabViews} recipe-tab views).`,
    `- Sessions seeing at least one ALMOST SOLVED recipe: **${percent(archive.almostSolvedExposureRateAmongRecipeViewers)}** (${archive.sessionsViewingAlmostSolved}/${archive.sessionsViewingRecipes} Recipe Book sessions).`,
    `- Maximum clue state observed in one Archive view: **${archive.maxTracedRecipesObserved} traced** · **${archive.maxAlmostSolvedRecipesObserved} almost solved**.`,
    '',
    'Archive events contain only tab name and aggregate clue counts. They do not transmit recipe IDs, item IDs or the hidden result, and the exposure rate is an ephemeral-session UX signal rather than a cross-session discovery cohort.',
    '',
    '## Encounter pacing',
    '',
  );

  if (summary.combats.length === 0) {
    lines.push('No completed combats in this export.');
  } else {
    lines.push('| Encounter | Attempts | Win rate | Avg | p50 | p90 |');
    lines.push('| --- | ---: | ---: | ---: | ---: | ---: |');
    for (const combat of summary.combats) {
      lines.push(`| ${escapeCell(combat.encounterId)} | ${combat.attempts} | ${percent(combat.winRate)} | ${duration(combat.averageDurationMs)} | ${duration(combat.medianDurationMs)} | ${duration(combat.p90DurationMs)} |`);
    }
  }

  lines.push('', '## Campaign world funnel', '');
  const campaignWorlds = summary.campaignWorlds ?? [];
  if (campaignWorlds.length === 0) {
    lines.push('No campaign-world milestones in this export.');
  } else {
    lines.push('| World | Boss | Cleared | Session clear | From previous | p50 from run start | p90 |');
    lines.push('| ---: | --- | ---: | ---: | ---: | ---: | ---: |');
    for (const world of campaignWorlds) {
      const continuation = world.previousWorldContinuationRate === null ? '—' : percent(world.previousWorldContinuationRate);
      lines.push(`| ${world.world} | ${escapeCell(world.bossEncounterId)} | ${world.sessionsCleared} | ${percent(world.sessionClearRate)} | ${continuation} | ${duration(world.medianTimeFromRunStartMs)} | ${duration(world.p90TimeFromRunStartMs)} |`);
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
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, verbatimModuleSyntax: true },
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

function pacingSignal(label, medianMs, minMs, maxMs) {
  const value = Number.isFinite(medianMs) ? Math.max(0, medianMs) : 0;
  if (value < minMs) return `[WATCH] ${label} p50 is ${duration(value)}, faster than the ${duration(minMs)}–${duration(maxMs)} target.`;
  if (value > maxMs) return `[WATCH] ${label} p50 is ${duration(value)}, slower than the ${duration(minMs)}–${duration(maxMs)} target.`;
  return `[ON TARGET] ${label} p50 is ${duration(value)} within the ${duration(minMs)}–${duration(maxMs)} target.`;
}

function sessionAgeCoverage(summary) {
  if (Number.isFinite(summary.sessionAgeCoverageRate)) return clampRate(summary.sessionAgeCoverageRate);
  const bucketTotal = Object.values(summary.returnAgeBuckets ?? {}).reduce((sum, value) => sum + finiteCount(value), 0);
  return summary.sessions > 0 ? clampRate(bucketTotal / summary.sessions) : 0;
}

function emptyDailyRetention() {
  return {
    sessionsStartingDaily: 0, dailyStartSessionRate: 0,
    sessionsOpeningBoard: 0, boardOpenRateAmongDailySessions: 0,
    sessionsCompletingContract: 0, contractCompletionRateAmongDailySessions: 0,
    sessionsClaimingContract: 0, contractClaimRateAmongCompletedSessions: 0,
    sessionsClaimingTrackReward: 0, contractCompletions: 0, contractClaims: 0, trackRewardClaims: 0,
    streakBuckets: {},
  };
}

function emptyHeroMastery() {
  return {
    sessionsLevelingUp: 0, sessionLevelUpRate: 0, levelUpEvents: 0, cosmeticRewardUnlocks: 0,
    maxObservedLevel: 0, levelUpsByHero: {}, maxObservedLevelByHero: {},
  };
}

function emptyBossGrudges() {
  return {
    sessionsStartingGrudge: 0, grudgeStartSessionRate: 0,
    sessionsResolvingGrudge: 0, grudgeResolveSessionRate: 0,
    grudgeStarts: 0, grudgeResolutions: 0, aggregateResolveToStartRatio: 0,
    startsByBoss: {}, resolutionsByBoss: {},
  };
}

function emptyArchiveDiscovery() {
  return {
    sessionsViewingArchive: 0,
    archiveViewSessionRate: 0,
    sessionsViewingRecipes: 0,
    recipeViewSessionRate: 0,
    recipeTabViews: 0,
    sessionsViewingAlmostSolved: 0,
    almostSolvedExposureRateAmongRecipeViewers: 0,
    maxTracedRecipesObserved: 0,
    maxAlmostSolvedRecipesObserved: 0,
  };
}

function finiteCount(value) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function clampRate(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
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
