import type { HeroId } from './heroes';

export const HERO_MASTERY_MAX_LEVEL = 20;

export interface HeroMasteryXpState {
  readonly scavenger: number;
  readonly engineer: number;
  readonly alchemist: number;
  readonly beastfriend: number;
}

export type HeroMasteryRewardKind = 'title' | 'frame' | 'trail' | 'vfx';

export interface HeroMasteryReward {
  readonly id: string;
  readonly heroId: HeroId;
  readonly level: number;
  readonly kind: HeroMasteryRewardKind;
  readonly name: string;
  readonly description: string;
}

export interface HeroMasterySnapshot {
  readonly heroId: HeroId;
  readonly xp: number;
  readonly level: number;
  readonly currentLevelFloorXp: number;
  readonly nextLevelXp: number | null;
  readonly levelProgress: number;
  readonly unlockedRewards: readonly HeroMasteryReward[];
  readonly nextReward: HeroMasteryReward | null;
}

export type HeroMasteryAction =
  | 'fight-victory'
  | 'elite-victory'
  | 'boss-victory'
  | 'fusion'
  | 'event-choice'
  | 'daily-contract'
  | 'campaign-clear'
  | 'loop-clear'
  | 'cashout';

export interface HeroMasteryAwardContext {
  readonly loopNumber?: number;
}

const HERO_IDS: readonly HeroId[] = ['scavenger', 'engineer', 'alchemist', 'beastfriend'];

const REWARD_THEMES: Readonly<Record<HeroId, readonly [string, string, string, string, string, string, string]>> = {
  scavenger: ['Bin Whisperer', 'Dumpster Chrome', 'Loot Spark', 'Trash Baron', 'Neon Salvage', 'Scrapstorm', 'King of Bad Decisions'],
  engineer: ['Warranty Void', 'Copper Blueprint', 'Servo Trail', 'Chief Overclocker', 'Arc-Weld Frame', 'Machine Ghost', 'Licensed Catastrophe'],
  alchemist: ['Pocket Chemist', 'Hazmat Glass', 'Toxic Drip', 'Slime Sommelier', 'Mutagen Frame', 'Plague Bloom', 'Reality Distiller'],
  beastfriend: ['Stray Recruiter', 'Clawprint Frame', 'Feral Trail', 'Pack Negotiator', 'Moon-Paw Frame', 'Stampede Spark', 'Apex Junk Whisperer'],
};

const REWARD_LEVELS = [2, 4, 7, 10, 13, 16, 20] as const;
const REWARD_KINDS: readonly HeroMasteryRewardKind[] = ['title', 'frame', 'trail', 'title', 'frame', 'vfx', 'title'];

export const HERO_MASTERY_REWARDS: readonly HeroMasteryReward[] = HERO_IDS.flatMap((heroId) =>
  REWARD_LEVELS.map((level, index) => ({
    id: `${heroId}-mastery-${level}`,
    heroId,
    level,
    kind: REWARD_KINDS[index]!,
    name: REWARD_THEMES[heroId][index]!,
    description: rewardDescription(REWARD_KINDS[index]!, heroId),
  })),
);

export function heroMasteryXpForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.min(HERO_MASTERY_MAX_LEVEL, Math.floor(level)));
  const steps = safeLevel - 1;
  return 60 * steps + 18 * steps * (steps - 1);
}

export function heroMasteryLevelForXp(xp: number): number {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  let level = 1;
  for (let candidate = 2; candidate <= HERO_MASTERY_MAX_LEVEL; candidate += 1) {
    if (safeXp < heroMasteryXpForLevel(candidate)) break;
    level = candidate;
  }
  return level;
}

export function createHeroMasterySnapshot(
  heroId: HeroId,
  state: HeroMasteryXpState,
): HeroMasterySnapshot {
  const xp = safeXp(state[heroId]);
  const level = heroMasteryLevelForXp(xp);
  const floor = heroMasteryXpForLevel(level);
  const nextLevelXp = level >= HERO_MASTERY_MAX_LEVEL ? null : heroMasteryXpForLevel(level + 1);
  const levelProgress = nextLevelXp === null
    ? 1
    : Math.max(0, Math.min(1, (xp - floor) / Math.max(1, nextLevelXp - floor)));
  const rewards = HERO_MASTERY_REWARDS.filter((reward) => reward.heroId === heroId);
  return {
    heroId,
    xp,
    level,
    currentLevelFloorXp: floor,
    nextLevelXp,
    levelProgress,
    unlockedRewards: rewards.filter((reward) => reward.level <= level),
    nextReward: rewards.find((reward) => reward.level > level) ?? null,
  };
}

export function addHeroMasteryXp(
  state: HeroMasteryXpState,
  heroId: HeroId,
  amount: number,
): { readonly state: HeroMasteryXpState; readonly gainedXp: number; readonly levelsGained: number; readonly rewardsUnlocked: readonly HeroMasteryReward[] } {
  const gainedXp = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0));
  if (gainedXp === 0) return { state, gainedXp: 0, levelsGained: 0, rewardsUnlocked: [] };
  const before = createHeroMasterySnapshot(heroId, state);
  const nextState = { ...state, [heroId]: safeXp(state[heroId]) + gainedXp };
  const after = createHeroMasterySnapshot(heroId, nextState);
  return {
    state: nextState,
    gainedXp,
    levelsGained: Math.max(0, after.level - before.level),
    rewardsUnlocked: after.unlockedRewards.filter((reward) => reward.level > before.level),
  };
}

export function heroMasteryAwardForAction(
  action: HeroMasteryAction,
  context: HeroMasteryAwardContext = {},
): number {
  const loop = Math.max(1, Math.floor(context.loopNumber ?? 1));
  switch (action) {
    case 'fight-victory': return 12;
    case 'elite-victory': return 22;
    case 'boss-victory': return 55 + Math.min(30, Math.max(0, loop - 1) * 6);
    case 'fusion': return 12;
    case 'event-choice': return 8;
    case 'daily-contract': return 18;
    case 'campaign-clear': return 120;
    case 'loop-clear': return 145 + Math.min(80, Math.max(0, loop - 2) * 20);
    case 'cashout': return 25 + Math.min(75, Math.max(0, loop - 1) * 10);
  }
}

export function totalHeroMasteryLevel(state: HeroMasteryXpState): number {
  return HERO_IDS.reduce((sum, heroId) => sum + heroMasteryLevelForXp(state[heroId]), 0);
}

function safeXp(value: number): number {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}

function rewardDescription(kind: HeroMasteryRewardKind, heroId: HeroId): string {
  const hero = heroId === 'beastfriend' ? 'Beast Friend' : heroId[0]!.toUpperCase() + heroId.slice(1);
  if (kind === 'title') return `Cosmetic ${hero} title for the Trophy Shelf and future run card.`;
  if (kind === 'frame') return `Cosmetic ${hero} portrait/frame treatment.`;
  if (kind === 'trail') return `Cosmetic ${hero} backpack interaction trail variant.`;
  return `Cosmetic ${hero} combat/reward VFX variant.`;
}
