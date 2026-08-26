import * as Phaser from 'phaser';
import { telemetry } from '../../analytics/Telemetry';
import {
  clearActiveRun,
  loadSave,
  writeSave,
  type ActiveRunSave,
  type SaveV9,
} from '../../persistence/save';
import { uiAudioCue } from '../audio/audioCues';
import { GameAudio } from '../audio/GameAudio';
import { dailyRealityRuleForSeed, bonusPocketUnlocksForRun, claimDailyContract, claimDailyTrackReward, createDailyBoardSnapshot, dailyBoardProgressForRun, ensureDailyRetentionDay, evaluateDailyContracts, incrementDailyCounter, perkChoiceCountForRun, rerollCostForRun, startingCoinsForRun, type DailyCounterKey } from '../domain/dailyRetention';
import { PROTOTYPE_COMBAT_PROFILE_MAP } from '../data/combatProfiles';
import { PROTOTYPE_FUSION_RECIPES, SECOND_STAGE_FUSION_RECIPE_IDS } from '../data/fusionRecipes';
import { PROTOTYPE_HEROES, PROTOTYPE_HERO_MAP } from '../data/heroes';
import { PROTOTYPE_ITEM_MAP, PROTOTYPE_ITEMS, PROTOTYPE_SHOP_ITEMS } from '../data/items';
import { PROTOTYPE_PERKS, PROTOTYPE_PERK_MAP } from '../data/perks';
import { getRuntimeRunEncounter } from '../data/dailyRunEncounters';
import { PROTOTYPE_RUN_EVENT_MAP, PROTOTYPE_RUN_EVENTS } from '../data/runEvents';
import { BACKPACK_HEIGHT, BACKPACK_WIDTH, blockedCellsForPocketUnlockCount } from '../domain/backpackLayout';
import { evaluateBossMasteryChallenge } from '../domain/bossMasteryChallenges';
import { recordBossMasteryChallenge, recordBossOutcome } from '../domain/bossGrudges';
import { createCombatBuild } from '../domain/combatBuild';
import { createDailyRunIdentity, dailyKeyFromSeed } from '../domain/dailyRun';
import {
  DEFAULT_WEEKLY_CHALLENGE,
  createWeeklyBoardSnapshot,
  recordWeeklyAttempt,
  recordWeeklyProgress,
  weeklyAttemptsBucket,
  weeklyChallengeForKey,
  weeklyChallengeIdentity,
  weeklyKeyFromSeed,
  weeklyScoreBucket,
  weeklyTierForScore,
  type WeeklyChallengeDefinition,
} from '../domain/weeklyChallenge';
import { applyFusion, type FusionRecipe } from '../domain/fusions';
import {
  addHeroMasteryXp,
  createHeroMasterySnapshot,
  heroMasteryAwardForAction,
  type HeroMasteryAction,
  type HeroMasteryAwardContext,
} from '../domain/heroMastery';
import type { HeroId } from '../domain/heroes';
import type { InventoryState } from '../domain/inventory';
import { shouldAutoShowOnboarding } from '../domain/onboarding';
import { generatePerkChoices } from '../domain/perks';
import { resolveRunEventChoice, selectRunEvent } from '../domain/runEvents';
import {
  backpackUnlockedPocketCount,
  cashOutRun,
  createInitialRunProgress,
  enterCorruptedLoop,
  MAX_BASE_POCKET_UNLOCKS,
  registerRunVictory,
} from '../domain/runProgression';
import { createStandardRunSeed } from '../domain/runSeed';
import { BackpackBoard } from '../ui/BackpackBoard';
import { CollectionOverlay } from '../ui/CollectionOverlay';
import { CombatFeedback } from '../ui/CombatFeedback';
import { CombatPanel } from '../ui/CombatPanel';
import { DailyBoardOverlay } from '../ui/DailyBoardOverlay';
import { FusionPanel } from '../ui/FusionPanel';
import { HeroChoiceOverlay } from '../ui/HeroChoiceOverlay';
import { MasteryGrudgeOverlay } from '../ui/MasteryGrudgeOverlay';
import { MetaProgressFeedback } from '../ui/MetaProgressFeedback';
import { MetaProgressOverlay } from '../ui/MetaProgressOverlay';
import { PerkChoiceOverlay } from '../ui/PerkChoiceOverlay';
import { RunEventOverlay } from '../ui/RunEventOverlay';
import { RunFeedback } from '../ui/RunFeedback';
import { RunProgressPanel } from '../ui/RunProgressPanel';
import { SettingsOverlay } from '../ui/SettingsOverlay';
import { ShopPanel } from '../ui/ShopPanel';
import { TopHudActions } from '../ui/TopHudActions';
import { TutorialOverlay } from '../ui/TutorialOverlay';
import { WeeklyChallengeOverlay } from '../ui/WeeklyChallengeOverlay';

const AUDIO_REGISTRY_KEY = 'junkpack.game-audio';
const COLORS = { background: 0x0d1117, text: '#f7f2e8', muted: '#aaa5b2' } as const;

function createFreshRun(runSeed: string): ActiveRunSave {
  return {
    runSeed,
    shopIndex: 0,
    coins: startingCoinsForRun(runSeed),
    soldOfferIds: [],
    backpackItems: [],
    nextLootSequence: 1,
    claimedEncounterIds: [],
    selectedPerkIds: [],
    perkChoiceIndex: 0,
    pendingPerkOfferIds: [],
    offeredPerkEncounterIds: [],
    progress: createInitialRunProgress(),
    eventIndex: 0,
    pendingEventId: null,
    resolvedEventIds: [],
    heroId: null,
  };
}

function createWeeklyRun(challenge: WeeklyChallengeDefinition): ActiveRunSave {
  const run = createFreshRun(challenge.seed);
  const hero = PROTOTYPE_HERO_MAP.get(challenge.constraint.heroId);
  return {
    ...run,
    coins: run.coins + Math.max(0, hero?.startingCoinsBonus ?? 0),
    selectedPerkIds: [challenge.constraint.startingPerkId],
    heroId: challenge.constraint.heroId,
  };
}

function runtimeNowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export class PrototypeScene extends Phaser.Scene {
  constructor() { super('prototype'); }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.drawHeader();

    let save: SaveV9 = loadSave();
    let audio = this.registry.get(AUDIO_REGISTRY_KEY) as GameAudio | undefined;
    if (!audio) {
      audio = new GameAudio(save.settings);
      this.registry.set(AUDIO_REGISTRY_KEY, audio);
    } else {
      audio.setVolumes(save.settings);
    }
    const requestAudioUnlock = (): void => {
      if (!audio.isUnlocked()) void audio.unlock();
    };
    this.input.on('pointerdown', requestAudioUnlock);
    this.input.keyboard?.on('keydown', requestAudioUnlock);
    this.events.once('shutdown', () => {
      this.input.off('pointerdown', requestAudioUnlock);
      this.input.keyboard?.off('keydown', requestAudioUnlock);
    });

    const hadActiveRun = save.activeRun !== null;
    const autoShowTutorial = shouldAutoShowOnboarding({
      hadActiveRun,
      discoveredItemCount: save.discoveredItemIds.length,
      discoveredRecipeCount: save.discoveredRecipeIds.length,
    });
    let activeRun: ActiveRunSave = save.activeRun ?? createFreshRun(createStandardRunSeed());
    if (!hadActiveRun) telemetry.track('run_started', { mode: 'standard' });
    const todayDaily = createDailyRunIdentity();
    const thisWeek = weeklyChallengeIdentity();
    save = {
      ...save,
      dailyRetention: ensureDailyRetentionDay(save.dailyRetention, todayDaily.key),
      weeklyChallenge: save.weeklyChallenge ?? DEFAULT_WEEKLY_CHALLENGE,
    };

    let dailyOverlay: DailyBoardOverlay | null = null;
    let weeklyOverlay: WeeklyChallengeOverlay | null = null;
    const activeDailyKey = (): string | null => dailyKeyFromSeed(activeRun.runSeed);
    const activeWeeklyKey = (): string | null => weeklyKeyFromSeed(activeRun.runSeed);
    const weeklyState = () => save.weeklyChallenge ?? DEFAULT_WEEKLY_CHALLENGE;
    const effectivePocketCount = (): number => Math.min(
      MAX_BASE_POCKET_UNLOCKS,
      backpackUnlockedPocketCount(activeRun.progress) + bonusPocketUnlocksForRun(activeRun.runSeed),
    );
    const persistRun = (): void => {
      save = { ...save, activeRun };
      writeSave(save);
    };
    const syncDailyContracts = (): void => {
      const key = activeDailyKey();
      if (!key) return;
      const evaluation = evaluateDailyContracts(save.dailyRetention, key, { progress: activeRun.progress });
      save = { ...save, dailyRetention: evaluation.state };
      writeSave({ ...save, activeRun });
      if (dailyOverlay?.isVisible()) dailyOverlay.refresh();
    };
    const recordDailyCounter = (counter: DailyCounterKey, amount = 1): void => {
      const key = activeDailyKey();
      if (!key) return;
      save = { ...save, dailyRetention: incrementDailyCounter(save.dailyRetention, key, counter, amount) };
      syncDailyContracts();
    };
    const syncWeeklyProgress = (): void => {
      const key = activeWeeklyKey();
      if (!key) return;
      const update = recordWeeklyProgress(weeklyState(), key, activeRun.progress.score, activeRun.progress.loopNumber);
      save = { ...save, weeklyChallenge: update.state };
      if (weeklyOverlay?.isVisible()) weeklyOverlay.refresh();
    };
    const markDiscoveredItem = (definitionId: string): void => {
      if (save.discoveredItemIds.includes(definitionId)) return;
      save = { ...save, discoveredItemIds: [...save.discoveredItemIds, definitionId].sort() };
    };
    const markDiscoveredRecipe = (recipeId: string): void => {
      if (save.discoveredRecipeIds.includes(recipeId)) return;
      save = { ...save, discoveredRecipeIds: [...save.discoveredRecipeIds, recipeId].sort() };
    };

    const collectionOverlay = new CollectionOverlay(
      this,
      PROTOTYPE_ITEMS,
      PROTOTYPE_SHOP_ITEMS,
      PROTOTYPE_FUSION_RECIPES,
      () => ({ discoveredItemIds: save.discoveredItemIds, discoveredRecipeIds: save.discoveredRecipeIds }),
    );
    const metaOverlay = new MetaProgressOverlay(
      this,
      PROTOTYPE_ITEMS.map((item) => item.id),
      PROTOTYPE_FUSION_RECIPES.map((recipe) => recipe.id),
      SECOND_STAGE_FUSION_RECIPE_IDS,
      () => ({
        discoveredItemIds: save.discoveredItemIds,
        discoveredRecipeIds: save.discoveredRecipeIds,
        bestCorruptedLoop: save.bestCorruptedLoop,
      }),
    );
    let masteryOverlay!: MasteryGrudgeOverlay;
    masteryOverlay = new MasteryGrudgeOverlay(this, {
      getHeroMasteryXp: () => save.heroMasteryXp,
      getBossHistory: () => save.bossHistory,
      reducedMotion: save.settings.reducedMotion,
      onOpenArchiveTrophies: () => {
        masteryOverlay.hide();
        this.time.delayedCall(save.settings.reducedMotion ? 0 : 160, () => metaOverlay.show());
      },
    });
    const tutorialOverlay = new TutorialOverlay(this, save.settings.reducedMotion);
    const settingsOverlay = new SettingsOverlay(this, {
      getSettings: () => save.settings,
      onApply: (settings) => {
        const motionChanged = save.settings.reducedMotion !== settings.reducedMotion;
        save = { ...save, settings };
        writeSave(save);
        audio.setVolumes(settings);
        audio.playCue(uiAudioCue('ui.confirm', 'settings'));
        if (motionChanged) this.time.delayedCall(0, () => this.scene.restart());
      },
    });

    const board = new BackpackBoard(this, PROTOTYPE_ITEM_MAP, 90, 225, {
      initialItems: hadActiveRun ? activeRun.backpackItems : undefined,
      nextLootSequence: activeRun.nextLootSequence,
      unlockedPocketCount: effectivePocketCount(),
      onStateChanged: (snapshot) => {
        activeRun = { ...activeRun, backpackItems: snapshot.items, nextLootSequence: snapshot.nextLootSequence };
        persistRun();
      },
    });
    const boardSnapshot = board.getSnapshot();
    activeRun = { ...activeRun, backpackItems: boardSnapshot.items, nextLootSequence: boardSnapshot.nextLootSequence };
    this.drawSynergies();

    const combatFeedback = new CombatFeedback(this, {
      getBackpackItems: () => board.getSnapshot().items,
      itemDefinitions: PROTOTYPE_ITEM_MAP,
      reducedMotion: save.settings.reducedMotion,
      backpackGrid: { left: 90, top: 225, cellSize: 76 },
      enemyPoint: { x: 1225, y: 403 },
      playerPoint: { x: 845, y: 287 },
    });
    const runFeedback = new RunFeedback(this, save.settings.reducedMotion);
    const metaFeedback = new MetaProgressFeedback(this, save.settings.reducedMotion);
    const awardHeroMastery = (action: HeroMasteryAction, context: HeroMasteryAwardContext = {}): void => {
      const heroId = activeRun.heroId;
      if (!heroId) return;
      const award = heroMasteryAwardForAction(action, context);
      const result = addHeroMasteryXp(save.heroMasteryXp, heroId, award);
      if (result.gainedXp <= 0) return;
      save = { ...save, heroMasteryXp: result.state };
      if (result.levelsGained > 0 || result.rewardsUnlocked.length > 0) {
        const heroName = PROTOTYPE_HERO_MAP.get(heroId)?.name ?? heroId;
        const mastery = createHeroMasterySnapshot(heroId, result.state);
        metaFeedback.masteryLevel(heroName, mastery.level, result.rewardsUnlocked[result.rewardsUnlocked.length - 1]?.name);
      }
    };

    const shop = new ShopPanel(
      this,
      PROTOTYPE_SHOP_ITEMS,
      90,
      735,
      (definitionId) => {
        const added = board.addRewardItem(definitionId);
        if (added) { markDiscoveredItem(definitionId); persistRun(); }
        return added;
      },
      {
        runSeed: activeRun.runSeed,
        initialCoins: activeRun.coins,
        initialShopIndex: activeRun.shopIndex,
        initialSoldOfferIds: activeRun.soldOfferIds,
        rerollCost: rerollCostForRun(activeRun.runSeed),
        onStateChanged: (snapshot) => {
          activeRun = { ...activeRun, coins: snapshot.coins, shopIndex: snapshot.shopIndex, soldOfferIds: snapshot.soldOfferIds };
          persistRun();
        },
        onFeedback: (event) => {
          if (event.kind === 'purchase') {
            recordDailyCounter('shopPurchases');
            audio.playCue(uiAudioCue('ui.purchase', event.definitionId));
            runFeedback.purchase(PROTOTYPE_ITEM_MAP.get(event.definitionId)?.name ?? event.definitionId);
            return;
          }
          if (event.kind === 'reroll') {
            audio.playCue(uiAudioCue('ui.reroll', 'shop'));
            return;
          }
          if (event.kind === 'reward') {
            audio.playCue(uiAudioCue('ui.reward', 'coins'));
            runFeedback.rewardCoins(event.amount);
            return;
          }
          audio.playCue(uiAudioCue('ui.error', event.source));
        },
      },
    );
    const shopSnapshot = shop.getSnapshot();
    activeRun = { ...activeRun, coins: shopSnapshot.coins, shopIndex: shopSnapshot.shopIndex, soldOfferIds: shopSnapshot.soldOfferIds };
    let runPanel!: RunProgressPanel;

    dailyOverlay = new DailyBoardOverlay(this, {
      getSnapshot: () => createDailyBoardSnapshot(save.dailyRetention, todayDaily.key, { progress: dailyBoardProgressForRun(activeRun.runSeed, todayDaily.key, activeRun.progress) }),
      getRunState: () => activeDailyKey() === todayDaily.key
        ? activeRun.progress.mode === 'complete' ? 'complete' : 'active'
        : 'inactive',
      onStartOrResumeDaily: () => {
        if (activeDailyKey() === todayDaily.key && activeRun.progress.mode !== 'complete') {
          dailyOverlay?.hide();
          return;
        }
        activeRun = createFreshRun(todayDaily.seed);
        save = { ...save, dailyRetention: ensureDailyRetentionDay(save.dailyRetention, todayDaily.key) };
        telemetry.track('run_started', { mode: 'daily' });
        persistRun();
        this.scene.restart();
      },
      onOpenWeekly: () => {
        dailyOverlay?.hide();
        this.time.delayedCall(save.settings.reducedMotion ? 0 : 160, () => weeklyOverlay?.show());
      },
      reducedMotion: save.settings.reducedMotion,
      onClaimContract: (contractId) => {
        if (activeDailyKey() !== todayDaily.key) return false;
        const result = claimDailyContract(save.dailyRetention, todayDaily.key, contractId);
        if (!result.claimed) return false;
        save = { ...save, dailyRetention: result.state };
        awardHeroMastery('daily-contract');
        writeSave({ ...save, activeRun });
        audio.playCue(uiAudioCue('ui.reward', 'daily-contract'));
        return true;
      },
      onClaimTrackReward: (rewardId) => {
        const result = claimDailyTrackReward(save.dailyRetention, rewardId);
        if (!result.claimed) return false;
        save = { ...save, dailyRetention: result.state };
        writeSave({ ...save, activeRun });
        audio.playCue(uiAudioCue('ui.reward', 'daily-track'));
        return true;
      },
    });

    weeklyOverlay = new WeeklyChallengeOverlay(this, {
      getSnapshot: () => createWeeklyBoardSnapshot(weeklyState(), thisWeek.key),
      getRunState: () => activeWeeklyKey() === thisWeek.key
        ? activeRun.progress.mode === 'complete' ? 'complete' : 'active'
        : 'inactive',
      onStartOrResume: () => {
        if (activeWeeklyKey() === thisWeek.key && activeRun.progress.mode !== 'complete') {
          weeklyOverlay?.hide();
          return;
        }
        const challenge = weeklyChallengeForKey(thisWeek.key);
        const nextWeekly = recordWeeklyAttempt(weeklyState(), thisWeek.key);
        activeRun = createWeeklyRun(challenge);
        save = { ...save, weeklyChallenge: nextWeekly };
        const attempt = nextWeekly.history.find((entry) => entry.key === thisWeek.key)?.attempts ?? 1;
        telemetry.track('run_started', { mode: 'weekly' });
        telemetry.track('weekly_attempt_started', {
          constraintId: challenge.constraint.id,
          attemptsBucket: weeklyAttemptsBucket(attempt),
        });
        persistRun();
        this.scene.restart();
      },
      reducedMotion: save.settings.reducedMotion,
    });

    const perkOverlay = new PerkChoiceOverlay(this, PROTOTYPE_PERK_MAP, (perkId) => {
      if (!activeRun.pendingPerkOfferIds.includes(perkId) || activeRun.selectedPerkIds.includes(perkId)) return;
      activeRun = {
        ...activeRun,
        selectedPerkIds: [...activeRun.selectedPerkIds, perkId],
        perkChoiceIndex: activeRun.perkChoiceIndex + 1,
        pendingPerkOfferIds: [],
      };
      recordDailyCounter('perkChoices');
      persistRun();
      audio.playCue(uiAudioCue('ui.confirm', perkId));
      perkOverlay.hide();
      runPanel.refresh('Perk locked in. Repack, shop, fuse, then continue.');
    });

    const eventOverlay = new RunEventOverlay(this, (event, choice) => {
      if (activeRun.pendingEventId !== event.id) return { ok: false, message: 'This event is no longer active.' };
      const resolution = resolveRunEventChoice(event, choice.id, activeRun.runSeed, activeRun.eventIndex);
      if (shop.getCoins() < resolution.costCoins) {
        audio.playCue(uiAudioCue('ui.error', 'event-coins'));
        return { ok: false, message: `Need ${resolution.costCoins - shop.getCoins()} more coins for that choice.` };
      }
      if (resolution.rewardDefinitionId) {
        const added = board.addRewardItem(resolution.rewardDefinitionId);
        if (!added) {
          audio.playCue(uiAudioCue('ui.error', 'event-space'));
          return { ok: false, message: 'No legal backpack space for the event reward. Rearrange junk first.' };
        }
        markDiscoveredItem(resolution.rewardDefinitionId);
        audio.playCue(uiAudioCue('ui.reward', resolution.rewardDefinitionId));
        runFeedback.eventItem(PROTOTYPE_ITEM_MAP.get(resolution.rewardDefinitionId)?.name ?? resolution.rewardDefinitionId);
      }
      if (!shop.spendCoins(resolution.costCoins, 'Event cost')) return { ok: false, message: 'The event payment failed.' };
      if (resolution.rewardCoins > 0) shop.addCoins(resolution.rewardCoins, 'Event payout');
      activeRun = {
        ...activeRun,
        eventIndex: activeRun.eventIndex + 1,
        pendingEventId: null,
        resolvedEventIds: [...activeRun.resolvedEventIds, event.id],
      };
      awardHeroMastery('event-choice');
      recordDailyCounter('eventChoices');
      persistRun();
      runPanel.refresh('Event resolved. Repack, shop or fuse before the next encounter.');
      return { ok: true, message: resolution.resultText };
    });

    let activeCombatStartedAtMs: number | null = null;
    let activeCombatEncounterId: string | null = null;

    const combatPanel = new CombatPanel(this, 1140, 445, {
      getBackpackItems: () => board.getSnapshot().items,
      getSelectedPerkIds: () => activeRun.selectedPerkIds,
      getHeroDefinition: () => activeRun.heroId ? PROTOTYPE_HERO_MAP.get(activeRun.heroId) : undefined,
      reducedMotion: save.settings.reducedMotion,
      onAudioCue: (cue) => { audio.playCue(cue); combatFeedback.play(cue); },
      onVictoryReward: ({ encounterId, coins }) => {
        if (activeRun.claimedEncounterIds.includes(encounterId)) return false;
        activeRun = { ...activeRun, claimedEncounterIds: [...activeRun.claimedEncounterIds, encounterId].sort() };
        persistRun();
        shop.addCoins(coins, 'Encounter bounty');
        return true;
      },
      onBossVictory: (encounterId) => {
        if (activeRun.offeredPerkEncounterIds.includes(encounterId) || activeRun.pendingPerkOfferIds.length > 0) return;
        const choices = generatePerkChoices(
          PROTOTYPE_PERKS,
          activeRun.runSeed,
          activeRun.perkChoiceIndex,
          activeRun.selectedPerkIds,
          perkChoiceCountForRun(activeRun.runSeed),
        );
        if (choices.length === 0) return;
        activeRun = {
          ...activeRun,
          pendingPerkOfferIds: choices.map((perk) => perk.id),
          offeredPerkEncounterIds: [...activeRun.offeredPerkEncounterIds, encounterId].sort(),
        };
        persistRun();
        perkOverlay.show(activeRun.pendingPerkOfferIds);
      },
      onOutcome: ({ encounterId, outcome }) => {
        const combatDurationMs = activeCombatEncounterId === encounterId && activeCombatStartedAtMs !== null
          ? Math.max(0, Math.round(runtimeNowMs() - activeCombatStartedAtMs))
          : 0;
        if (activeCombatEncounterId === encounterId && activeCombatStartedAtMs !== null) {
          telemetry.track('combat_finished', {
            encounterId,
            outcome,
            durationMs: combatDurationMs,
          });
        }
        const current = getRuntimeRunEncounter(activeRun.progress, activeRun.runSeed);
        const currentMatches = current?.encounterId === encounterId;
        if (currentMatches && current?.kind === 'boss') {
          const grudge = recordBossOutcome(save.bossHistory, current.enemy.id, outcome, combatDurationMs);
          if (grudge.tracked) {
            let nextBossHistory = grudge.history;
            if (outcome === 'victory') {
              const challengeInventory: InventoryState = {
                width: BACKPACK_WIDTH,
                height: BACKPACK_HEIGHT,
                blockedCells: [],
                items: board.getSnapshot().items,
              };
              const challengeBuild = createCombatBuild(
                challengeInventory,
                PROTOTYPE_ITEM_MAP,
                PROTOTYPE_COMBAT_PROFILE_MAP,
                PROTOTYPE_PERK_MAP,
                activeRun.selectedPerkIds,
                activeRun.heroId ? PROTOTYPE_HERO_MAP.get(activeRun.heroId) : undefined,
              );
              const challenge = evaluateBossMasteryChallenge(current.enemy.id, challengeBuild.items);
              if (challenge) {
                const mastery = recordBossMasteryChallenge(nextBossHistory, current.enemy.id, challenge.stars);
                nextBossHistory = mastery.history;
                if (mastery.improved) metaFeedback.bossMastery(challenge.bossId, mastery.bestStars);
              }
            }
            save = { ...save, bossHistory: nextBossHistory };
            if (grudge.revengeStarted) metaFeedback.grudge(current.title, false);
            if (grudge.revengeResolved) metaFeedback.grudge(current.title, true);
          }
        }
        activeCombatStartedAtMs = null;
        activeCombatEncounterId = null;

        if (outcome !== 'victory') {
          if (currentMatches) writeSave({ ...save, activeRun });
          runPanel.refresh('Defeat. Repack, shop or fuse, then retry the same encounter.');
          return;
        }
        if (!currentMatches || !current) return;
        const previousProgress = activeRun.progress;
        const previousPocketCount = effectivePocketCount();
        const nextProgress = registerRunVictory(previousProgress, current.scoreValue);
        activeRun = { ...activeRun, progress: nextProgress };
        const nextPocketCount = effectivePocketCount();
        if (current.kind === 'boss') {
          if (nextProgress.mode === 'deep-choice' && previousProgress.mode === 'campaign') {
            runFeedback.milestone('CAMPAIGN CLEARED', 'SIX WORLDS • REALITY BROKEN', 0xff91e6);
          } else if (nextProgress.mode === 'deep-choice' && previousProgress.mode === 'loop') {
            runFeedback.milestone('CORRUPTED LOOP CLEARED', `LOOP ${previousProgress.loopNumber} SURVIVED`, 0xd47cff);
          } else {
            runFeedback.milestone('WORLD CLEARED', `WORLD ${current.world} • BOSS DOWN`, 0xffd56e);
          }
        }

        awardHeroMastery(
          current.kind === 'boss' ? 'boss-victory' : current.kind === 'elite' ? 'elite-victory' : 'fight-victory',
          { loopNumber: previousProgress.loopNumber },
        );
        if (nextProgress.mode === 'deep-choice' && previousProgress.mode === 'campaign') {
          awardHeroMastery('campaign-clear', { loopNumber: 1 });
        } else if (nextProgress.mode === 'deep-choice' && previousProgress.mode === 'loop') {
          awardHeroMastery('loop-clear', { loopNumber: previousProgress.loopNumber });
        }

        let scheduledEventId: string | null = null;
        if (current.slot === 1 && activeRun.pendingEventId === null) {
          const previousEventId = activeRun.resolvedEventIds[activeRun.resolvedEventIds.length - 1] ?? null;
          scheduledEventId = selectRunEvent(
            PROTOTYPE_RUN_EVENTS,
            activeRun.runSeed,
            activeRun.eventIndex,
            previousEventId,
            current.world,
          ).id;
        }
        activeRun = { ...activeRun, pendingEventId: scheduledEventId ?? activeRun.pendingEventId };
        if (current.kind === 'boss') recordDailyCounter('bossVictories');
        else syncDailyContracts();
        syncWeeklyProgress();
        if (previousProgress.mode === 'loop' && nextProgress.mode === 'deep-choice') {
          save = { ...save, bestCorruptedLoop: Math.max(save.bestCorruptedLoop, previousProgress.loopNumber) };
        }
        const expanded = nextPocketCount > previousPocketCount ? board.setUnlockedPocketCount(nextPocketCount) : false;
        if (expanded) {
          audio.playCue(uiAudioCue('ui.pocket', `pocket-${nextPocketCount}`));
          runFeedback.pocketUnlock();
        }
        persistRun();

        if (scheduledEventId) {
          const event = PROTOTYPE_RUN_EVENT_MAP.get(scheduledEventId);
          if (event) eventOverlay.show(event);
          runPanel.refresh('STRANGE EVENT • make a choice before the next encounter.');
          return;
        }
        if (nextProgress.mode === 'deep-choice') {
          runPanel.refresh(nextProgress.loopNumber === 1
            ? 'Six worlds cleared. Escape now or take this build into a corrupted loop.'
            : `Loop ${nextProgress.loopNumber} cleared. Escape now or go deeper again.`);
          return;
        }
        runPanel.refresh(expanded
          ? 'BOSS DOWN • a new backpack pocket opened. Fusion lab may have new possibilities.'
          : 'Victory. Repack, spend rewards or fuse before the next encounter.');
      },
    });

    const metaBlocked = (): boolean => collectionOverlay.isVisible()
      || metaOverlay.isVisible()
      || masteryOverlay.isVisible()
      || tutorialOverlay.isVisible()
      || settingsOverlay.isVisible()
      || dailyOverlay?.isVisible() === true
      || weeklyOverlay?.isVisible() === true;

    runPanel = new RunProgressPanel(this, 570, 225, {
      getProgress: () => activeRun.progress,
      getEncounter: () => getRuntimeRunEncounter(activeRun.progress, activeRun.runSeed),
      onStartEncounter: (encounter) => {
        if (activeRun.heroId === null
          || activeRun.pendingPerkOfferIds.length > 0
          || activeRun.pendingEventId !== null
          || eventOverlay.isVisible()
          || metaBlocked()
          || combatPanel.isRunning()) return false;
        const current = getRuntimeRunEncounter(activeRun.progress, activeRun.runSeed);
        if (!current || current.encounterId !== encounter.encounterId) return false;
        const started = combatPanel.startEncounter(encounter.encounterId, encounter.enemy, encounter.rewardCoins);
        if (started) {
          activeCombatStartedAtMs = runtimeNowMs();
          activeCombatEncounterId = encounter.encounterId;
        }
        return started;
      },
      onEnterCorruptedLoop: () => {
        if (activeRun.heroId === null || combatPanel.isRunning() || metaBlocked()
          || activeRun.pendingPerkOfferIds.length > 0 || activeRun.pendingEventId !== null) return;
        activeRun = { ...activeRun, progress: enterCorruptedLoop(activeRun.progress) };
        telemetry.track('loop_entered', { loopNumber: activeRun.progress.loopNumber });
        runFeedback.milestone('CORRUPTED LOOP', `LOOP ${activeRun.progress.loopNumber} • REALITY BENDS`, 0xd47cff);
        syncDailyContracts();
        syncWeeklyProgress();
        persistRun();
        runPanel.refresh(`LOOP ${activeRun.progress.loopNumber} started. Mutations now stack.`);
      },
      onCashOut: () => {
        if (activeRun.heroId === null || combatPanel.isRunning() || metaBlocked()
          || activeRun.pendingPerkOfferIds.length > 0 || activeRun.pendingEventId !== null
          || activeRun.progress.mode !== 'deep-choice') return;
        const completedLoop = activeRun.progress.loopNumber;
        const finalScore = activeRun.progress.score;
        const weeklyKey = activeWeeklyKey();
        awardHeroMastery('cashout', { loopNumber: completedLoop });
        activeRun = { ...activeRun, progress: cashOutRun(activeRun.progress) };
        telemetry.track('run_cashout', { loopNumber: completedLoop, score: finalScore });
        syncDailyContracts();
        if (weeklyKey) {
          const update = recordWeeklyProgress(weeklyState(), weeklyKey, finalScore, completedLoop);
          save = { ...save, weeklyChallenge: update.state };
          telemetry.track('weekly_attempt_finished', {
            tier: weeklyTierForScore(finalScore),
            scoreBucket: weeklyScoreBucket(finalScore),
            deepestLoop: completedLoop,
            attemptsBucket: weeklyAttemptsBucket(update.entry.attempts),
          });
        }
        persistRun();
        runPanel.refresh('Run complete. Score and deepest completed loop are saved.');
      },
    });

    new FusionPanel(this, 570, 602, PROTOTYPE_FUSION_RECIPES, PROTOTYPE_ITEM_MAP, {
      getItems: () => board.getSnapshot().items,
      isUnlocked: () => {
        const campaignUnlocked = activeRun.progress.mode !== 'campaign' || activeRun.progress.campaignEncounterIndex >= 3;
        return activeRun.heroId !== null && campaignUnlocked && !combatPanel.isRunning()
          && !metaBlocked()
          && activeRun.pendingPerkOfferIds.length === 0 && activeRun.pendingEventId === null;
      },
      onFuse: (recipe: FusionRecipe) => {
        if (activeRun.heroId === null || combatPanel.isRunning() || metaBlocked()
          || activeRun.pendingPerkOfferIds.length > 0 || activeRun.pendingEventId !== null) return false;
        const snapshot = board.getSnapshot();
        const inventory: InventoryState = {
          width: BACKPACK_WIDTH,
          height: BACKPACK_HEIGHT,
          blockedCells: blockedCellsForPocketUnlockCount(effectivePocketCount()),
          items: snapshot.items,
        };
        const result = applyFusion(inventory, PROTOTYPE_ITEM_MAP, recipe, `fusion-${snapshot.nextLootSequence}-${recipe.resultDefinitionId}`);
        if (!result.ok) return false;
        activeRun = { ...activeRun, backpackItems: result.state.items, nextLootSequence: snapshot.nextLootSequence + 1 };
        markDiscoveredRecipe(recipe.id);
        markDiscoveredItem(recipe.resultDefinitionId);
        awardHeroMastery('fusion');
        recordDailyCounter('fusionUses');
        persistRun();
        this.time.delayedCall(save.settings.reducedMotion ? 160 : 460, () => this.scene.restart());
        return true;
      },
      onFeedback: (event) => {
        if (event.kind === 'cycle') { audio.playCue(uiAudioCue('ui.confirm', 'fusion-cycle')); return; }
        if (event.kind === 'error') { audio.playCue(uiAudioCue('ui.error', 'fusion')); return; }
        audio.playCue(uiAudioCue('ui.fusion', event.recipe.id));
        runFeedback.fusion(PROTOTYPE_ITEM_MAP.get(event.recipe.resultDefinitionId)?.name ?? event.recipe.name);
      },
    });

    const heroOverlay = new HeroChoiceOverlay(this, PROTOTYPE_HEROES, (heroId: HeroId) => {
      if (activeRun.heroId !== null) return;
      const hero = PROTOTYPE_HERO_MAP.get(heroId);
      if (!hero) return;
      activeRun = { ...activeRun, heroId };
      persistRun();
      audio.playCue(uiAudioCue('ui.confirm', heroId));
      if (hero.startingCoinsBonus > 0) shop.addCoins(hero.startingCoinsBonus, `${hero.name} starting stash`);
      heroOverlay.hide();
      this.time.delayedCall(0, () => this.scene.restart());
    });
    persistRun();
    syncDailyContracts();

    new TopHudActions(this, {
      dailyKey: todayDaily.key,
      dailyActive: dailyKeyFromSeed(activeRun.runSeed) === todayDaily.key,
      onDaily: () => {
        if (combatPanel.isRunning() || eventOverlay.isVisible() || metaBlocked()
          || activeRun.pendingPerkOfferIds.length > 0 || activeRun.pendingEventId !== null) return;
        dailyOverlay?.show();
      },
      onArchive: () => {
        if (activeRun.heroId === null || combatPanel.isRunning() || eventOverlay.isVisible() || metaBlocked()
          || activeRun.pendingPerkOfferIds.length > 0 || activeRun.pendingEventId !== null) return;
        collectionOverlay.show();
      },
      onTrophies: () => {
        if (activeRun.heroId === null || combatPanel.isRunning() || eventOverlay.isVisible() || metaBlocked()
          || activeRun.pendingPerkOfferIds.length > 0 || activeRun.pendingEventId !== null) return;
        masteryOverlay.show();
      },
      onHelp: () => {
        if (combatPanel.isRunning() || eventOverlay.isVisible() || metaBlocked()
          || activeRun.pendingPerkOfferIds.length > 0 || activeRun.pendingEventId !== null) return;
        tutorialOverlay.show();
      },
      onSettings: () => {
        if (activeRun.heroId === null || combatPanel.isRunning() || eventOverlay.isVisible() || metaBlocked()
          || activeRun.pendingPerkOfferIds.length > 0 || activeRun.pendingEventId !== null) return;
        settingsOverlay.show();
      },
      onReset: () => {
        if (combatPanel.isRunning() || eventOverlay.isVisible() || metaBlocked()
          || activeRun.pendingPerkOfferIds.length > 0 || activeRun.pendingEventId !== null) return;
        writeSave(clearActiveRun(loadSave()));
        this.scene.restart();
      },
    });

    if (activeRun.heroId === null) {
      heroOverlay.show();
    } else {
      if (activeRun.pendingPerkOfferIds.length > 0) perkOverlay.show(activeRun.pendingPerkOfferIds);
      if (activeRun.pendingEventId) {
        const event = PROTOTYPE_RUN_EVENT_MAP.get(activeRun.pendingEventId);
        if (event) eventOverlay.show(event);
        else { activeRun = { ...activeRun, pendingEventId: null }; persistRun(); }
      }
    }
    if (autoShowTutorial) tutorialOverlay.show();
    this.drawRunIdentity(() => activeRun.selectedPerkIds, () => activeRun.heroId, () => activeRun.runSeed);
  }

  private drawHeader(): void {
    this.add.text(800, 32, 'JUNKPACK', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '62px', color: COLORS.text,
      stroke: '#090a0d', strokeThickness: 10,
    }).setOrigin(0.5, 0);
    this.add.text(800, 94, 'BOSS RUSH', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '34px', color: '#b5ff4d',
      stroke: '#15121a', strokeThickness: 8,
    }).setOrigin(0.5, 0);
    this.add.text(48, 38, 'JUNK PILOT', { fontSize: '25px', color: COLORS.text, fontStyle: 'bold' });
    this.add.text(48, 73, '♥ 96 / 100', { fontSize: '22px', color: '#ff6578' });
    this.add.text(1190, 48, '6 WORLDS  •  HEROES  •  FUSIONS  •  CORRUPTED LOOPS', {
      fontSize: '16px', color: '#ff91e6', fontStyle: 'bold',
    });
  }

  private drawSynergies(): void {
    this.add.text(90, 165, 'BACKPACK 6×5  •  BOSS POCKET UNLOCKS  •  10 SPATIAL SYNERGIES', {
      fontSize: '20px', color: COLORS.text, fontStyle: 'bold',
    });
    this.add.text(90, 660, 'LIVE SYNERGIES — MOVE JUNK TO BREAK / REBUILD LINKS', {
      fontSize: '18px', color: '#ffcf69', fontStyle: 'bold',
    });
    this.add.text(90, 692, 'CORE: CAT • BATTERY • POISON • DUCK • MAGNET    EXPANDED: FOOD • ANTENNA • SLIME • METAL • CHAOS', {
      fontSize: '12px', color: COLORS.muted,
    });
  }

  private drawRunIdentity(
    getPerkIds: () => readonly string[],
    getHeroId: () => HeroId | null,
    getRunSeed: () => string,
  ): void {
    const text = this.add.text(570, 151, '', { fontSize: '12px', color: '#cfa8ff', fontStyle: 'bold' });
    const update = (): void => {
      const heroId = getHeroId();
      const heroName = heroId ? PROTOTYPE_HERO_MAP.get(heroId)?.name ?? heroId : 'choose hero';
      const perkNames = getPerkIds().map((id) => PROTOTYPE_PERK_MAP.get(id)?.name ?? id);
      const runSeed = getRunSeed();
      const dailyKey = dailyKeyFromSeed(runSeed);
      const dailyRule = dailyRealityRuleForSeed(runSeed);
      const weeklyKey = weeklyKeyFromSeed(runSeed);
      const weekly = weeklyKey ? weeklyChallengeForKey(weeklyKey) : null;
      const runLabel = weekly
        ? `WEEKLY ${weeklyKey} • ${weekly.constraint.name.toUpperCase()}`
        : dailyKey
          ? `DAILY ${dailyKey}${dailyRule ? ` • ${dailyRule.name.toUpperCase()}` : ''}`
          : 'STANDARD RUN';
      text.setText(`${runLabel}    HERO • ${heroName.toUpperCase()}    RUN PERKS • ${perkNames.length > 0 ? perkNames.join(' • ') : 'none yet'}`);
    };
    update();
    this.events.on('update', update);
    this.events.once('shutdown', () => this.events.off('update', update));
  }
}
