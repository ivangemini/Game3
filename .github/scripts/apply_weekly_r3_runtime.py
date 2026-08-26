from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected exactly one match, found {count}: {old[:80]!r}')
    file.write_text(text.replace(old, new, 1), encoding='utf-8')


# weeklyChallenge.ts — shared telemetry buckets.
replace_once(
    'src/game/domain/weeklyChallenge.ts',
    """export function weeklyTierRank(tier: WeeklyTier): number {\n  if (tier === 'bronze') return 1;\n  if (tier === 'silver') return 2;\n  if (tier === 'gold') return 3;\n  if (tier === 'reality-broken') return 4;\n  return 0;\n}\n""",
    """export function weeklyTierRank(tier: WeeklyTier): number {\n  if (tier === 'bronze') return 1;\n  if (tier === 'silver') return 2;\n  if (tier === 'gold') return 3;\n  if (tier === 'reality-broken') return 4;\n  return 0;\n}\n\nexport function weeklyAttemptsBucket(attempts: number): '0' | '1' | '2-3' | '4-7' | '8+' {\n  const safe = Math.max(0, Math.floor(Number.isFinite(attempts) ? attempts : 0));\n  if (safe === 0) return '0';\n  if (safe === 1) return '1';\n  if (safe <= 3) return '2-3';\n  if (safe <= 7) return '4-7';\n  return '8+';\n}\n\nexport function weeklyScoreBucket(score: number): 'under-2500' | '2500-4999' | '5000-7999' | '8000-10999' | '11000+' {\n  const safe = Math.max(0, Math.floor(Number.isFinite(score) ? score : 0));\n  if (safe < 2500) return 'under-2500';\n  if (safe < 5000) return '2500-4999';\n  if (safe < 8000) return '5000-7999';\n  if (safe < 11000) return '8000-10999';\n  return '11000+';\n}\n""",
)

# save.ts — optional save-v9 extension, normalized on load for old v9 saves.
replace_once(
    'src/persistence/save.ts',
    """import {\n  DEFAULT_DAILY_RETENTION,\n  isDailyRetentionState,\n  type DailyRetentionState,\n} from '../game/domain/dailyRetention';\n""",
    """import {\n  DEFAULT_DAILY_RETENTION,\n  isDailyRetentionState,\n  type DailyRetentionState,\n} from '../game/domain/dailyRetention';\nimport {\n  DEFAULT_WEEKLY_CHALLENGE,\n  isWeeklyChallengeState,\n  type WeeklyChallengeState,\n} from '../game/domain/weeklyChallenge';\n""",
)
replace_once(
    'src/persistence/save.ts',
    """  readonly dailyRetention: DailyRetentionState;\n  readonly heroMasteryXp: HeroMasteryXpSave;\n""",
    """  readonly dailyRetention: DailyRetentionState;\n  readonly weeklyChallenge?: WeeklyChallengeState;\n  readonly heroMasteryXp: HeroMasteryXpSave;\n""",
)
replace_once(
    'src/persistence/save.ts',
    """  dailyRetention: DEFAULT_DAILY_RETENTION,\n  heroMasteryXp: DEFAULT_HERO_MASTERY_XP,\n""",
    """  dailyRetention: DEFAULT_DAILY_RETENTION,\n  weeklyChallenge: DEFAULT_WEEKLY_CHALLENGE,\n  heroMasteryXp: DEFAULT_HERO_MASTERY_XP,\n""",
)
replace_once(
    'src/persistence/save.ts',
    """    dailyRetention: DEFAULT_DAILY_RETENTION,\n    heroMasteryXp: DEFAULT_HERO_MASTERY_XP,\n""",
    """    dailyRetention: DEFAULT_DAILY_RETENTION,\n    weeklyChallenge: DEFAULT_WEEKLY_CHALLENGE,\n    heroMasteryXp: DEFAULT_HERO_MASTERY_XP,\n""",
)
replace_once(
    'src/persistence/save.ts',
    """function normalizeCurrentSave(save: SaveV9): SaveV9 {\n  const run = save.activeRun;\n  if (!run) return save;\n""",
    """function normalizeCurrentSave(save: SaveV9): SaveV9 {\n  const normalizedSave: SaveV9 = {\n    ...save,\n    weeklyChallenge: save.weeklyChallenge ?? DEFAULT_WEEKLY_CHALLENGE,\n  };\n  const run = normalizedSave.activeRun;\n  if (!run) return normalizedSave;\n""",
)
replace_once(
    'src/persistence/save.ts',
    """  if (!isLegacyFourWorldBreakpoint) return save;\n\n  return {\n    ...save,\n""",
    """  if (!isLegacyFourWorldBreakpoint) return normalizedSave;\n\n  return {\n    ...normalizedSave,\n""",
)
replace_once(
    'src/persistence/save.ts',
    """    && isDailyRetentionState(candidate.dailyRetention)\n    && isHeroMasteryXp(candidate.heroMasteryXp)\n""",
    """    && isDailyRetentionState(candidate.dailyRetention)\n    && (candidate.weeklyChallenge === undefined || isWeeklyChallengeState(candidate.weeklyChallenge))\n    && isHeroMasteryXp(candidate.heroMasteryXp)\n""",
)

# Telemetry.ts — bounded weekly funnel events.
replace_once(
    'src/analytics/Telemetry.ts',
    """export type DailyStreakBucket = '0' | '1-2' | '3-6' | '7-13' | '14+';\n""",
    """export type DailyStreakBucket = '0' | '1-2' | '3-6' | '7-13' | '14+';\nexport type WeeklyAttemptsBucket = '0' | '1' | '2-3' | '4-7' | '8+';\nexport type WeeklyScoreBucket = 'under-2500' | '2500-4999' | '5000-7999' | '8000-10999' | '11000+';\nexport type WeeklyTierBucket = 'none' | 'bronze' | 'silver' | 'gold' | 'reality-broken';\n""",
)
replace_once(
    'src/analytics/Telemetry.ts',
    """  readonly run_started: { readonly mode: 'standard' | 'daily' };\n  readonly daily_rule_started: { readonly ruleId: string };\n""",
    """  readonly run_started: { readonly mode: 'standard' | 'daily' | 'weekly' };\n  readonly daily_rule_started: { readonly ruleId: string };\n""",
)
replace_once(
    'src/analytics/Telemetry.ts',
    """  readonly daily_track_claimed: { readonly milestone: number; readonly cycle: number; readonly stampReward: number };\n  readonly tutorial_opened: { readonly step: number };\n""",
    """  readonly daily_track_claimed: { readonly milestone: number; readonly cycle: number; readonly stampReward: number };\n  readonly weekly_board_opened: { readonly bestTier: WeeklyTierBucket; readonly attemptsBucket: WeeklyAttemptsBucket };\n  readonly weekly_attempt_started: { readonly constraintId: string; readonly attemptsBucket: WeeklyAttemptsBucket };\n  readonly weekly_attempt_finished: { readonly tier: WeeklyTierBucket; readonly scoreBucket: WeeklyScoreBucket; readonly deepestLoop: number; readonly attemptsBucket: WeeklyAttemptsBucket };\n  readonly tutorial_opened: { readonly step: number };\n""",
)

# Telemetry receiver — strict weekly payload validation.
replace_once(
    'services/telemetry-receiver.mjs',
    """  'daily_track_claimed',\n  'tutorial_opened',\n""",
    """  'daily_track_claimed',\n  'weekly_board_opened',\n  'weekly_attempt_started',\n  'weekly_attempt_finished',\n  'tutorial_opened',\n""",
)
replace_once(
    'services/telemetry-receiver.mjs',
    """const BOSS_IDS = new Set(['tv-tyrant', 'deadline-snail', 'closet-monster', 'baby-moon', 'copycat-auditor', 'border-shark']);\nconst SAFE_ID = /^[A-Za-z0-9._:-]+$/;\n""",
    """const BOSS_IDS = new Set(['tv-tyrant', 'deadline-snail', 'closet-monster', 'baby-moon', 'copycat-auditor', 'border-shark']);\nconst WEEKLY_TIERS = new Set(['none', 'bronze', 'silver', 'gold', 'reality-broken']);\nconst WEEKLY_ATTEMPT_BUCKETS = new Set(['0', '1', '2-3', '4-7', '8+']);\nconst WEEKLY_SCORE_BUCKETS = new Set(['under-2500', '2500-4999', '5000-7999', '8000-10999', '11000+']);\nconst WEEKLY_CONSTRAINT_IDS = new Set([\n  'salvage-plating', 'engineer-overclock', 'toxic-warranty', 'pet-laser-license',\n  'salvage-bad-idea', 'signal-engineer', 'slime-alchemist', 'catnip-beastfriend',\n]);\nconst SAFE_ID = /^[A-Za-z0-9._:-]+$/;\n""",
)
replace_once(
    'services/telemetry-receiver.mjs',
    """    case 'run_started':\n      return onlyKeys(payload, ['mode']) && (payload.mode === 'standard' || payload.mode === 'daily');\n""",
    """    case 'run_started':\n      return onlyKeys(payload, ['mode']) && (payload.mode === 'standard' || payload.mode === 'daily' || payload.mode === 'weekly');\n""",
)
replace_once(
    'services/telemetry-receiver.mjs',
    """    case 'daily_track_claimed':\n      return onlyKeys(payload, ['milestone', 'cycle', 'stampReward'])\n        && [3, 5, 7].includes(payload.milestone)\n        && validInteger(payload.cycle, 0, 100_000)\n        && validInteger(payload.stampReward, 1, 100);\n    case 'tutorial_opened':\n""",
    """    case 'daily_track_claimed':\n      return onlyKeys(payload, ['milestone', 'cycle', 'stampReward'])\n        && [3, 5, 7].includes(payload.milestone)\n        && validInteger(payload.cycle, 0, 100_000)\n        && validInteger(payload.stampReward, 1, 100);\n    case 'weekly_board_opened':\n      return onlyKeys(payload, ['bestTier', 'attemptsBucket'])\n        && WEEKLY_TIERS.has(payload.bestTier)\n        && WEEKLY_ATTEMPT_BUCKETS.has(payload.attemptsBucket);\n    case 'weekly_attempt_started':\n      return onlyKeys(payload, ['constraintId', 'attemptsBucket'])\n        && WEEKLY_CONSTRAINT_IDS.has(payload.constraintId)\n        && WEEKLY_ATTEMPT_BUCKETS.has(payload.attemptsBucket);\n    case 'weekly_attempt_finished':\n      return onlyKeys(payload, ['tier', 'scoreBucket', 'deepestLoop', 'attemptsBucket'])\n        && WEEKLY_TIERS.has(payload.tier)\n        && WEEKLY_SCORE_BUCKETS.has(payload.scoreBucket)\n        && validInteger(payload.deepestLoop, 0, 1000)\n        && WEEKLY_ATTEMPT_BUCKETS.has(payload.attemptsBucket);\n    case 'tutorial_opened':\n""",
)

# Daily board becomes the challenge hub entry without adding another HUD action.
replace_once(
    'src/game/ui/DailyBoardOverlay.ts',
    """const DEPTH = 1230;\n\nexport interface DailyBoardOverlayOptions {\n  readonly getSnapshot: () => DailyBoardSnapshot;\n  readonly onClaimContract: (contractId: string) => boolean;\n  readonly onClaimTrackReward: (rewardId: string) => boolean;\n  readonly reducedMotion: boolean;\n}\n""",
    """const DEPTH = 1230;\n\nexport type DailyRunState = 'inactive' | 'active' | 'complete';\n\nexport interface DailyBoardOverlayOptions {\n  readonly getSnapshot: () => DailyBoardSnapshot;\n  readonly getRunState: () => DailyRunState;\n  readonly onStartOrResumeDaily: () => void;\n  readonly onOpenWeekly: () => void;\n  readonly onClaimContract: (contractId: string) => boolean;\n  readonly onClaimTrackReward: (rewardId: string) => boolean;\n  readonly reducedMotion: boolean;\n}\n""",
)
replace_once(
    'src/game/ui/DailyBoardOverlay.ts',
    """    this.drawTrack(snapshot);\n    this.drawUnclaimedRewards(snapshot);\n  }\n""",
    """    this.drawTrack(snapshot);\n    this.drawUnclaimedRewards(snapshot);\n    this.drawDailyAction();\n  }\n""",
)
replace_once(
    'src/game/ui/DailyBoardOverlay.ts',
    """    this.content.add(this.scene.add.text(1067, 101, `STREAK ${snapshot.streakCount} • TRACK DAY ${snapshot.rewardTrackDay}/7`, {\n      fontSize: '12px', color: '#b5ff4d', fontStyle: 'bold',\n    }));\n\n    const close = this.scene.add.rectangle(1450, 95, 116, 40, 0x2b2e3a, 1)\n""",
    """    this.content.add(this.scene.add.text(1067, 101, `STREAK ${snapshot.streakCount} • TRACK DAY ${snapshot.rewardTrackDay}/7`, {\n      fontSize: '12px', color: '#b5ff4d', fontStyle: 'bold',\n    }));\n\n    const weekly = this.scene.add.rectangle(884, 95, 190, 42, 0x4a3820, 1)\n      .setStrokeStyle(2, 0xffc768).setInteractive({ useHandCursor: true });\n    const weeklyLabel = this.scene.add.text(884, 95, 'WEEKLY CHALLENGE  ›', {\n      fontSize: '10px', color: '#fff0cf', fontStyle: 'bold',\n    }).setOrigin(0.5);\n    weekly.on('pointerover', () => weekly.setFillStyle(0x654a25));\n    weekly.on('pointerout', () => weekly.setFillStyle(0x4a3820));\n    weekly.on('pointerdown', () => pressPulse(this.scene, [weekly, weeklyLabel], this.options.reducedMotion));\n    weekly.on('pointerup', () => this.options.onOpenWeekly());\n    this.content.add([weekly, weeklyLabel]);\n\n    const close = this.scene.add.rectangle(1450, 95, 116, 40, 0x2b2e3a, 1)\n""",
)
replace_once(
    'src/game/ui/DailyBoardOverlay.ts',
    """  private drawUnclaimedRewards(snapshot: DailyBoardSnapshot): void {\n""",
    """  private drawDailyAction(): void {\n    const state = this.options.getRunState();\n    const labelText = state === 'active' ? 'RETURN TO DAILY RUN' : state === 'complete' ? 'RETRY DAILY RUN' : 'START DAILY RUN';\n    const detailText = state === 'active'\n      ? 'Today\'s deterministic run is active.'\n      : 'Starts today\'s seed and replaces the current run.';\n    const button = this.scene.add.rectangle(790, 826, 330, 46, 0x263224, 1)\n      .setStrokeStyle(2, 0xb5ff4d).setInteractive({ useHandCursor: true });\n    const label = this.scene.add.text(790, 818, labelText, {\n      fontSize: '11px', color: '#e6ffd1', fontStyle: 'bold',\n    }).setOrigin(0.5);\n    const detail = this.scene.add.text(790, 837, detailText, {\n      fontSize: '8px', color: '#96aa83',\n    }).setOrigin(0.5);\n    button.on('pointerover', () => button.setFillStyle(0x354630));\n    button.on('pointerout', () => button.setFillStyle(0x263224));\n    button.on('pointerdown', () => pressPulse(this.scene, [button, label, detail], this.options.reducedMotion));\n    button.on('pointerup', () => this.options.onStartOrResumeDaily());\n    this.content.add([button, label, detail]);\n  }\n\n  private drawUnclaimedRewards(snapshot: DailyBoardSnapshot): void {\n""",
)

# Weekly overlay uses domain bucket helper so runtime and UI report the same semantics.
replace_once(
    'src/game/ui/WeeklyChallengeOverlay.ts',
    """import { weeklyTierRank, type WeeklyBoardSnapshot, type WeeklyTier } from '../domain/weeklyChallenge';\n""",
    """import { weeklyAttemptsBucket, weeklyTierRank, type WeeklyBoardSnapshot, type WeeklyTier } from '../domain/weeklyChallenge';\n""",
)
replace_once(
    'src/game/ui/WeeklyChallengeOverlay.ts',
    """      attemptsBucket: attemptsBucket(snapshot.attempts),\n""",
    """      attemptsBucket: weeklyAttemptsBucket(snapshot.attempts),\n""",
)
replace_once(
    'src/game/ui/WeeklyChallengeOverlay.ts',
    """\nfunction attemptsBucket(attempts: number): '0' | '1' | '2-3' | '4-7' | '8+' {\n  if (attempts <= 0) return '0';\n  if (attempts === 1) return '1';\n  if (attempts <= 3) return '2-3';\n  if (attempts <= 7) return '4-7';\n  return '8+';\n}\n""",
    """\n""",
)

# Top HUD: existing Daily slot becomes Challenges and no longer performs a destructive action directly.
replace_once(
    'src/game/ui/TopHudActions.ts',
    """    const requiresConfirmation = placement.id === 'reset'\n      || (placement.id === 'daily' && !this.options.dailyActive);\n""",
    """    const requiresConfirmation = placement.id === 'reset';\n""",
)
replace_once(
    'src/game/ui/TopHudActions.ts',
    """function labelFor(id: HudActionId, compact: boolean, dailyKey: string, dailyActive: boolean): string {\n  if (id === 'daily') {\n    if (compact) return dailyActive ? 'DAILY • BOARD' : `DAILY • ${dailyKey.slice(5)}`;\n    return dailyActive ? `DAILY BOARD • ${dailyKey}` : `DAILY RUN • ${dailyKey}`;\n  }\n""",
    """function labelFor(id: HudActionId, compact: boolean, _dailyKey: string, dailyActive: boolean): string {\n  if (id === 'daily') {\n    if (compact) return dailyActive ? 'CHALLENGE • D' : 'CHALLENGES';\n    return dailyActive ? 'CHALLENGES • DAILY ACTIVE' : 'DAILY + WEEKLY CHALLENGES';\n  }\n""",
)

# PrototypeScene — weekly runtime, challenge navigation, progress persistence.
replace_once(
    'src/game/scenes/PrototypeScene.ts',
    """import { createDailyRunIdentity, dailyKeyFromSeed } from '../domain/dailyRun';\n""",
    """import { createDailyRunIdentity, dailyKeyFromSeed } from '../domain/dailyRun';\nimport {\n  DEFAULT_WEEKLY_CHALLENGE,\n  createWeeklyBoardSnapshot,\n  recordWeeklyAttempt,\n  recordWeeklyProgress,\n  weeklyAttemptsBucket,\n  weeklyChallengeForKey,\n  weeklyChallengeIdentity,\n  weeklyKeyFromSeed,\n  weeklyScoreBucket,\n  weeklyTierForScore,\n  type WeeklyChallengeDefinition,\n} from '../domain/weeklyChallenge';\n""",
)
replace_once(
    'src/game/scenes/PrototypeScene.ts',
    """import { TutorialOverlay } from '../ui/TutorialOverlay';\n""",
    """import { TutorialOverlay } from '../ui/TutorialOverlay';\nimport { WeeklyChallengeOverlay } from '../ui/WeeklyChallengeOverlay';\n""",
)
replace_once(
    'src/game/scenes/PrototypeScene.ts',
    """function runtimeNowMs(): number {\n""",
    """function createWeeklyRun(challenge: WeeklyChallengeDefinition): ActiveRunSave {\n  const run = createFreshRun(challenge.seed);\n  const hero = PROTOTYPE_HERO_MAP.get(challenge.constraint.heroId);\n  return {\n    ...run,\n    coins: run.coins + Math.max(0, hero?.startingCoinsBonus ?? 0),\n    selectedPerkIds: [challenge.constraint.startingPerkId],\n    heroId: challenge.constraint.heroId,\n  };\n}\n\nfunction runtimeNowMs(): number {\n""",
)
replace_once(
    'src/game/scenes/PrototypeScene.ts',
    """    const todayDaily = createDailyRunIdentity();\n    save = { ...save, dailyRetention: ensureDailyRetentionDay(save.dailyRetention, todayDaily.key) };\n\n    let dailyOverlay: DailyBoardOverlay | null = null;\n    const activeDailyKey = (): string | null => dailyKeyFromSeed(activeRun.runSeed);\n""",
    """    const todayDaily = createDailyRunIdentity();\n    const thisWeek = weeklyChallengeIdentity();\n    save = {\n      ...save,\n      dailyRetention: ensureDailyRetentionDay(save.dailyRetention, todayDaily.key),\n      weeklyChallenge: save.weeklyChallenge ?? DEFAULT_WEEKLY_CHALLENGE,\n    };\n\n    let dailyOverlay: DailyBoardOverlay | null = null;\n    let weeklyOverlay: WeeklyChallengeOverlay | null = null;\n    const activeDailyKey = (): string | null => dailyKeyFromSeed(activeRun.runSeed);\n    const activeWeeklyKey = (): string | null => weeklyKeyFromSeed(activeRun.runSeed);\n    const weeklyState = () => save.weeklyChallenge ?? DEFAULT_WEEKLY_CHALLENGE;\n""",
)
replace_once(
    'src/game/scenes/PrototypeScene.ts',
    """    const recordDailyCounter = (counter: DailyCounterKey, amount = 1): void => {\n      const key = activeDailyKey();\n      if (!key) return;\n      save = { ...save, dailyRetention: incrementDailyCounter(save.dailyRetention, key, counter, amount) };\n      syncDailyContracts();\n    };\n""",
    """    const recordDailyCounter = (counter: DailyCounterKey, amount = 1): void => {\n      const key = activeDailyKey();\n      if (!key) return;\n      save = { ...save, dailyRetention: incrementDailyCounter(save.dailyRetention, key, counter, amount) };\n      syncDailyContracts();\n    };\n    const syncWeeklyProgress = (): void => {\n      const key = activeWeeklyKey();\n      if (!key) return;\n      const update = recordWeeklyProgress(weeklyState(), key, activeRun.progress.score, activeRun.progress.loopNumber);\n      save = { ...save, weeklyChallenge: update.state };\n      if (weeklyOverlay?.isVisible()) weeklyOverlay.refresh();\n    };\n""",
)
replace_once(
    'src/game/scenes/PrototypeScene.ts',
    """    dailyOverlay = new DailyBoardOverlay(this, {\n      getSnapshot: () => createDailyBoardSnapshot(save.dailyRetention, todayDaily.key, { progress: activeRun.progress }),\n      reducedMotion: save.settings.reducedMotion,\n""",
    """    dailyOverlay = new DailyBoardOverlay(this, {\n      getSnapshot: () => createDailyBoardSnapshot(save.dailyRetention, todayDaily.key, { progress: activeRun.progress }),\n      getRunState: () => activeDailyKey() === todayDaily.key\n        ? activeRun.progress.mode === 'complete' ? 'complete' : 'active'\n        : 'inactive',\n      onStartOrResumeDaily: () => {\n        if (activeDailyKey() === todayDaily.key && activeRun.progress.mode !== 'complete') {\n          dailyOverlay?.hide();\n          return;\n        }\n        activeRun = createFreshRun(todayDaily.seed);\n        save = { ...save, dailyRetention: ensureDailyRetentionDay(save.dailyRetention, todayDaily.key) };\n        telemetry.track('run_started', { mode: 'daily' });\n        persistRun();\n        this.scene.restart();\n      },\n      onOpenWeekly: () => {\n        dailyOverlay?.hide();\n        this.time.delayedCall(save.settings.reducedMotion ? 0 : 160, () => weeklyOverlay?.show());\n      },\n      reducedMotion: save.settings.reducedMotion,\n""",
)
replace_once(
    'src/game/scenes/PrototypeScene.ts',
    """    });\n\n    const perkOverlay = new PerkChoiceOverlay(this, PROTOTYPE_PERK_MAP, (perkId) => {\n""",
    """    });\n\n    weeklyOverlay = new WeeklyChallengeOverlay(this, {\n      getSnapshot: () => createWeeklyBoardSnapshot(weeklyState(), thisWeek.key),\n      getRunState: () => activeWeeklyKey() === thisWeek.key\n        ? activeRun.progress.mode === 'complete' ? 'complete' : 'active'\n        : 'inactive',\n      onStartOrResume: () => {\n        if (activeWeeklyKey() === thisWeek.key && activeRun.progress.mode !== 'complete') {\n          weeklyOverlay?.hide();\n          return;\n        }\n        const challenge = weeklyChallengeForKey(thisWeek.key);\n        const nextWeekly = recordWeeklyAttempt(weeklyState(), thisWeek.key);\n        activeRun = createWeeklyRun(challenge);\n        save = { ...save, weeklyChallenge: nextWeekly };\n        const attempt = nextWeekly.history.find((entry) => entry.key === thisWeek.key)?.attempts ?? 1;\n        telemetry.track('run_started', { mode: 'weekly' });\n        telemetry.track('weekly_attempt_started', {\n          constraintId: challenge.constraint.id,\n          attemptsBucket: weeklyAttemptsBucket(attempt),\n        });\n        persistRun();\n        this.scene.restart();\n      },\n      reducedMotion: save.settings.reducedMotion,\n    });\n\n    const perkOverlay = new PerkChoiceOverlay(this, PROTOTYPE_PERK_MAP, (perkId) => {\n""",
)
replace_once(
    'src/game/scenes/PrototypeScene.ts',
    """        if (current.kind === 'boss') recordDailyCounter('bossVictories');\n        else syncDailyContracts();\n        if (previousProgress.mode === 'loop' && nextProgress.mode === 'deep-choice') {\n""",
    """        if (current.kind === 'boss') recordDailyCounter('bossVictories');\n        else syncDailyContracts();\n        syncWeeklyProgress();\n        if (previousProgress.mode === 'loop' && nextProgress.mode === 'deep-choice') {\n""",
)
replace_once(
    'src/game/scenes/PrototypeScene.ts',
    """      || settingsOverlay.isVisible()\n      || dailyOverlay?.isVisible() === true;\n""",
    """      || settingsOverlay.isVisible()\n      || dailyOverlay?.isVisible() === true\n      || weeklyOverlay?.isVisible() === true;\n""",
)
replace_once(
    'src/game/scenes/PrototypeScene.ts',
    """        telemetry.track('loop_entered', { loopNumber: activeRun.progress.loopNumber });\n        syncDailyContracts();\n        persistRun();\n""",
    """        telemetry.track('loop_entered', { loopNumber: activeRun.progress.loopNumber });\n        syncDailyContracts();\n        syncWeeklyProgress();\n        persistRun();\n""",
)
replace_once(
    'src/game/scenes/PrototypeScene.ts',
    """        const completedLoop = activeRun.progress.loopNumber;\n        const finalScore = activeRun.progress.score;\n        awardHeroMastery('cashout', { loopNumber: completedLoop });\n        activeRun = { ...activeRun, progress: cashOutRun(activeRun.progress) };\n        telemetry.track('run_cashout', { loopNumber: completedLoop, score: finalScore });\n        syncDailyContracts();\n        persistRun();\n""",
    """        const completedLoop = activeRun.progress.loopNumber;\n        const finalScore = activeRun.progress.score;\n        const weeklyKey = activeWeeklyKey();\n        awardHeroMastery('cashout', { loopNumber: completedLoop });\n        activeRun = { ...activeRun, progress: cashOutRun(activeRun.progress) };\n        telemetry.track('run_cashout', { loopNumber: completedLoop, score: finalScore });\n        syncDailyContracts();\n        if (weeklyKey) {\n          const update = recordWeeklyProgress(weeklyState(), weeklyKey, finalScore, completedLoop);\n          save = { ...save, weeklyChallenge: update.state };\n          telemetry.track('weekly_attempt_finished', {\n            tier: weeklyTierForScore(finalScore),\n            scoreBucket: weeklyScoreBucket(finalScore),\n            deepestLoop: completedLoop,\n            attemptsBucket: weeklyAttemptsBucket(update.entry.attempts),\n          });\n        }\n        persistRun();\n""",
)
replace_once(
    'src/game/scenes/PrototypeScene.ts',
    """      onDaily: () => {\n        if (combatPanel.isRunning() || eventOverlay.isVisible() || metaBlocked()\n          || activeRun.pendingPerkOfferIds.length > 0 || activeRun.pendingEventId !== null) return;\n        if (activeDailyKey() === todayDaily.key) {\n          dailyOverlay?.show();\n          return;\n        }\n        activeRun = createFreshRun(todayDaily.seed);\n        save = { ...save, dailyRetention: ensureDailyRetentionDay(save.dailyRetention, todayDaily.key) };\n        telemetry.track('run_started', { mode: 'daily' });\n        persistRun();\n        this.scene.restart();\n      },\n""",
    """      onDaily: () => {\n        if (combatPanel.isRunning() || eventOverlay.isVisible() || metaBlocked()\n          || activeRun.pendingPerkOfferIds.length > 0 || activeRun.pendingEventId !== null) return;\n        dailyOverlay?.show();\n      },\n""",
)
replace_once(
    'src/game/scenes/PrototypeScene.ts',
    """      const dailyKey = dailyKeyFromSeed(runSeed);\n      const dailyRule = dailyRealityRuleForSeed(runSeed);\n      const runLabel = dailyKey\n        ? `DAILY ${dailyKey}${dailyRule ? ` • ${dailyRule.name.toUpperCase()}` : ''}`\n        : 'STANDARD RUN';\n""",
    """      const dailyKey = dailyKeyFromSeed(runSeed);\n      const dailyRule = dailyRealityRuleForSeed(runSeed);\n      const weeklyKey = weeklyKeyFromSeed(runSeed);\n      const weekly = weeklyKey ? weeklyChallengeForKey(weeklyKey) : null;\n      const runLabel = weekly\n        ? `WEEKLY ${weeklyKey} • ${weekly.constraint.name.toUpperCase()}`\n        : dailyKey\n          ? `DAILY ${dailyKey}${dailyRule ? ` • ${dailyRule.name.toUpperCase()}` : ''}`\n          : 'STANDARD RUN';\n""",
)

print('weekly R3 runtime integration applied')
