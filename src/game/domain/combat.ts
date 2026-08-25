import type { ItemBonuses } from './synergies';
import type { Cell, ItemTag } from './types';

export interface CombatItemProfile {
  readonly definitionId: string;
  readonly triggerIntervalMs: number;
  readonly damage: number;
  readonly poisonOnHit?: number;
  readonly shieldOnTrigger?: number;
  readonly extraLaserDamage?: number;
}

export interface CombatBuildItem {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly triggerIntervalMs: number;
  readonly damage: number;
  readonly poisonOnHit: number;
  readonly shieldOnTrigger: number;
  readonly bonusLaserShots: number;
  readonly extraLaserDamage: number;
  readonly chaosPower: number;
  readonly scrapArmor: number;
  readonly occupiedCells: readonly Cell[];
  readonly magnetic: boolean;
  readonly tags: readonly ItemTag[];
}

export interface EnemyInterferenceDefinition {
  readonly kind: 'channel-jam';
  readonly intervalMs: number;
  readonly telegraphMs: number;
  readonly durationMs: number;
}

export interface EnemyCellInterferenceDefinition {
  readonly kind: 'slime-cell';
  readonly intervalMs: number;
  readonly telegraphMs: number;
  readonly durationMs: number;
}

export interface EnemyRowInterferenceDefinition {
  readonly kind: 'magnet-row';
  readonly intervalMs: number;
  readonly telegraphMs: number;
  readonly durationMs: number;
}

export interface EnemyTagInterferenceDefinition {
  readonly kind: 'tag-eclipse';
  readonly intervalMs: number;
  readonly telegraphMs: number;
  readonly durationMs: number;
}

export interface EnemyCombatDefinition {
  readonly id: string;
  readonly name: string;
  readonly maxHp: number;
  readonly attackIntervalMs: number;
  readonly attackDamage: number;
  readonly interference?: EnemyInterferenceDefinition;
  readonly cellInterference?: EnemyCellInterferenceDefinition;
  readonly rowInterference?: EnemyRowInterferenceDefinition;
  readonly tagInterference?: EnemyTagInterferenceDefinition;
}

export type CombatOutcome = 'active' | 'victory' | 'defeat';

export type CombatQueuedEffect =
  | { readonly kind: 'item-trigger'; readonly dueAtMs: number; readonly sequence: number; readonly itemInstanceId: string }
  | { readonly kind: 'enemy-attack'; readonly dueAtMs: number; readonly sequence: number }
  | { readonly kind: 'poison-tick'; readonly dueAtMs: number; readonly sequence: number }
  | { readonly kind: 'boss-telegraph'; readonly dueAtMs: number; readonly sequence: number; readonly itemInstanceId: string }
  | { readonly kind: 'boss-interference'; readonly dueAtMs: number; readonly sequence: number; readonly itemInstanceId: string }
  | { readonly kind: 'boss-cell-telegraph'; readonly dueAtMs: number; readonly sequence: number; readonly cell: Cell }
  | { readonly kind: 'boss-cell-interference'; readonly dueAtMs: number; readonly sequence: number; readonly cell: Cell }
  | { readonly kind: 'boss-row-telegraph'; readonly dueAtMs: number; readonly sequence: number; readonly row: number }
  | { readonly kind: 'boss-row-interference'; readonly dueAtMs: number; readonly sequence: number; readonly row: number }
  | { readonly kind: 'boss-tag-telegraph'; readonly dueAtMs: number; readonly sequence: number; readonly tag: ItemTag }
  | { readonly kind: 'boss-tag-interference'; readonly dueAtMs: number; readonly sequence: number; readonly tag: ItemTag };

export type CombatPresentationEvent =
  | { readonly kind: 'item-triggered'; readonly atMs: number; readonly itemInstanceId: string }
  | { readonly kind: 'item-jammed'; readonly atMs: number; readonly itemInstanceId: string }
  | { readonly kind: 'item-slimed'; readonly atMs: number; readonly itemInstanceId: string; readonly cell: Cell }
  | { readonly kind: 'item-scrambled'; readonly atMs: number; readonly itemInstanceId: string; readonly row: number }
  | { readonly kind: 'item-eclipsed'; readonly atMs: number; readonly itemInstanceId: string; readonly tag: ItemTag }
  | { readonly kind: 'enemy-damaged'; readonly atMs: number; readonly itemInstanceId: string; readonly amount: number; readonly source: 'item' | 'poison' }
  | { readonly kind: 'poison-applied'; readonly atMs: number; readonly itemInstanceId: string; readonly amount: number }
  | { readonly kind: 'shield-gained'; readonly atMs: number; readonly itemInstanceId: string; readonly amount: number }
  | { readonly kind: 'player-damaged'; readonly atMs: number; readonly amount: number; readonly absorbedByShield: number }
  | { readonly kind: 'boss-telegraph'; readonly atMs: number; readonly itemInstanceId: string; readonly impactAtMs: number }
  | { readonly kind: 'boss-jammed'; readonly atMs: number; readonly itemInstanceId: string; readonly durationMs: number }
  | { readonly kind: 'boss-cell-telegraph'; readonly atMs: number; readonly cell: Cell; readonly impactAtMs: number }
  | { readonly kind: 'boss-cell-slimed'; readonly atMs: number; readonly cell: Cell; readonly durationMs: number }
  | { readonly kind: 'boss-row-telegraph'; readonly atMs: number; readonly row: number; readonly impactAtMs: number; readonly magneticPriority: boolean }
  | { readonly kind: 'boss-row-scrambled'; readonly atMs: number; readonly row: number; readonly durationMs: number }
  | { readonly kind: 'boss-tag-telegraph'; readonly atMs: number; readonly tag: ItemTag; readonly impactAtMs: number; readonly affectedItemCount: number }
  | { readonly kind: 'boss-tag-eclipsed'; readonly atMs: number; readonly tag: ItemTag; readonly durationMs: number; readonly affectedItemCount: number }
  | { readonly kind: 'outcome'; readonly atMs: number; readonly outcome: Exclude<CombatOutcome, 'active'> };

export interface CombatSetup {
  readonly playerMaxHp: number;
  readonly items: ReadonlyMap<string, CombatBuildItem>;
  readonly enemy: EnemyCombatDefinition;
}

export interface CombatState {
  readonly timeMs: number;
  readonly playerHp: number;
  readonly playerShield: number;
  readonly enemyHp: number;
  readonly enemyPoison: number;
  readonly outcome: CombatOutcome;
  readonly nextSequence: number;
  readonly queue: readonly CombatQueuedEffect[];
  readonly jammedUntilByItemId: Readonly<Record<string, number>>;
  readonly slimedUntilByCellKey: Readonly<Record<string, number>>;
  readonly scrambledUntilByRow: Readonly<Record<string, number>>;
  readonly eclipsedUntilByTag: Readonly<Record<string, number>>;
}

export interface CombatAdvanceResult {
  readonly state: CombatState;
  readonly events: readonly CombatPresentationEvent[];
}

const POISON_TICK_INTERVAL_MS = 1000;
const MIN_TRIGGER_INTERVAL_MS = 250;
const ECLIPSE_TAG_PRIORITY: readonly ItemTag[] = [
  'weapon', 'device', 'poison', 'pet', 'laser', 'chaos', 'metal', 'food', 'antenna', 'slime',
  'battery', 'cat', 'duck', 'magnet',
];
const cellKey = (cell: Cell): string => `${cell.x}:${cell.y}`;
const rowKey = (row: number): string => String(Math.max(0, Math.floor(row)));
const tagKey = (tag: ItemTag): string => tag;

function normalizeNonNegativeInt(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export function createCombatBuildItem(
  instanceId: string,
  profile: CombatItemProfile,
  bonuses: ItemBonuses | undefined,
  occupiedCells: readonly Cell[] = [],
  magnetic = false,
  tags: readonly ItemTag[] = [],
): CombatBuildItem {
  const triggerSpeedPct = Math.max(0, bonuses?.triggerSpeedPct ?? 0);
  const triggerIntervalMs = Math.max(MIN_TRIGGER_INTERVAL_MS, Math.round(profile.triggerIntervalMs / (1 + triggerSpeedPct / 100)));
  return {
    instanceId,
    definitionId: profile.definitionId,
    triggerIntervalMs,
    damage: normalizeNonNegativeInt(profile.damage),
    poisonOnHit: normalizeNonNegativeInt((profile.poisonOnHit ?? 0) + (bonuses?.poisonOnHit ?? 0)),
    shieldOnTrigger: normalizeNonNegativeInt(profile.shieldOnTrigger ?? 0),
    bonusLaserShots: normalizeNonNegativeInt(bonuses?.bonusLaserShots ?? 0),
    extraLaserDamage: normalizeNonNegativeInt(profile.extraLaserDamage ?? profile.damage),
    chaosPower: normalizeNonNegativeInt(bonuses?.chaosPower ?? 0),
    scrapArmor: normalizeNonNegativeInt(bonuses?.scrapArmor ?? 0),
    occupiedCells: occupiedCells.map((cell) => ({ ...cell })),
    magnetic,
    tags: [...new Set(tags)].sort((a, b) => eclipsePriority(a) - eclipsePriority(b) || a.localeCompare(b)),
  };
}

export function createCombatState(setup: CombatSetup): CombatState {
  if (!Number.isFinite(setup.playerMaxHp) || setup.playerMaxHp <= 0) throw new RangeError('playerMaxHp must be positive');
  if (setup.enemy.maxHp <= 0 || setup.enemy.attackIntervalMs <= 0 || setup.enemy.attackDamage < 0) throw new RangeError('Enemy combat values are invalid');
  if (setup.enemy.interference) validateTimedInterference(setup.enemy.interference);
  if (setup.enemy.cellInterference) validateTimedInterference(setup.enemy.cellInterference);
  if (setup.enemy.rowInterference) validateTimedInterference(setup.enemy.rowInterference);
  if (setup.enemy.tagInterference) validateTimedInterference(setup.enemy.tagInterference);

  let nextSequence = 0;
  const queue: CombatQueuedEffect[] = [];
  let initialShield = 0;
  const orderedItems = [...setup.items.values()].sort((a, b) => a.instanceId.localeCompare(b.instanceId));
  for (const item of orderedItems) {
    queue.push({ kind: 'item-trigger', dueAtMs: item.triggerIntervalMs, sequence: nextSequence, itemInstanceId: item.instanceId });
    nextSequence += 1;
    initialShield += item.scrapArmor * 2;
  }
  queue.push({ kind: 'enemy-attack', dueAtMs: setup.enemy.attackIntervalMs, sequence: nextSequence });
  nextSequence += 1;
  queue.push({ kind: 'poison-tick', dueAtMs: POISON_TICK_INTERVAL_MS, sequence: nextSequence });
  nextSequence += 1;
  if (setup.enemy.interference) nextSequence = scheduleChannelInterference(queue, setup, setup.enemy.interference.intervalMs, nextSequence);
  if (setup.enemy.cellInterference) nextSequence = scheduleCellInterference(queue, setup, setup.enemy.cellInterference.intervalMs, nextSequence);
  if (setup.enemy.rowInterference) nextSequence = scheduleRowInterference(queue, setup, setup.enemy.rowInterference.intervalMs, nextSequence);
  if (setup.enemy.tagInterference) nextSequence = scheduleTagInterference(queue, setup, setup.enemy.tagInterference.intervalMs, nextSequence);

  return {
    timeMs: 0,
    playerHp: Math.round(setup.playerMaxHp),
    playerShield: initialShield,
    enemyHp: Math.round(setup.enemy.maxHp),
    enemyPoison: 0,
    outcome: 'active',
    nextSequence,
    queue: sortQueue(queue),
    jammedUntilByItemId: {},
    slimedUntilByCellKey: {},
    scrambledUntilByRow: {},
    eclipsedUntilByTag: {},
  };
}

export function advanceCombat(inputState: CombatState, setup: CombatSetup, deltaMs: number): CombatAdvanceResult {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) throw new RangeError('deltaMs must be non-negative');
  if (inputState.outcome !== 'active' || deltaMs === 0) return { state: inputState, events: [] };

  const targetTime = inputState.timeMs + deltaMs;
  let resolvedTimeMs = targetTime;
  let playerHp = inputState.playerHp;
  let playerShield = inputState.playerShield;
  let enemyHp = inputState.enemyHp;
  let enemyPoison = inputState.enemyPoison;
  let outcome: CombatOutcome = inputState.outcome;
  let nextSequence = inputState.nextSequence;
  const queue = [...inputState.queue];
  const jammedUntilByItemId: Record<string, number> = { ...inputState.jammedUntilByItemId };
  const slimedUntilByCellKey: Record<string, number> = { ...inputState.slimedUntilByCellKey };
  const scrambledUntilByRow: Record<string, number> = { ...inputState.scrambledUntilByRow };
  const eclipsedUntilByTag: Record<string, number> = { ...inputState.eclipsedUntilByTag };
  const events: CombatPresentationEvent[] = [];

  while (queue.length > 0 && outcome === 'active') {
    sortQueueInPlace(queue);
    const nextEffect = queue[0];
    if (!nextEffect || nextEffect.dueAtMs > targetTime) break;
    queue.shift();
    const atMs = nextEffect.dueAtMs;

    if (nextEffect.kind === 'item-trigger') {
      const item = setup.items.get(nextEffect.itemInstanceId);
      if (!item) continue;
      const jammedUntil = jammedUntilByItemId[item.instanceId] ?? 0;
      const slimedCell = item.occupiedCells.find((cell) => (slimedUntilByCellKey[cellKey(cell)] ?? 0) > atMs);
      const scrambledCell = item.occupiedCells.find((cell) => (scrambledUntilByRow[rowKey(cell.y)] ?? 0) > atMs);
      const eclipsedTag = item.tags.find((tag) => (eclipsedUntilByTag[tagKey(tag)] ?? 0) > atMs);
      if (jammedUntil > atMs) {
        events.push({ kind: 'item-jammed', atMs, itemInstanceId: item.instanceId });
      } else if (slimedCell) {
        events.push({ kind: 'item-slimed', atMs, itemInstanceId: item.instanceId, cell: slimedCell });
      } else if (scrambledCell) {
        events.push({ kind: 'item-scrambled', atMs, itemInstanceId: item.instanceId, row: scrambledCell.y });
      } else if (eclipsedTag) {
        events.push({ kind: 'item-eclipsed', atMs, itemInstanceId: item.instanceId, tag: eclipsedTag });
      } else {
        events.push({ kind: 'item-triggered', atMs, itemInstanceId: item.instanceId });
        const totalDamage = item.damage + item.chaosPower * 2 + item.bonusLaserShots * item.extraLaserDamage;
        if (totalDamage > 0) {
          enemyHp = Math.max(0, enemyHp - totalDamage);
          events.push({ kind: 'enemy-damaged', atMs, itemInstanceId: item.instanceId, amount: totalDamage, source: 'item' });
        }
        if (item.poisonOnHit > 0) {
          enemyPoison += item.poisonOnHit;
          events.push({ kind: 'poison-applied', atMs, itemInstanceId: item.instanceId, amount: item.poisonOnHit });
        }
        if (item.shieldOnTrigger > 0) {
          playerShield += item.shieldOnTrigger;
          events.push({ kind: 'shield-gained', atMs, itemInstanceId: item.instanceId, amount: item.shieldOnTrigger });
        }
        if (enemyHp <= 0) {
          outcome = 'victory';
          resolvedTimeMs = atMs;
          events.push({ kind: 'outcome', atMs, outcome });
          break;
        }
      }
      queue.push({ kind: 'item-trigger', dueAtMs: atMs + item.triggerIntervalMs, sequence: nextSequence, itemInstanceId: item.instanceId });
      nextSequence += 1;
      continue;
    }

    if (nextEffect.kind === 'enemy-attack') {
      const incoming = Math.max(0, Math.round(setup.enemy.attackDamage));
      const absorbedByShield = Math.min(playerShield, incoming);
      const healthDamage = incoming - absorbedByShield;
      playerShield -= absorbedByShield;
      playerHp = Math.max(0, playerHp - healthDamage);
      events.push({ kind: 'player-damaged', atMs, amount: healthDamage, absorbedByShield });
      if (playerHp <= 0) {
        outcome = 'defeat';
        resolvedTimeMs = atMs;
        events.push({ kind: 'outcome', atMs, outcome });
        break;
      }
      queue.push({ kind: 'enemy-attack', dueAtMs: atMs + setup.enemy.attackIntervalMs, sequence: nextSequence });
      nextSequence += 1;
      continue;
    }

    if (nextEffect.kind === 'boss-telegraph') {
      const interference = setup.enemy.interference;
      if (interference) events.push({ kind: 'boss-telegraph', atMs, itemInstanceId: nextEffect.itemInstanceId, impactAtMs: atMs + interference.telegraphMs });
      continue;
    }

    if (nextEffect.kind === 'boss-interference') {
      const interference = setup.enemy.interference;
      if (!interference) continue;
      jammedUntilByItemId[nextEffect.itemInstanceId] = atMs + interference.durationMs;
      events.push({ kind: 'boss-jammed', atMs, itemInstanceId: nextEffect.itemInstanceId, durationMs: interference.durationMs });
      nextSequence = scheduleChannelInterference(queue, setup, atMs + interference.intervalMs, nextSequence);
      continue;
    }

    if (nextEffect.kind === 'boss-cell-telegraph') {
      const interference = setup.enemy.cellInterference;
      if (interference) events.push({ kind: 'boss-cell-telegraph', atMs, cell: nextEffect.cell, impactAtMs: atMs + interference.telegraphMs });
      continue;
    }

    if (nextEffect.kind === 'boss-cell-interference') {
      const interference = setup.enemy.cellInterference;
      if (!interference) continue;
      slimedUntilByCellKey[cellKey(nextEffect.cell)] = atMs + interference.durationMs;
      events.push({ kind: 'boss-cell-slimed', atMs, cell: nextEffect.cell, durationMs: interference.durationMs });
      nextSequence = scheduleCellInterference(queue, setup, atMs + interference.intervalMs, nextSequence);
      continue;
    }

    if (nextEffect.kind === 'boss-row-telegraph') {
      const interference = setup.enemy.rowInterference;
      if (interference) {
        events.push({
          kind: 'boss-row-telegraph',
          atMs,
          row: nextEffect.row,
          impactAtMs: atMs + interference.telegraphMs,
          magneticPriority: rowContainsMagneticItem(setup.items, nextEffect.row),
        });
      }
      continue;
    }

    if (nextEffect.kind === 'boss-row-interference') {
      const interference = setup.enemy.rowInterference;
      if (!interference) continue;
      scrambledUntilByRow[rowKey(nextEffect.row)] = atMs + interference.durationMs;
      events.push({ kind: 'boss-row-scrambled', atMs, row: nextEffect.row, durationMs: interference.durationMs });
      nextSequence = scheduleRowInterference(queue, setup, atMs + interference.intervalMs, nextSequence);
      continue;
    }

    if (nextEffect.kind === 'boss-tag-telegraph') {
      const interference = setup.enemy.tagInterference;
      if (interference) {
        events.push({
          kind: 'boss-tag-telegraph',
          atMs,
          tag: nextEffect.tag,
          impactAtMs: atMs + interference.telegraphMs,
          affectedItemCount: countItemsWithTag(setup.items, nextEffect.tag),
        });
      }
      continue;
    }

    if (nextEffect.kind === 'boss-tag-interference') {
      const interference = setup.enemy.tagInterference;
      if (!interference) continue;
      eclipsedUntilByTag[tagKey(nextEffect.tag)] = atMs + interference.durationMs;
      events.push({
        kind: 'boss-tag-eclipsed',
        atMs,
        tag: nextEffect.tag,
        durationMs: interference.durationMs,
        affectedItemCount: countItemsWithTag(setup.items, nextEffect.tag),
      });
      nextSequence = scheduleTagInterference(queue, setup, atMs + interference.intervalMs, nextSequence);
      continue;
    }

    if (enemyPoison > 0) {
      const poisonDamage = enemyPoison;
      enemyHp = Math.max(0, enemyHp - poisonDamage);
      events.push({ kind: 'enemy-damaged', atMs, itemInstanceId: 'poison', amount: poisonDamage, source: 'poison' });
      enemyPoison = Math.max(0, enemyPoison - 1);
      if (enemyHp <= 0) {
        outcome = 'victory';
        resolvedTimeMs = atMs;
        events.push({ kind: 'outcome', atMs, outcome });
        break;
      }
    }
    queue.push({ kind: 'poison-tick', dueAtMs: atMs + POISON_TICK_INTERVAL_MS, sequence: nextSequence });
    nextSequence += 1;
  }

  for (const [id, until] of Object.entries(jammedUntilByItemId)) if (until <= resolvedTimeMs) delete jammedUntilByItemId[id];
  for (const [key, until] of Object.entries(slimedUntilByCellKey)) if (until <= resolvedTimeMs) delete slimedUntilByCellKey[key];
  for (const [key, until] of Object.entries(scrambledUntilByRow)) if (until <= resolvedTimeMs) delete scrambledUntilByRow[key];
  for (const [key, until] of Object.entries(eclipsedUntilByTag)) if (until <= resolvedTimeMs) delete eclipsedUntilByTag[key];

  return {
    state: {
      timeMs: resolvedTimeMs,
      playerHp,
      playerShield,
      enemyHp,
      enemyPoison,
      outcome,
      nextSequence,
      queue: sortQueue(queue),
      jammedUntilByItemId,
      slimedUntilByCellKey,
      scrambledUntilByRow,
      eclipsedUntilByTag,
    },
    events,
  };
}

function validateTimedInterference(interference: { intervalMs: number; telegraphMs: number; durationMs: number }): void {
  if (interference.intervalMs <= 0 || interference.telegraphMs < 0 || interference.durationMs <= 0 || interference.telegraphMs >= interference.intervalMs) {
    throw new RangeError('Enemy interference values are invalid');
  }
}

function scheduleChannelInterference(queue: CombatQueuedEffect[], setup: CombatSetup, impactAtMs: number, nextSequence: number): number {
  const interference = setup.enemy.interference;
  if (!interference) return nextSequence;
  const targetIds = interferenceTargets(setup.items);
  if (targetIds.length === 0) return nextSequence;
  const cycleIndex = Math.max(0, Math.round(impactAtMs / interference.intervalMs) - 1);
  const itemInstanceId = targetIds[cycleIndex % targetIds.length];
  if (!itemInstanceId) return nextSequence;
  queue.push({ kind: 'boss-telegraph', dueAtMs: Math.max(0, impactAtMs - interference.telegraphMs), sequence: nextSequence, itemInstanceId });
  queue.push({ kind: 'boss-interference', dueAtMs: impactAtMs, sequence: nextSequence + 1, itemInstanceId });
  return nextSequence + 2;
}

function scheduleCellInterference(queue: CombatQueuedEffect[], setup: CombatSetup, impactAtMs: number, nextSequence: number): number {
  const interference = setup.enemy.cellInterference;
  if (!interference) return nextSequence;
  const cells = slimeTargetCells(setup.items);
  if (cells.length === 0) return nextSequence;
  const cycleIndex = Math.max(0, Math.round(impactAtMs / interference.intervalMs) - 1);
  const cell = cells[cycleIndex % cells.length];
  if (!cell) return nextSequence;
  queue.push({ kind: 'boss-cell-telegraph', dueAtMs: Math.max(0, impactAtMs - interference.telegraphMs), sequence: nextSequence, cell });
  queue.push({ kind: 'boss-cell-interference', dueAtMs: impactAtMs, sequence: nextSequence + 1, cell });
  return nextSequence + 2;
}

function scheduleRowInterference(queue: CombatQueuedEffect[], setup: CombatSetup, impactAtMs: number, nextSequence: number): number {
  const interference = setup.enemy.rowInterference;
  if (!interference) return nextSequence;
  const rows = magnetTargetRows(setup.items);
  if (rows.length === 0) return nextSequence;
  const cycleIndex = Math.max(0, Math.round(impactAtMs / interference.intervalMs) - 1);
  const row = rows[cycleIndex % rows.length];
  if (row === undefined) return nextSequence;
  queue.push({ kind: 'boss-row-telegraph', dueAtMs: Math.max(0, impactAtMs - interference.telegraphMs), sequence: nextSequence, row });
  queue.push({ kind: 'boss-row-interference', dueAtMs: impactAtMs, sequence: nextSequence + 1, row });
  return nextSequence + 2;
}

function scheduleTagInterference(queue: CombatQueuedEffect[], setup: CombatSetup, impactAtMs: number, nextSequence: number): number {
  const interference = setup.enemy.tagInterference;
  if (!interference) return nextSequence;
  const tag = dominantEclipseTag(setup.items);
  if (!tag) return nextSequence;
  queue.push({ kind: 'boss-tag-telegraph', dueAtMs: Math.max(0, impactAtMs - interference.telegraphMs), sequence: nextSequence, tag });
  queue.push({ kind: 'boss-tag-interference', dueAtMs: impactAtMs, sequence: nextSequence + 1, tag });
  return nextSequence + 2;
}

function dominantEclipseTag(items: ReadonlyMap<string, CombatBuildItem>): ItemTag | null {
  const counts = new Map<ItemTag, number>();
  for (const item of [...items.values()].sort((a, b) => a.instanceId.localeCompare(b.instanceId))) {
    for (const tag of new Set(item.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  const ranked = [...counts.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1] || eclipsePriority(a[0]) - eclipsePriority(b[0]) || a[0].localeCompare(b[0]));
  return ranked[0]?.[0] ?? null;
}

function eclipsePriority(tag: ItemTag): number {
  const index = ECLIPSE_TAG_PRIORITY.indexOf(tag);
  return index >= 0 ? index : ECLIPSE_TAG_PRIORITY.length;
}

function countItemsWithTag(items: ReadonlyMap<string, CombatBuildItem>, tag: ItemTag): number {
  return [...items.values()].filter((item) => item.tags.includes(tag)).length;
}

function interferenceTargets(items: ReadonlyMap<string, CombatBuildItem>): string[] {
  const meaningful = [...items.values()]
    .filter((item) => item.damage > 0 || item.poisonOnHit > 0 || item.shieldOnTrigger > 0 || item.bonusLaserShots > 0 || item.chaosPower > 0)
    .map((item) => item.instanceId)
    .sort((a, b) => a.localeCompare(b));
  return meaningful.length > 0 ? meaningful : [...items.keys()].sort((a, b) => a.localeCompare(b));
}

function slimeTargetCells(items: ReadonlyMap<string, CombatBuildItem>): Cell[] {
  const unique = new Map<string, Cell>();
  for (const item of [...items.values()].sort((a, b) => a.instanceId.localeCompare(b.instanceId))) {
    for (const cell of item.occupiedCells) unique.set(cellKey(cell), { ...cell });
  }
  return [...unique.values()].sort((a, b) => a.y - b.y || a.x - b.x);
}

function magnetTargetRows(items: ReadonlyMap<string, CombatBuildItem>): number[] {
  const magneticRows = uniqueRows([...items.values()].filter((item) => item.magnetic));
  if (magneticRows.length > 0) return magneticRows;
  return uniqueRows([...items.values()]);
}

function uniqueRows(items: readonly CombatBuildItem[]): number[] {
  const rows = new Set<number>();
  for (const item of [...items].sort((a, b) => a.instanceId.localeCompare(b.instanceId))) {
    for (const cell of item.occupiedCells) rows.add(cell.y);
  }
  return [...rows].sort((a, b) => a - b);
}

function rowContainsMagneticItem(items: ReadonlyMap<string, CombatBuildItem>, row: number): boolean {
  return [...items.values()].some((item) => item.magnetic && item.occupiedCells.some((cell) => cell.y === row));
}

function sortQueue(queue: readonly CombatQueuedEffect[]): CombatQueuedEffect[] { return [...queue].sort(compareEffects); }
function sortQueueInPlace(queue: CombatQueuedEffect[]): void { queue.sort(compareEffects); }
function compareEffects(a: CombatQueuedEffect, b: CombatQueuedEffect): number { return a.dueAtMs - b.dueAtMs || a.sequence - b.sequence; }
