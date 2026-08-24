import * as Phaser from 'phaser';
import { PROTOTYPE_ITEM_MAP, PROTOTYPE_ITEMS } from '../data/items';
import { BackpackBoard } from '../ui/BackpackBoard';
import { CombatPanel } from '../ui/CombatPanel';
import { ShopPanel } from '../ui/ShopPanel';
import {
  clearActiveRun,
  loadSave,
  writeSave,
  type ActiveRunSave,
  type SaveV2,
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

    let save: SaveV2 = loadSave();
    const hadActiveRun = save.activeRun !== null;
    let activeRun: ActiveRunSave = save.activeRun ?? {
      runSeed: PROTOTYPE_RUN_SEED,
      shopIndex: 0,
      coins: 110,
      soldOfferIds: [],
      backpackItems: [],
      nextLootSequence: 1,
    };

    const persistRun = (): void => {
      save = { ...save, activeRun };
      writeSave(save);
    };

    const board = new BackpackBoard(this, PROTOTYPE_ITEM_MAP, 90, 225, {
      initialItems: hadActiveRun ? activeRun.backpackItems : undefined,
      nextLootSequence: activeRun.nextLootSequence,
      onStateChanged: (snapshot) => {
        activeRun = {
          ...activeRun,
          backpackItems: snapshot.items,
          nextLootSequence: snapshot.nextLootSequence,
        };
        persistRun();
      },
    });

    const boardSnapshot = board.getSnapshot();
    activeRun = {
      ...activeRun,
      backpackItems: boardSnapshot.items,
      nextLootSequence: boardSnapshot.nextLootSequence,
    };

    this.drawSynergies();
    new CombatPanel(this, 1140, 445, {
      getBackpackItems: () => board.getSnapshot().items,
      reducedMotion: save.settings.reducedMotion,
    });

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
          activeRun = {
            ...activeRun,
            coins: snapshot.coins,
            shopIndex: snapshot.shopIndex,
            soldOfferIds: snapshot.soldOfferIds,
          };
          persistRun();
        },
      },
    );

    const shopSnapshot = shop.getSnapshot();
    activeRun = {
      ...activeRun,
      coins: shopSnapshot.coins,
      shopIndex: shopSnapshot.shopIndex,
      soldOfferIds: shopSnapshot.soldOfferIds,
    };
    persistRun();
    this.createNewRunButton();
  }

  private drawHeader(): void {
    this.add.text(800, 32, 'JUNKPACK', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '62px',
      color: COLORS.text,
      stroke: '#090a0d',
      strokeThickness: 10,
    }).setOrigin(0.5, 0);

    this.add.text(800, 94, 'BOSS RUSH', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '34px',
      color: '#b5ff4d',
      stroke: '#15121a',
      strokeThickness: 8,
    }).setOrigin(0.5, 0);

    this.add.text(48, 38, 'SCRAPSTER', { fontSize: '25px', color: COLORS.text, fontStyle: 'bold' });
    this.add.text(48, 73, '♥ 96 / 100', { fontSize: '22px', color: '#ff6578' });
    this.add.text(1370, 48, 'COMBAT LAB  •  BUILD TEST', { fontSize: '21px', color: '#ff91e6', fontStyle: 'bold' });
  }

  private createNewRunButton(): void {
    const x = 1454;
    const y = 104;
    const button = this.add.rectangle(x, y, 168, 34, 0x252631, 1)
      .setStrokeStyle(2, 0x777381)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(x, y, 'NEW RUN / RESET', {
      fontSize: '12px',
      color: '#d2ced7',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    button.on('pointerover', () => button.setFillStyle(0x363843));
    button.on('pointerout', () => button.setFillStyle(0x252631));
    button.on('pointerdown', () => {
      button.setScale(0.97);
      label.setScale(0.97);
    });
    button.on('pointerup', () => {
      button.setScale(1);
      label.setScale(1);
      writeSave(clearActiveRun(loadSave()));
      this.scene.restart();
    });
  }

  private drawSynergies(): void {
    this.add.text(90, 165, 'BACKPACK 6×5  •  DRAG + ROTATE  •  SIDE-CONTACT BUILDS', {
      fontSize: '21px',
      color: COLORS.text,
      fontStyle: 'bold',
    });
    this.add.text(90, 660, 'LIVE SYNERGIES — MOVE JUNK TO BREAK / REBUILD LINKS', {
      fontSize: '18px',
      color: '#ffcf69',
      fontStyle: 'bold',
    });
    this.add.text(90, 692, 'CAT → LASER    BATTERY → DEVICE    POISON → WEAPON    DUCK → CHAOS    MAGNET → METAL', {
      fontSize: '14px',
      color: COLORS.muted,
    });
  }
}
