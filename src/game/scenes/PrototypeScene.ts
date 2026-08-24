import * as Phaser from 'phaser';
import { PROTOTYPE_ITEM_MAP, PROTOTYPE_ITEMS } from '../data/items';
import { PROTOTYPE_PERKS, PROTOTYPE_PERK_MAP } from '../data/perks';
import { getRunEncounter } from '../data/runEncounters';
import { generatePerkChoices } from '../domain/perks';
import {
  cashOutRun,
  createInitialRunProgress,
  enterEndless,
  registerRunVictory,
} from '../domain/runProgression';
import { BackpackBoard } from '../ui/BackpackBoard';
import { CombatPanel } from '../ui/CombatPanel';
import { PerkChoiceOverlay } from '../ui/PerkChoiceOverlay';
import { RunProgressPanel } from '../ui/RunProgressPanel';
import { ShopPanel } from '../ui/ShopPanel';
import {
  clearActiveRun,
  loadSave,
  writeSave,
  type ActiveRunSave,
  type SaveV5,
} from '../../persistence/save';

const PROTOTYPE_RUN_SEED = 'prototype-run-001';

const COLORS = {
  background: 0x0b0d13,
  text: '#f7f2e8',
  muted: '#aaa5b2',
} as const;

export class PrototypeScene extends Phaser.Scene {
  constructor() {
    super('prototype');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.drawHeader();

    let save: SaveV5 = loadSave();
    const hadActiveRun = save.activeRun !== null;
    let activeRun: ActiveRunSave = save.activeRun ?? {
      runSeed: PROTOTYPE_RUN_SEED,
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
    };

    const persistRun = (): void => {
      save = { ...save, activeRun };
      writeSave(save);
    };

    const board = new BackpackBoard(this, PROTOTYPE_ITEM_MAP, 90, 225, {
      initialItems: hadActiveRun ? activeRun.backpackItems : undefined,
      nextLootSequence: activeRun.nextLootSequence,
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
      PROTOTYPE_ITEMS,
      90,
      735,
      (definitionId) => board.addRewardItem(definitionId),
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
      runPanel.refresh('Perk locked in. Repack, shop, then continue.');
    });

    let runPanel!: RunProgressPanel;
    const combatPanel = new CombatPanel(this, 1140, 445, {
      getBackpackItems: () => board.getSnapshot().items,
      getSelectedPerkIds: () => activeRun.selectedPerkIds,
      reducedMotion: save.settings.reducedMotion,
      onVictoryReward: ({ encounterId, coins }) => {
        if (activeRun.claimedEncounterIds.includes(encounterId)) return false;
        activeRun = {
          ...activeRun,
          claimedEncounterIds: [...activeRun.claimedEncounterIds, encounterId].sort(),
        };
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
          3,
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
        if (outcome !== 'victory') {
          runPanel.refresh('Defeat. Repack or shop, then retry the same encounter.');
          return;
        }
        const current = getRunEncounter(activeRun.progress, activeRun.runSeed);
        if (!current || current.encounterId !== encounterId) return;
        const completedEndlessWave = activeRun.progress.mode === 'endless' ? activeRun.progress.endlessWave : 0;
        activeRun = {
          ...activeRun,
          progress: registerRunVictory(activeRun.progress, current.scoreValue),
        };
        if (completedEndlessWave > 0) {
          save = { ...save, bestEndlessWave: Math.max(save.bestEndlessWave, completedEndlessWave) };
        }
        persistRun();
        runPanel.refresh(activeRun.progress.mode === 'cashout'
          ? 'Campaign cleared. Cash out or risk the build in Endless.'
          : 'Victory. Repack and spend your reward before the next encounter.');
      },
    });

    runPanel = new RunProgressPanel(this, 570, 225, {
      getProgress: () => activeRun.progress,
      getEncounter: () => getRunEncounter(activeRun.progress, activeRun.runSeed),
      onStartEncounter: (encounter) => {
        if (activeRun.pendingPerkOfferIds.length > 0 || combatPanel.isRunning()) return false;
        const current = getRunEncounter(activeRun.progress, activeRun.runSeed);
        if (!current || current.encounterId !== encounter.encounterId) return false;
        return combatPanel.startEncounter(encounter.encounterId, encounter.enemy, encounter.rewardCoins);
      },
      onEnterEndless: () => {
        if (combatPanel.isRunning() || activeRun.pendingPerkOfferIds.length > 0) return;
        activeRun = { ...activeRun, progress: enterEndless(activeRun.progress) };
        persistRun();
        runPanel.refresh('Endless started. Every fifth wave is a corrupted boss.');
      },
      onCashOut: () => {
        if (combatPanel.isRunning()) return;
        activeRun = { ...activeRun, progress: cashOutRun(activeRun.progress) };
        persistRun();
        runPanel.refresh('Run complete. Score and best Endless wave are saved.');
      },
    });

    persistRun();
    this.createNewRunButton();
    if (activeRun.pendingPerkOfferIds.length > 0) perkOverlay.show(activeRun.pendingPerkOfferIds);
    this.drawActivePerks(() => activeRun.selectedPerkIds);
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
    this.add.text(48, 38, 'SCRAPSTER', { fontSize: '25px', color: COLORS.text, fontStyle: 'bold' });
    this.add.text(48, 73, '♥ 96 / 100', { fontSize: '22px', color: '#ff6578' });
    this.add.text(1320, 48, '3 WORLDS  •  9 ENCOUNTERS  •  ENDLESS', { fontSize: '18px', color: '#ff91e6', fontStyle: 'bold' });
  }

  private createNewRunButton(): void {
    const x = 1454;
    const y = 104;
    const button = this.add.rectangle(x, y, 168, 34, 0x252631, 1)
      .setStrokeStyle(2, 0x777381).setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, 'NEW RUN / RESET', {
      fontSize: '12px', color: '#d2ced7', fontStyle: 'bold',
    }).setOrigin(0.5);
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
    this.add.text(90, 165, 'BACKPACK 6×5  •  DRAG + ROTATE  •  SIDE-CONTACT BUILDS', {
      fontSize: '21px', color: COLORS.text, fontStyle: 'bold',
    });
    this.add.text(90, 660, 'LIVE SYNERGIES — MOVE JUNK TO BREAK / REBUILD LINKS', {
      fontSize: '18px', color: '#ffcf69', fontStyle: 'bold',
    });
    this.add.text(90, 692, 'CAT → LASER    BATTERY → DEVICE    POISON → WEAPON    DUCK → CHAOS    MAGNET → METAL', {
      fontSize: '14px', color: COLORS.muted,
    });
  }

  private drawActivePerks(getPerkIds: () => readonly string[]): void {
    const text = this.add.text(570, 151, '', { fontSize: '12px', color: '#cfa8ff', fontStyle: 'bold' });
    const update = (): void => {
      const names = getPerkIds().map((id) => PROTOTYPE_PERK_MAP.get(id)?.name ?? id);
      text.setText(names.length > 0 ? `RUN PERKS  •  ${names.join('  •  ')}` : 'RUN PERKS  •  none yet');
    };
    update();
    this.events.on('update', update);
    this.events.once('shutdown', () => this.events.off('update', update));
  }
}
