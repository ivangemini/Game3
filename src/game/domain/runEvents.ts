import { createSeededRng } from './rng';

export type RunEventReward =
  | { readonly kind: 'coins'; readonly amount: number }
  | { readonly kind: 'item'; readonly definitionIds: readonly string[] }
  | {
      readonly kind: 'gamble';
      readonly winChancePct: number;
      readonly winCoins: number;
      readonly loseCoins: number;
    };

export interface RunEventChoice {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly costCoins: number;
  readonly reward: RunEventReward;
}

export interface RunEventDefinition {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly choices: readonly RunEventChoice[];
  readonly preferredWorlds?: readonly number[];
}

export interface RunEventResolution {
  readonly eventId: string;
  readonly choiceId: string;
  readonly costCoins: number;
  readonly rewardCoins: number;
  readonly rewardDefinitionId?: string;
  readonly resultText: string;
}

export const PREFERRED_WORLD_EVENT_WEIGHT = 3;

export function runEventSelectionWeight(event: RunEventDefinition, world?: number): number {
  if (typeof world !== 'number' || !Number.isFinite(world)) return 1;
  const safeWorld = Math.max(1, Math.floor(world));
  return event.preferredWorlds?.includes(safeWorld) ? PREFERRED_WORLD_EVENT_WEIGHT : 1;
}

export function selectRunEvent(
  events: readonly RunEventDefinition[],
  runSeed: string | number,
  eventIndex: number,
  previousEventId?: string | null,
  world?: number,
): RunEventDefinition {
  if (events.length === 0) throw new RangeError('Cannot select from an empty run-event pool');
  const safeIndex = Math.max(0, Math.floor(eventIndex));
  const ordered = [...events].sort((a, b) => a.id.localeCompare(b.id));
  const eligible = ordered.length > 1 && previousEventId
    ? ordered.filter((event) => event.id !== previousEventId)
    : ordered;
  const weighted = eligible.flatMap((event) =>
    Array.from({ length: runEventSelectionWeight(event, world) }, () => event),
  );
  return createSeededRng(`${String(runSeed)}:event:${safeIndex}`).pick(weighted);
}

export function resolveRunEventChoice(
  event: RunEventDefinition,
  choiceId: string,
  runSeed: string | number,
  eventIndex: number,
): RunEventResolution {
  const choice = event.choices.find((candidate) => candidate.id === choiceId);
  if (!choice) throw new Error(`Unknown choice ${choiceId} for run event ${event.id}`);

  const safeCost = Math.max(0, Math.floor(choice.costCoins));
  const reward = choice.reward;
  if (reward.kind === 'coins') {
    const amount = Math.max(0, Math.floor(reward.amount));
    return {
      eventId: event.id,
      choiceId,
      costCoins: safeCost,
      rewardCoins: amount,
      resultText: amount > 0 ? `The universe reluctantly pays ${amount} coins.` : 'Nothing explodes. Suspicious.',
    };
  }

  if (reward.kind === 'item') {
    if (reward.definitionIds.length === 0) throw new RangeError(`Event choice ${choice.id} has an empty item pool`);
    const definitionId = createSeededRng(
      `${String(runSeed)}:event:${Math.max(0, Math.floor(eventIndex))}:${event.id}:${choice.id}:item`,
    ).pick([...reward.definitionIds].sort());
    return {
      eventId: event.id,
      choiceId,
      costCoins: safeCost,
      rewardCoins: 0,
      rewardDefinitionId: definitionId,
      resultText: 'Something deeply questionable falls into the backpack.',
    };
  }

  const rng = createSeededRng(
    `${String(runSeed)}:event:${Math.max(0, Math.floor(eventIndex))}:${event.id}:${choice.id}:gamble`,
  );
  const chance = Math.max(0, Math.min(100, reward.winChancePct));
  const won = rng.next() * 100 < chance;
  const rewardCoins = Math.max(0, Math.floor(won ? reward.winCoins : reward.loseCoins));
  return {
    eventId: event.id,
    choiceId,
    costCoins: safeCost,
    rewardCoins,
    resultText: won
      ? `The bad idea works. Somehow. +${rewardCoins} coins.`
      : rewardCoins > 0
        ? `Mostly a disaster, but you recover ${rewardCoins} coins.`
        : 'The machine makes a sad noise and keeps your money.',
  };
}
