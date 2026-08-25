import type { TelemetryEnvelope } from './Telemetry';

export interface CombatMetric {
  readonly encounterId: string;
  readonly attempts: number;
  readonly victories: number;
  readonly defeats: number;
  readonly winRate: number;
  readonly averageDurationMs: number;
}

export interface SoftLaunchSummary {
  readonly sessions: number;
  readonly returningSessions: number;
  readonly returningRate: number;
  readonly standardRunsStarted: number;
  readonly dailyRunsStarted: number;
  readonly tutorialOpened: number;
  readonly tutorialCompleted: number;
  readonly tutorialSkipped: number;
  readonly tutorialCompletionRate: number;
  readonly heroSelections: Readonly<Record<string, number>>;
  readonly shopPurchases: number;
  readonly paidRerolls: number;
  readonly rewardedRerolls: number;
  readonly rewardedAdAttempts: number;
  readonly rewardedAdCompletions: number;
  readonly rewardedAdCompletionRate: number;
  readonly eventChoices: number;
  readonly fusions: number;
  readonly loopEntries: Readonly<Record<string, number>>;
  readonly cashouts: number;
  readonly averageCashoutScore: number;
  readonly combats: readonly CombatMetric[];
}

export function summarizeTelemetry(events: readonly TelemetryEnvelope[]): SoftLaunchSummary {
  let sessions = 0;
  let returningSessions = 0;
  let standardRunsStarted = 0;
  let dailyRunsStarted = 0;
  let tutorialOpened = 0;
  let tutorialCompleted = 0;
  let tutorialSkipped = 0;
  let shopPurchases = 0;
  let paidRerolls = 0;
  let rewardedRerolls = 0;
  let rewardedAdAttempts = 0;
  let rewardedAdCompletions = 0;
  let eventChoices = 0;
  let fusions = 0;
  let cashouts = 0;
  let cashoutScoreTotal = 0;
  const heroSelections: Record<string, number> = {};
  const loopEntries: Record<string, number> = {};
  const combats = new Map<string, { attempts: number; victories: number; defeats: number; durationTotal: number }>();

  for (const event of events) {
    switch (event.name) {
      case 'session_start': {
        sessions += 1;
        const payload = event.payload as { returning: boolean };
        if (payload.returning) returningSessions += 1;
        break;
      }
      case 'run_started': {
        const payload = event.payload as { mode: 'standard' | 'daily' };
        if (payload.mode === 'daily') dailyRunsStarted += 1;
        else standardRunsStarted += 1;
        break;
      }
      case 'tutorial_opened': tutorialOpened += 1; break;
      case 'tutorial_completed': tutorialCompleted += 1; break;
      case 'tutorial_skipped': tutorialSkipped += 1; break;
      case 'hero_selected': {
        const payload = event.payload as { heroId: string };
        heroSelections[payload.heroId] = (heroSelections[payload.heroId] ?? 0) + 1;
        break;
      }
      case 'shop_purchase': shopPurchases += 1; break;
      case 'shop_reroll': {
        const payload = event.payload as { source: 'coins' | 'rewarded' };
        if (payload.source === 'rewarded') rewardedRerolls += 1;
        else paidRerolls += 1;
        break;
      }
      case 'ad_result': {
        const payload = event.payload as { placement: string; format: string; result: string };
        if (payload.placement === 'shop-free-reroll' && payload.format === 'rewarded') {
          rewardedAdAttempts += 1;
          if (payload.result === 'rewarded') rewardedAdCompletions += 1;
        }
        break;
      }
      case 'run_event_choice': eventChoices += 1; break;
      case 'fusion_used': fusions += 1; break;
      case 'loop_entered': {
        const payload = event.payload as { loopNumber: number };
        const key = String(payload.loopNumber);
        loopEntries[key] = (loopEntries[key] ?? 0) + 1;
        break;
      }
      case 'run_cashout': {
        const payload = event.payload as { score: number };
        cashouts += 1;
        cashoutScoreTotal += finiteNonNegative(payload.score);
        break;
      }
      case 'combat_finished': {
        const payload = event.payload as { encounterId: string; outcome: 'victory' | 'defeat'; durationMs: number };
        const metric = combats.get(payload.encounterId) ?? { attempts: 0, victories: 0, defeats: 0, durationTotal: 0 };
        metric.attempts += 1;
        if (payload.outcome === 'victory') metric.victories += 1;
        else metric.defeats += 1;
        metric.durationTotal += finiteNonNegative(payload.durationMs);
        combats.set(payload.encounterId, metric);
        break;
      }
      default: break;
    }
  }

  return {
    sessions,
    returningSessions,
    returningRate: ratio(returningSessions, sessions),
    standardRunsStarted,
    dailyRunsStarted,
    tutorialOpened,
    tutorialCompleted,
    tutorialSkipped,
    tutorialCompletionRate: ratio(tutorialCompleted, tutorialOpened),
    heroSelections: sortRecord(heroSelections),
    shopPurchases,
    paidRerolls,
    rewardedRerolls,
    rewardedAdAttempts,
    rewardedAdCompletions,
    rewardedAdCompletionRate: ratio(rewardedAdCompletions, rewardedAdAttempts),
    eventChoices,
    fusions,
    loopEntries: sortRecord(loopEntries),
    cashouts,
    averageCashoutScore: cashouts > 0 ? cashoutScoreTotal / cashouts : 0,
    combats: [...combats.entries()]
      .map(([encounterId, metric]) => ({
        encounterId,
        attempts: metric.attempts,
        victories: metric.victories,
        defeats: metric.defeats,
        winRate: ratio(metric.victories, metric.attempts),
        averageDurationMs: metric.attempts > 0 ? metric.durationTotal / metric.attempts : 0,
      }))
      .sort((a, b) => a.encounterId.localeCompare(b.encounterId)),
  };
}

function ratio(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function sortRecord(values: Record<string, number>): Readonly<Record<string, number>> {
  return Object.fromEntries(Object.entries(values).sort(([a], [b]) => a.localeCompare(b)));
}
