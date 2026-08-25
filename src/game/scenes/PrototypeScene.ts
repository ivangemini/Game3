import * as Phaser from 'phaser';
import { PROTOTYPE_FUSION_RECIPES, SECOND_STAGE_FUSION_RECIPE_IDS } from '../data/fusionRecipes';
import { PROTOTYPE_HEROES, PROTOTYPE_HERO_MAP } from '../data/heroes';
import { PROTOTYPE_ITEM_MAP, PROTOTYPE_ITEMS, PROTOTYPE_SHOP_ITEMS } from '../data/items';
import { PROTOTYPE_PERKS, PROTOTYPE_PERK_MAP } from '../data/perks';
import { getRunEncounter } from '../data/runEncounters';
import { PROTOTYPE_RUN_EVENT_MAP, PROTOTYPE_RUN_EVENTS } from '../data/runEvents';
import { BACKPACK_HEIGHT, BACKPACK_WIDTH, blockedCellsForPocketUnlockCount } from '../domain/backpackLayout';
import { createDailyRunIdentity, dailyKeyFromSeed } from '../domain/dailyRun';
import { applyFusion, type FusionRecipe } from '../domain/fusions';
import type { HeroId } from '../domain/heroes';
import type { InventoryState } from '../domain/inventory';
import { generatePerkChoices } from '../domain/perks';
import { resolveRunEventChoice, selectRunEvent } from '../domain/runEvents';
import {
  backpackUnlockedPocketCount,
  cashOutRun,
  createInitialRunProgress,
  enterCorruptedLoop,
  registerRunVictory,
} from '../domain/runProgression';
import { BackpackBoard } from '../ui/BackpackBoard';
import { CollectionOverlay } from '../ui/CollectionOverlay';
import { CombatPanel } from '../ui/CombatPanel';
import { FusionPanel } from '../ui/FusionPanel';
import { HeroChoiceOverlay } from '../ui/HeroChoiceOverlay';
import { MetaProgressOverlay } from '../ui/MetaProgressOverlay';
import { PerkChoiceOverlay } from '../ui/PerkChoiceOverlay';
import { RunEventOverlay } from '../ui/RunEventOverlay';
import { RunProgressPanel } from '../ui/RunProgressPanel';
import { ShopPanel } from '../ui/ShopPanel';
import {
  clearActiveRun,
  loadSave,
  writeSave,
  type ActiveRunSave,
  type SaveV8,
} from '../../persistence/save';

const PROTOTYPE_RUN_SEED = 'prototype-run-001';
const COLORS = { background: 0x0b0d13, text: '#f7f2e8', muted: '#aaa5b2' } as const;

function createFreshRun(runSeed: string): ActiveRunSave {
  return {
    runSeed,
    shopIndex: 0,
    coins: 110,
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

export class PrototypeScene extends Phaser.Scene {
  constructor() { super('prototype'); }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.drawHeader();

    let save: SaveV8 = loadSave();
    const hadActiveRun = save.activeRun !== null;
    let activeRun: ActiveRunSave = save.activeRun ?? createFreshRun(PROTOTYPE_RUN_SEED);
    const todayDaily = createDailyRunIdentity();

    const persistRun = (): void => {
      save = { ...save, activeRun };
      writeSave(save);
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
      () => ({
        discoveredItemIds: save.discoveredItemIds,
        discoveredRecipeIds: save.discoveredRecipeIds,
      }),
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

    const board = new BackpackBoard(this, PROTOTYPE_ITEM_MAP, 90, 225, {
      initialItems: hadActiveRun ? activeRun.backpackItems : undefined,
      nextLootSequence: activeRun.nextLootSequence,
      unlockedPocketCount: backpackUnlockedPocketCount(activeRun.progress),
      onStateChanged: (snapshot) => {
        activeRun = { ...activeRun, backpackItems: snapshot.items, nextLootSequence: snapshot.nextLootSequence };
        persistRun();
      },
    });
    const boardSnapshot = board.getSnapshot();
    activeRun = { ...activeRun, backpackItems: boardSnapshot.items, nextLootSequence: boardSnapshot.nextLootSequence };
    this.drawSynergies();

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
        onStateChanged: (snapshot) => {
          activeRun = { ...activeRun, coins: snapshot.coins, shopIndex: snapshot.shopIndex, soldOfferIds: snapshot.soldOfferIds };
          persistRun();
        },
      },
    );
    const shopSnapshot = shop.getSnapshot();
    activeRun = { ...activeRun, coins: shopSnapshot.coins, shopIndex: shopSnapshot.shopIndex, soldOfferIds: shopSnapshot.soldOfferIds };

    let runPanel!: RunProgressPanel;
    const perkOverlay = new PerkChoiceOverlay(this, PROTOTYPE_PERK_MAP, (perkId) => {
      if (!activeRun.pendingPerkOfferIds.includes(perkId) || activeRun.selectedPerkIds.includes(perkId)) return;
      activeRun = {
        ...activeRun,
        selectedPerkIds: [...activeRun.selectedPerkIds, perkId],
        perkChoiceIndex: activeRun.perkChoiceIndex + 1,
        pendingPerkOfferIds: [],
      };
      persistRun();
      perkOverlay.hide();
      runPanel.refresh('Perk locked in. Repack, shop, fuse, then continue.');
    });

    const eventOverlay = new RunEventOverlay(this, (event, choice) => {
      if (activeRun.pendingEventId !== event.id) return { ok: false, message: 'This event is no longer active.' };
      const resolution = resolveRunEventChoice(event, choice.id, activeRun.runSeed, activeRun.eventIndex);
      if (shop.getCoins() < resolution.costCoins) {
        return { ok: false, message: `Need ${resolution.costCoins - shop.getCoins()} more coins for that choice.` };
      }
      if (resolution.rewardDefinitionId) {
        const added = board.addRewardItem(resolution.rewardDefinitionId);
        if (!added) return { ok: false, message: 'No legal backpack space for the event reward. Rearrange junk first.' };
        markDiscoveredItem(resolution.rewardDefinitionId);
      }
      if (!shop.spendCoins(resolution.costCoins, 'Event cost')) return { ok: false, message: 'The event payment failed.' };
      if (resolution.rewardCoins > 0) shop.addCoins(resolution.rewardCoins, 'Event payout');
      activeRun = {
        ...activeRun,
        eventIndex: activeRun.eventIndex + 1,
        pendingEventId: null,
        resolvedEventIds: [...activeRun.resolvedEventIds, event.id],
      };
      persistRun();
      runPanel.refresh('Event resolved. Repack, shop or fuse before the next encounter.');
      return { ok: true, message: resolution.resultText };
    });

    const combatPanel = new CombatPanel(this, 1140, 445, {
      getBackpackItems: () => board.getSnapshot().items,
      getSelectedPerkIds: () => activeRun.selectedPerkIds,
      getHeroDefinition: () => activeRun.heroId ? PROTOTYPE_HERO_MAP.get(activeRun.heroId) : undefined,
      reducedMotion: save.settings.reducedMotion,
      onVictoryReward: ({ encounterId, coins }) => {
        if (activeRun.claimedEncounterIds.includes(encounterId)) return false;
        activeRun = { ...activeRun, claimedEncounterIds: [...activeRun.claimedEncounterIds, encounterId].sort() };
        persistRun();
        shop.addCoins(coins, 'Encounter bounty');
        return true;
      },
      onBossVictory: (encounterId) => {
        if (activeRun.offeredPerkEncounterIds.includes(encounterId) || activeRun.pendingPerkOfferIds.length > 0) return;
        const choices = generatePerkChoices(PROTOTYPE_PERKS, activeRun.runSeed, activeRun.perkChoiceIndex, activeRun.selectedPerkIds, 3);
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
        if (outcome !== 'victory') {
          runPanel.refresh('Defeat. Repack, shop or fuse, then retry the same encounter.');
          return;
        }
        const current = getRunEncounter(activeRun.progress, activeRun.runSeed);
        if (!current || current.encounterId !== encounterId) return;
        const previousProgress = activeRun.progress;
        const previousPocketCount = backpackUnlockedPocketCount(previousProgress);
        const nextProgress = registerRunVictory(previousProgress, current.scoreValue);
        const nextPocketCount = backpackUnlockedPocketCount(nextProgress);

        let scheduledEventId: string | null = null;
        if (current.slot === 1 && activeRun.pendingEventId === null) {
          const previousEventId = activeRun.resolvedEventIds[activeRun.resolvedEventIds.length - 1] ?? null;
          scheduledEventId = selectRunEvent(PROTOTYPE_RUN_EVENTS, activeRun.runSeed, activeRun.eventIndex, previousEventId).id;
        }
        activeRun = { ...activeRun, progress: nextProgress, pendingEventId: scheduledEventId ?? activeRun.pendingEventId };
        if (previousProgress.mode === 'loop' && nextProgress.mode === 'deep-choice') {
          save = { ...save, bestCorruptedLoop: Math.max(save.bestCorruptedLoop, previousProgress.loopNumber) };
        }
        const expanded = nextPocketCount > previousPocketCount ? board.setUnlockedPocketCount(nextPocketCount) : false;
        persistRun();

        if (scheduledEventId) {
          const event = PROTOTYPE_RUN_EVENT_MAP.get(scheduledEventId);
          if (event) eventOverlay.show(event);
          runPanel.refresh('STRANGE EVENT • make a choice before the next encounter.');
          return;
        }
        if (nextProgress.mode === 'deep-choice') {
          runPanel.refresh(nextProgress.loopNumber === 1
            ? 'Four worlds cleared. Escape now or take this build into a corrupted loop.'
            : `Loop ${nextProgress.loopNumber} cleared. Escape now or go deeper again.`);
          return;
        }
        runPanel.refresh(expanded
          ? 'BOSS DOWN • a new backpack pocket opened. Fusion lab may have new possibilities.'
          : 'Victory. Repack, spend rewards or fuse before the next encounter.');
      },
    });

    runPanel = new RunProgressPanel(this, 570, 225, {
      getProgress: () => activeRun.progress,
      getEncounter: () => getRunEncounter(activeRun.progress, activeRun.runSeed),
      onStartEncounter: (encounter) => {
        if (activeRun.heroId === null
          || activeRun.pendingPerkOfferIds.length > 0
          || activeRun.pendingEventId !== null
          || eventOverlay.isVisible()
          || collectionOverlay.isVisible()
          || metaOverlay.isVisible()
          || combatPanel.isRunning()) return false;
        const current = getRunEncounter(activeRun.progress, activeRun.runSeed);
        if (!current || current.encounterId !== encounter.encounterId) return false;
        return combatPanel.startEncounter(encounter.encounterId, encounter.enemy, encounter.rewardCoins);
      },
      onEnterCorruptedLoop: () => {
        if (activeRun.heroId === null || combatPanel.isRunning() || collectionOverlay.isVisible() || metaOverlay.isVisible()
          || activeRun.pendingPerkOfferIds.length > 0 || activeRun.pendingEventId !== null) return;
        activeRun = { ...activeRun, progress: enterCorruptedLoop(activeRun.progress) };
        persistRun();
        runPanel.refresh(`LOOP ${activeRun.progress.loopNumber} started. Mutations now stack.`);
      },
      onCashOut: () => {
        if (activeRun.heroId === null || combatPanel.isRunning() || collectionOverlay.isVisible() || metaOverlay.isVisible()
          || activeRun.pendingPerkOfferIds.length > 0 || activeRun.pendingEventId !== null) return;
        activeRun = { ...activeRun, progress: cashOutRun(activeRun.progress) };
        persistRun();
        runPanel.refresh('Run complete. Score and deepest completed loop are saved.');
      },
    });

    new FusionPanel(this, 570, 602, PROTOTYPE_FUSION_RECIPES, PROTOTYPE_ITEM_MAP, {
      getItems: () => board.getSnapshot().items,
      isUnlocked: () => {
        const campaignUnlocked = activeRun.progress.mode !== 'campaign' || activeRun.progress.campaignEncounterIndex >= 3;
        return activeRun.heroId !== null && campaignUnlocked && !combatPanel.isRunning()
          && !collectionOverlay.isVisible() && !metaOverlay.isVisible()
          && activeRun.pendingPerkOfferIds.length === 0 && activeRun.pendingEventId === null;
      },
      onFuse: (recipe: FusionRecipe) => {
        if (activeRun.heroId === null || combatPanel.isRunning() || collectionOverlay.isVisible() || metaOverlay.isVisible()
          || activeRun.pendingPerkOfferIds.length > 0 || activeRun.pendingEventId !== null) return false;
        const snapshot = board.getSnapshot();
        const inventory: InventoryState = {
          width: BACKPACK_WIDTH,
          height: BACKPACK_HEIGHT,
          blockedCells: blockedCellsForPocketUnlockCount(backpackUnlockedPocketCount(activeRun.progress)),
          items: snapshot.items,
        };
        const result = applyFusion(inventory, PROTOTYPE_ITEM_MAP, recipe, `fusion-${snapshot.nextLootSequence}-${recipe.resultDefinitionId}`);
        if (!result.ok) return false;
        activeRun = { ...activeRun, backpackItems: result.state.items, nextLootSequence: snapshot.nextLootSequence + 1 };
        markDiscoveredRecipe(recipe.id);
        markDiscoveredItem(recipe.resultDefinitionId);
        persistRun();
        this.time.delayedCall(0, () => this.scene.restart());
        return true;
      },
    });

    const heroOverlay = new HeroChoiceOverlay(this, PROTOTYPE_HEROES, (heroId: HeroId) => {
      if (activeRun.heroId !== null) return;
      const hero = PROTOTYPE_HERO_MAP.get(heroId);
      if (!hero) return;
      activeRun = { ...activeRun, heroId };
      persistRun();
      if (hero.startingCoinsBonus > 0) shop.addCoins(hero.startingCoinsBonus, `${hero.name} starting stash`);
      heroOverlay.hide();
      this.time.delayedCall(0, () => this.scene.restart());
    });

    persistRun();
    this.createNewRunButton();
    this.createDailyRunButton(todayDaily.key, dailyKeyFromSeed(activeRun.runSeed) === todayDaily.key, () => {
      if (combatPanel.isRunning() || eventOverlay.isVisible() || collectionOverlay.isVisible() || metaOverlay.isVisible()
        || activeRun.pendingPerkOfferIds.length > 0 || activeRun.pendingEventId !== null) return;
      activeRun = createFreshRun(todayDaily.seed);
      persistRun();
      this.scene.restart();
    });
    this.createCollectionButton(() => {
      if (activeRun.heroId === null || combatPanel.isRunning() || eventOverlay.isVisible() || metaOverlay.isVisible()
        || activeRun.pendingPerkOfferIds.length > 0 || activeRun.pendingEventId !== null) return;
      collectionOverlay.show();
    });
    this.createMetaButton(() => {
      if (activeRun.heroId === null || combatPanel.isRunning() || eventOverlay.isVisible() || collectionOverlay.isVisible()
        || activeRun.pendingPerkOfferIds.length > 0 || activeRun.pendingEventId !== null) return;
      metaOverlay.show();
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
    this.add.text(1190, 48, '4 WORLDS  •  HEROES  •  FUSIONS  •  CORRUPTED LOOPS', {
      fontSize: '16px', color: '#ff91e6', fontStyle: 'bold',
    });
  }

  private createDailyRunButton(key: string, active: boolean, onStart: () => void): void {
    const x = 365; const y = 104;
    const button = this.add.rectangle(x, y, 250, 34, active ? 0x314421 : 0x263224, 1)
      .setStrokeStyle(2, active ? 0xb5ff4d : 0x71994a)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, active ? `DAILY ${key}  •  ACTIVE` : `DAILY RUN  •  ${key}`, {
      fontSize: '11px', color: active ? '#dfffba' : '#c8e6a8', fontStyle: 'bold',
    }).setOrigin(0.5);
    button.on('pointerover', () => button.setFillStyle(active ? 0x415b2b : 0x354630));
    button.on('pointerout', () => button.setFillStyle(active ? 0x314421 : 0x263224));
    button.on('pointerdown', () => { button.setScale(0.97); label.setScale(0.97); });
    button.on('pointerup', () => {
      button.setScale(1); label.setScale(1); onStart();
    });
  }

  private createCollectionButton(onOpen: () => void): void {
    const x = 1244; const y = 104;
    const button = this.add.rectangle(x, y, 208, 34, 0x33243f, 1)
      .setStrokeStyle(2, 0xb26bd0)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, 'JUNK ARCHIVE  ◆', {
      fontSize: '12px', color: '#f4dfff', fontStyle: 'bold',
    }).setOrigin(0.5);
    button.on('pointerover', () => button.setFillStyle(0x493258));
    button.on('pointerout', () => button.setFillStyle(0x33243f));
    button.on('pointerdown', () => { button.setScale(0.97); label.setScale(0.97); });
    button.on('pointerup', () => {
      button.setScale(1); label.setScale(1); onOpen();
    });
  }

  private createMetaButton(onOpen: () => void): void {
    const x = 1348; const y = 145;
    const button = this.add.rectangle(x, y, 284, 30, 0x2a2233, 1)
      .setStrokeStyle(2, 0x8b6aa2)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, 'TROPHY SHELF  ✦  ARCHIVE RANKS', {
      fontSize: '10px', color: '#e7c8f5', fontStyle: 'bold',
    }).setOrigin(0.5);
    button.on('pointerover', () => button.setFillStyle(0x3b2e48));
    button.on('pointerout', () => button.setFillStyle(0x2a2233));
    button.on('pointerdown', () => { button.setScale(0.97); label.setScale(0.97); });
    button.on('pointerup', () => {
      button.setScale(1); label.setScale(1); onOpen();
    });
  }

  private createNewRunButton(): void {
    const x = 1454; const y = 104;
    const button = this.add.rectangle(x, y, 168, 34, 0x252631, 1).setStrokeStyle(2, 0x777381).setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, 'NEW RUN / RESET', { fontSize: '12px', color: '#d2ced7', fontStyle: 'bold' }).setOrigin(0.5);
    button.on('pointerover', () => button.setFillStyle(0x363843));
    button.on('pointerout', () => button.setFillStyle(0x252631));
    button.on('pointerdown', () => { button.setScale(0.97); label.setScale(0.97); });
    button.on('pointerup', () => {
      button.setScale(1); label.setScale(1);
      writeSave(clearActiveRun(loadSave()));
      this.scene.restart();
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
      const dailyKey = dailyKeyFromSeed(getRunSeed());
      const runLabel = dailyKey ? `DAILY ${dailyKey}` : 'STANDARD RUN';
      text.setText(`${runLabel}    HERO • ${heroName.toUpperCase()}    RUN PERKS • ${perkNames.length > 0 ? perkNames.join(' • ') : 'none yet'}`);
    };
    update();
    this.events.on('update', update);
    this.events.once('shutdown', () => this.events.off('update', update));
  }
}
