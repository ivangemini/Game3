import {
  DEFAULT_DAILY_RETENTION,
  isDailyRetentionState,
  type DailyRetentionState,
} from '../game/domain/dailyRetention';
import {
  DEFAULT_WEEKLY_CHALLENGE,
  isWeeklyChallengeState,
  type WeeklyChallengeState,
} from '../game/domain/weeklyChallenge';
import type { HeroId } from '../game/domain/heroes';
import {
  CAMPAIGN_ENCOUNTER_COUNT,
  createInitialRunProgress,
  isRunProgressState,
  type RunProgressState,
} from '../game/domain/runProgression';
import type { PlacedItem } from '../game/domain/types';

const SAVE_KEY = 'junkpack.save';
const SAVE_BACKUP_KEY = 'junkpack.save.backup';
const LEGACY_FOUR_WORLD_CAMPAIGN_ENCOUNTER_COUNT = 12;
export const SAVE_NOTICE_EVENT = 'junkpack:save-notice';

export type SaveNoticeKind = 'recovered-backup' | 'reset-corrupt' | 'write-failed';

export interface SaveNoticeDetail {
  readonly kind: SaveNoticeKind;
}

export interface SaveSettings {
  readonly musicVolume: number;
  readonly sfxVolume: number;
  readonly reducedMotion: boolean;
}

export interface ActiveRunSave {
  readonly runSeed: string;
  readonly shopIndex: number;
  readonly coins: number;
  readonly soldOfferIds: readonly string[];
  readonly backpackItems: readonly PlacedItem[];
  readonly nextLootSequence: number;
  readonly claimedEncounterIds: readonly string[];
  readonly selectedPerkIds: readonly string[];
  readonly perkChoiceIndex: number;
  readonly pendingPerkOfferIds: readonly string[];
  readonly offeredPerkEncounterIds: readonly string[];
  readonly progress: RunProgressState;
  readonly eventIndex: number;
  readonly pendingEventId: string | null;
  readonly resolvedEventIds: readonly string[];
  readonly heroId: HeroId | null;
}

export interface SaveV8 {
  readonly version: 8;
  readonly discoveredItemIds: readonly string[];
  readonly discoveredRecipeIds: readonly string[];
  readonly bestEndlessWave: number;
  readonly bestCorruptedLoop: number;
  readonly settings: SaveSettings;
  readonly activeRun: ActiveRunSave | null;
}

export interface HeroMasteryXpSave {
  readonly scavenger: number;
  readonly engineer: number;
  readonly alchemist: number;
  readonly beastfriend: number;
}

export interface BossHistorySave {
  readonly bossId: string;
  readonly wins: number;
  readonly losses: number;
  readonly fastestVictoryMs: number | null;
  readonly currentWinStreak: number;
  readonly bestWinStreak: number;
  readonly revengePending: boolean;
  readonly challengeStars?: 0 | 1 | 2 | 3;
}

export interface SaveV9 {
  readonly version: 9;
  readonly discoveredItemIds: readonly string[];
  readonly discoveredRecipeIds: readonly string[];
  readonly bestEndlessWave: number;
  readonly bestCorruptedLoop: number;
  readonly settings: SaveSettings;
  readonly dailyRetention: DailyRetentionState;
  readonly weeklyChallenge?: WeeklyChallengeState;
  readonly heroMasteryXp: HeroMasteryXpSave;
  readonly bossHistory: readonly BossHistorySave[];
  readonly activeRun: ActiveRunSave | null;
}

export type GameSave = SaveV9;

export const DEFAULT_HERO_MASTERY_XP: HeroMasteryXpSave = {
  scavenger: 0,
  engineer: 0,
  alchemist: 0,
  beastfriend: 0,
};

export const DEFAULT_SAVE: SaveV9 = {
  version: 9,
  discoveredItemIds: [],
  discoveredRecipeIds: [],
  bestEndlessWave: 0,
  bestCorruptedLoop: 0,
  settings: { musicVolume: 0.8, sfxVolume: 0.9, reducedMotion: false },
  dailyRetention: DEFAULT_DAILY_RETENTION,
  weeklyChallenge: DEFAULT_WEEKLY_CHALLENGE,
  heroMasteryXp: DEFAULT_HERO_MASTERY_XP,
  bossHistory: [],
  activeRun: null,
};

export function loadSave(storage: Storage = localStorage): SaveV9 {
  let raw: string | null = null;
  try {
    raw = storage.getItem(SAVE_KEY);
  } catch {
    emitSaveNotice('reset-corrupt');
    return DEFAULT_SAVE;
  }
  if (!raw) return DEFAULT_SAVE;

  const primary = decodePersistedSave(raw);
  if (primary) return primary;

  let backupRaw: string | null = null;
  try {
    backupRaw = storage.getItem(SAVE_BACKUP_KEY);
  } catch {
    emitSaveNotice('reset-corrupt');
    return DEFAULT_SAVE;
  }
  const backup = backupRaw ? decodePersistedSave(backupRaw) : null;
  if (backup) {
    try { storage.setItem(SAVE_KEY, JSON.stringify(backup)); } catch { /* recovery can still continue in memory */ }
    emitSaveNotice('recovered-backup');
    return backup;
  }

  emitSaveNotice('reset-corrupt');
  return DEFAULT_SAVE;
}

export function writeSave(save: SaveV9, storage: Storage = localStorage): void {
  try {
    const currentRaw = storage.getItem(SAVE_KEY);
    if (currentRaw && decodePersistedSave(currentRaw)) storage.setItem(SAVE_BACKUP_KEY, currentRaw);
    storage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    emitSaveNotice('write-failed');
  }
}

export function clearActiveRun(save: SaveV9): SaveV9 {
  return { ...save, activeRun: null };
}

function decodePersistedSave(raw: string): SaveV9 | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isSaveV9(parsed)) return normalizeCurrentSave(parsed);
    const v8 = isSaveV8(parsed) ? parsed : migrateLegacySave(parsed);
    return v8 ? normalizeCurrentSave(migrateV8ToV9(v8)) : null;
  } catch {
    return null;
  }
}

function migrateV8ToV9(save: SaveV8): SaveV9 {
  return {
    version: 9,
    discoveredItemIds: save.discoveredItemIds,
    discoveredRecipeIds: save.discoveredRecipeIds,
    bestEndlessWave: save.bestEndlessWave,
    bestCorruptedLoop: save.bestCorruptedLoop,
    settings: save.settings,
    dailyRetention: DEFAULT_DAILY_RETENTION,
    weeklyChallenge: DEFAULT_WEEKLY_CHALLENGE,
    heroMasteryXp: DEFAULT_HERO_MASTERY_XP,
    bossHistory: [],
    activeRun: save.activeRun,
  };
}

function normalizeCurrentSave(save: SaveV9): SaveV9 {
  const normalizedSave: SaveV9 = {
    ...save,
    weeklyChallenge: save.weeklyChallenge ?? DEFAULT_WEEKLY_CHALLENGE,
  };
  const run = normalizedSave.activeRun;
  if (!run) return normalizedSave;
  const progress = run.progress;
  const legacyFinalIndex = LEGACY_FOUR_WORLD_CAMPAIGN_ENCOUNTER_COUNT - 1;
  const resumeIndex = LEGACY_FOUR_WORLD_CAMPAIGN_ENCOUNTER_COUNT;
  const isLegacyFourWorldBreakpoint = CAMPAIGN_ENCOUNTER_COUNT > LEGACY_FOUR_WORLD_CAMPAIGN_ENCOUNTER_COUNT
    && progress.mode === 'deep-choice'
    && progress.loopNumber === 1
    && progress.campaignEncounterIndex === legacyFinalIndex;
  if (!isLegacyFourWorldBreakpoint) return normalizedSave;

  return {
    ...normalizedSave,
    activeRun: {
      ...run,
      progress: {
        ...progress,
        mode: 'campaign',
        campaignEncounterIndex: resumeIndex,
        loopEncounterIndex: 0,
      },
    },
  };
}

function emitSaveNotice(kind: SaveNoticeKind): void {
  if (typeof window === 'undefined' || typeof CustomEvent === 'undefined') return;
  window.dispatchEvent(new CustomEvent<SaveNoticeDetail>(SAVE_NOTICE_EVENT, { detail: { kind } }));
}

interface LegacyMeta {
  readonly version: number;
  readonly discoveredItemIds: readonly string[];
  readonly discoveredRecipeIds: readonly string[];
  readonly bestEndlessWave: number;
  readonly bestCorruptedLoop?: number;
  readonly settings: SaveSettings;
  readonly activeRun?: unknown;
}

interface LegacyRunBase {
  readonly runSeed: string;
  readonly shopIndex: number;
  readonly coins: number;
  readonly soldOfferIds: readonly string[];
  readonly backpackItems: readonly PlacedItem[];
  readonly nextLootSequence: number;
}

interface LegacyProgressV5 {
  readonly mode: 'campaign' | 'cashout' | 'endless' | 'complete';
  readonly campaignEncounterIndex: number;
  readonly endlessWave: number;
  readonly score: number;
}

function migrateLegacySave(value: unknown): SaveV8 | null {
  if (!isLegacyMeta(value) || value.version < 1 || value.version > 7) return null;
  const bestCorruptedLoop = value.version >= 6
    ? value.bestCorruptedLoop
    : deriveBestCorruptedLoop(value.bestEndlessWave);
  if (!isNonNegativeInteger(bestCorruptedLoop)) return null;

  if (value.version === 1) return finalizeLegacy(value, bestCorruptedLoop, null);
  const run = migrateLegacyRun(value.version, value.activeRun);
  if (value.activeRun !== null && value.activeRun !== undefined && !run) return null;
  return finalizeLegacy(value, bestCorruptedLoop, run);
}

function finalizeLegacy(meta: LegacyMeta, bestCorruptedLoop: number, activeRun: ActiveRunSave | null): SaveV8 {
  return {
    version: 8,
    discoveredItemIds: meta.discoveredItemIds,
    discoveredRecipeIds: meta.discoveredRecipeIds,
    bestEndlessWave: meta.bestEndlessWave,
    bestCorruptedLoop,
    settings: meta.settings,
    activeRun,
  };
}

function migrateLegacyRun(version: number, value: unknown): ActiveRunSave | null {
  if (value === null || value === undefined) return null;
  if (!isLegacyRunBase(value)) return null;
  const run = value as LegacyRunBase & Record<string, unknown>;

  const claimedEncounterIds = version >= 3 && isStringArray(run.claimedEncounterIds)
    ? run.claimedEncounterIds : version >= 3 ? null : [];
  if (claimedEncounterIds === null) return null;

  const perkFields = version >= 4 ? readPerkFields(run) : emptyPerkFields();
  if (!perkFields) return null;

  let progress: RunProgressState;
  if (version >= 6) {
    if (!isRunProgressState(run.progress)) return null;
    progress = run.progress;
  } else if (version === 5) {
    if (!isLegacyProgressV5(run.progress)) return null;
    progress = migrateLegacyProgress(run.progress);
  } else {
    progress = createInitialRunProgress();
  }

  let eventIndex = 0;
  let pendingEventId: string | null = null;
  let resolvedEventIds: readonly string[] = [];
  if (version >= 7) {
    if (!isNonNegativeInteger(run.eventIndex)
      || !(run.pendingEventId === null || typeof run.pendingEventId === 'string')
      || !isStringArray(run.resolvedEventIds)) return null;
    eventIndex = run.eventIndex;
    pendingEventId = run.pendingEventId;
    resolvedEventIds = run.resolvedEventIds;
  }

  return {
    runSeed: run.runSeed,
    shopIndex: run.shopIndex,
    coins: run.coins,
    soldOfferIds: run.soldOfferIds,
    backpackItems: run.backpackItems,
    nextLootSequence: run.nextLootSequence,
    claimedEncounterIds,
    ...perkFields,
    progress,
    eventIndex,
    pendingEventId,
    resolvedEventIds,
    heroId: null,
  };
}

function readPerkFields(run: Record<string, unknown>): Pick<ActiveRunSave,
  'selectedPerkIds' | 'perkChoiceIndex' | 'pendingPerkOfferIds' | 'offeredPerkEncounterIds'> | null {
  if (!isStringArray(run.selectedPerkIds)
    || !isNonNegativeInteger(run.perkChoiceIndex)
    || !isStringArray(run.pendingPerkOfferIds)
    || !isStringArray(run.offeredPerkEncounterIds)) return null;
  return {
    selectedPerkIds: run.selectedPerkIds,
    perkChoiceIndex: run.perkChoiceIndex,
    pendingPerkOfferIds: run.pendingPerkOfferIds,
    offeredPerkEncounterIds: run.offeredPerkEncounterIds,
  };
}

function emptyPerkFields(): Pick<ActiveRunSave,
  'selectedPerkIds' | 'perkChoiceIndex' | 'pendingPerkOfferIds' | 'offeredPerkEncounterIds'> {
  return { selectedPerkIds: [], perkChoiceIndex: 0, pendingPerkOfferIds: [], offeredPerkEncounterIds: [] };
}

function migrateLegacyProgress(progress: LegacyProgressV5): RunProgressState {
  if (progress.mode === 'campaign') {
    return {
      mode: 'campaign',
      campaignEncounterIndex: Math.max(0, Math.min(8, progress.campaignEncounterIndex)),
      loopNumber: 1, loopEncounterIndex: 0, score: progress.score,
    };
  }
  if (progress.mode === 'cashout') {
    return {
      mode: 'campaign', campaignEncounterIndex: 9,
      loopNumber: 1, loopEncounterIndex: 0, score: progress.score,
    };
  }
  if (progress.mode === 'endless') {
    const wave = Math.max(1, progress.endlessWave);
    return {
      mode: 'loop', campaignEncounterIndex: 11,
      loopNumber: 2 + Math.floor((wave - 1) / 12),
      loopEncounterIndex: (wave - 1) % 12, score: progress.score,
    };
  }
  return {
    mode: 'complete', campaignEncounterIndex: 11,
    loopNumber: 1, loopEncounterIndex: 0, score: progress.score,
  };
}

function deriveBestCorruptedLoop(bestEndlessWave: number): number {
  return bestEndlessWave > 0 ? 2 + Math.floor((Math.max(1, bestEndlessWave) - 1) / 12) : 0;
}

function isSaveV9(value: unknown): value is SaveV9 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SaveV9>;
  return candidate.version === 9
    && isStringArray(candidate.discoveredItemIds)
    && isStringArray(candidate.discoveredRecipeIds)
    && isNonNegativeFiniteNumber(candidate.bestEndlessWave)
    && isNonNegativeInteger(candidate.bestCorruptedLoop)
    && isSettings(candidate.settings)
    && isDailyRetentionState(candidate.dailyRetention)
    && (candidate.weeklyChallenge === undefined || isWeeklyChallengeState(candidate.weeklyChallenge))
    && isHeroMasteryXp(candidate.heroMasteryXp)
    && isBossHistoryArray(candidate.bossHistory)
    && (candidate.activeRun === null || isActiveRunV8(candidate.activeRun));
}

function isSaveV8(value: unknown): value is SaveV8 {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SaveV8>;
  return candidate.version === 8
    && isStringArray(candidate.discoveredItemIds)
    && isStringArray(candidate.discoveredRecipeIds)
    && isNonNegativeFiniteNumber(candidate.bestEndlessWave)
    && isNonNegativeInteger(candidate.bestCorruptedLoop)
    && isSettings(candidate.settings)
    && (candidate.activeRun === null || isActiveRunV8(candidate.activeRun));
}

function isActiveRunV8(value: unknown): value is ActiveRunSave {
  if (!isLegacyRunBase(value)) return false;
  const run = value as LegacyRunBase & Partial<ActiveRunSave>;
  return isStringArray(run.claimedEncounterIds)
    && isStringArray(run.selectedPerkIds)
    && isNonNegativeInteger(run.perkChoiceIndex)
    && isStringArray(run.pendingPerkOfferIds)
    && isStringArray(run.offeredPerkEncounterIds)
    && isRunProgressState(run.progress)
    && isNonNegativeInteger(run.eventIndex)
    && (run.pendingEventId === null || typeof run.pendingEventId === 'string')
    && isStringArray(run.resolvedEventIds)
    && (run.heroId === null || isHeroId(run.heroId));
}

function isLegacyMeta(value: unknown): value is LegacyMeta {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<LegacyMeta>;
  return Number.isInteger(candidate.version)
    && isStringArray(candidate.discoveredItemIds)
    && isStringArray(candidate.discoveredRecipeIds)
    && isNonNegativeFiniteNumber(candidate.bestEndlessWave)
    && isSettings(candidate.settings)
    && (candidate.version === 1 || 'activeRun' in candidate);
}

function isLegacyRunBase(value: unknown): value is LegacyRunBase {
  if (!value || typeof value !== 'object') return false;
  const run = value as Partial<LegacyRunBase>;
  return typeof run.runSeed === 'string'
    && isNonNegativeInteger(run.shopIndex)
    && isNonNegativeInteger(run.coins)
    && isStringArray(run.soldOfferIds)
    && Array.isArray(run.backpackItems)
    && run.backpackItems.every(isPlacedItem)
    && isPositiveInteger(run.nextLootSequence);
}

function isLegacyProgressV5(value: unknown): value is LegacyProgressV5 {
  if (!value || typeof value !== 'object') return false;
  const progress = value as Partial<LegacyProgressV5>;
  return (progress.mode === 'campaign' || progress.mode === 'cashout' || progress.mode === 'endless' || progress.mode === 'complete')
    && isIntegerInRange(progress.campaignEncounterIndex, 0, 8)
    && isNonNegativeInteger(progress.endlessWave)
    && isNonNegativeInteger(progress.score);
}

function isPlacedItem(value: unknown): value is PlacedItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<PlacedItem>;
  return typeof item.instanceId === 'string'
    && typeof item.definitionId === 'string'
    && !!item.origin
    && Number.isInteger(item.origin.x)
    && Number.isInteger(item.origin.y)
    && (item.rotation === 0 || item.rotation === 1 || item.rotation === 2 || item.rotation === 3);
}

function isHeroId(value: unknown): value is HeroId {
  return value === 'scavenger' || value === 'engineer' || value === 'alchemist' || value === 'beastfriend';
}

function isHeroMasteryXp(value: unknown): value is HeroMasteryXpSave {
  if (!value || typeof value !== 'object') return false;
  const mastery = value as Partial<HeroMasteryXpSave>;
  return isNonNegativeInteger(mastery.scavenger)
    && isNonNegativeInteger(mastery.engineer)
    && isNonNegativeInteger(mastery.alchemist)
    && isNonNegativeInteger(mastery.beastfriend);
}

function isBossHistoryArray(value: unknown): value is readonly BossHistorySave[] {
  return Array.isArray(value) && value.every(isBossHistory);
}

function isBossHistory(value: unknown): value is BossHistorySave {
  if (!value || typeof value !== 'object') return false;
  const history = value as Partial<BossHistorySave>;
  return typeof history.bossId === 'string'
    && history.bossId.length > 0
    && isNonNegativeInteger(history.wins)
    && isNonNegativeInteger(history.losses)
    && (history.fastestVictoryMs === null || isNonNegativeInteger(history.fastestVictoryMs))
    && isNonNegativeInteger(history.currentWinStreak)
    && isNonNegativeInteger(history.bestWinStreak)
    && typeof history.revengePending === 'boolean'
    && (history.challengeStars === undefined || isIntegerInRange(history.challengeStars, 0, 3));
}

function isSettings(value: unknown): value is SaveSettings {
  if (!value || typeof value !== 'object') return false;
  const settings = value as Partial<SaveSettings>;
  return isUnitInterval(settings.musicVolume)
    && isUnitInterval(settings.sfxVolume)
    && typeof settings.reducedMotion === 'boolean';
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}
function isUnitInterval(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}
function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1;
}
function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}
