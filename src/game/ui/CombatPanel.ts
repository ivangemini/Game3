import * as Phaser from 'phaser';
import {
  PROTOTYPE_COMBAT_PROFILE_MAP,
  SCRAP_DUMMY,
  TV_TYRANT,
} from '../data/combatProfiles';
import { PROTOTYPE_ITEM_MAP } from '../data/items';
import { PROTOTYPE_PERK_MAP } from '../data/perks';
import {
  advanceCombat,
  createCombatState,
  type CombatPresentationEvent,
  type CombatSetup,
  type CombatState,
  type EnemyCombatDefinition,
} from '../domain/combat';
import { createCombatBuild } from '../domain/combatBuild';
import type { InventoryState } from '../domain/inventory';
import type { PlacedItem } from '../domain/types';

export interface CombatVictoryReward {
  readonly enemyId: string;
  readonly coins: number;
}

export interface CombatPanelOptions {
  readonly getBackpackItems: () => readonly PlacedItem[];
  readonly getSelectedPerkIds?: () => readonly string[];
  readonly reducedMotion?: boolean;
  readonly onVictoryReward?: (reward: CombatVictoryReward) => boolean;
  readonly onBossVictory?: (enemyId: string) => void;
}

export class CombatPanel {
  private readonly reducedMotion: boolean;
  private readonly getBackpackItems: () => readonly PlacedItem[];
  private readonly getSelectedPerkIds: () => readonly string[];
  private readonly onVictoryReward?: (reward: CombatVictoryReward) => boolean;
  private readonly onBossVictory?: (enemyId: string) => void;
  private readonly barGraphics: Phaser.GameObjects.Graphics;
  private readonly enemyBody: Phaser.GameObjects.Rectangle;
  private readonly enemyNameText: Phaser.GameObjects.Text;
  private readonly playerText: Phaser.GameObjects.Text;
  private readonly enemyText: Phaser.GameObjects.Text;
  private readonly poisonText: Phaser.GameObjects.Text;
  private readonly nextActionText: Phaser.GameObjects.Text;
  private readonly bossStatusText: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly eventLogText: Phaser.GameObjects.Text;
  private readonly dummyButton: Phaser.GameObjects.Rectangle;
  private readonly dummyLabel: Phaser.GameObjects.Text;
  private readonly bossButton: Phaser.GameObjects.Rectangle;
  private readonly bossLabel: Phaser.GameObjects.Text;
  private readonly eventLog: string[] = [];
  private setup: CombatSetup | null = null;
  private state: CombatState | null = null;
  private running = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly centerX: number,
    private readonly centerY: number,
    options: CombatPanelOptions,
  ) {
    this.reducedMotion = options.reducedMotion ?? false;
    this.getBackpackItems = options.getBackpackItems;
    this.getSelectedPerkIds = options.getSelectedPerkIds ?? (() => []);
    this.onVictoryReward = options.onVictoryReward;
    this.onBossVictory = options.onBossVictory;

    this.scene.add.rectangle(centerX, centerY, 720, 530, 0x211d28, 1)
      .setStrokeStyle(5, 0x55365e);
    this.scene.add.text(centerX - 325, centerY - 250, 'LIVE COMBAT + BOSS LAB', {
      fontSize: '25px', color: '#ff91e6', fontStyle: 'bold',
    });
    this.scene.add.text(centerX - 325, centerY - 216, 'Build + run perks are snapshotted when the fight starts.', {
      fontSize: '14px', color: '#aaa5b2',
    });

    this.enemyBody = this.scene.add.rectangle(centerX + 85, centerY - 42, 250, 190, 0x6f8f50, 1)
      .setStrokeStyle(8, 0x2a2732);
    this.scene.add.rectangle(centerX + 85, centerY - 42, 188, 110, 0x9aca68, 1)
      .setStrokeStyle(7, 0x34313c);
    this.scene.add.circle(centerX + 45, centerY - 58, 18, 0xffe26d);
    this.scene.add.circle(centerX + 125, centerY - 54, 22, 0xffc65c);
    this.scene.add.circle(centerX + 48, centerY - 58, 6, 0x1a1922);
    this.scene.add.circle(centerX + 121, centerY - 54, 8, 0x1a1922);
    this.scene.add.text(centerX + 85, centerY - 15, '▂▂▂', { fontSize: '30px', color: '#302038' }).setOrigin(0.5);
    this.enemyNameText = this.scene.add.text(centerX + 85, centerY + 80, SCRAP_DUMMY.name.toUpperCase(), {
      fontSize: '15px', color: '#f5f0e7', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.barGraphics = this.scene.add.graphics();
    this.playerText = this.scene.add.text(centerX - 325, centerY - 158, '', {
      fontSize: '17px', color: '#f7f2e8', fontStyle: 'bold',
    });
    this.enemyText = this.scene.add.text(centerX - 325, centerY - 124, '', {
      fontSize: '17px', color: '#f7f2e8', fontStyle: 'bold',
    });
    this.poisonText = this.scene.add.text(centerX - 325, centerY - 90, '', {
      fontSize: '14px', color: '#b8ff77',
    });
    this.nextActionText = this.scene.add.text(centerX - 325, centerY + 88, '', {
      fontSize: '13px', color: '#ffcf69', fontStyle: 'bold',
    });
    this.bossStatusText = this.scene.add.text(centerX - 325, centerY + 110, '', {
      fontSize: '13px', color: '#f08cff', fontStyle: 'bold', wordWrap: { width: 610 },
    });
    this.statusText = this.scene.add.text(centerX - 325, centerY + 134, 'Ready. Rearrange the backpack, then choose a fight.', {
      fontSize: '14px', color: '#d8d1df', wordWrap: { width: 610 },
    });
    this.eventLogText = this.scene.add.text(centerX - 325, centerY + 166, '', {
      fontSize: '11px', color: '#aaa5b2', lineSpacing: 3, wordWrap: { width: 610 },
    });

    this.dummyButton = this.scene.add.rectangle(centerX + 98, centerY + 222, 160, 42, 0x354157, 1)
      .setStrokeStyle(2, 0x68a8ff).setInteractive({ useHandCursor: true });
    this.dummyLabel = this.scene.add.text(centerX + 98, centerY + 222, 'FIGHT DUMMY', {
      fontSize: '13px', color: '#d7e8ff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.bossButton = this.scene.add.rectangle(centerX + 270, centerY + 222, 160, 42, 0x533152, 1)
      .setStrokeStyle(2, 0xf06cff).setInteractive({ useHandCursor: true });
    this.bossLabel = this.scene.add.text(centerX + 270, centerY + 222, 'TV TYRANT', {
      fontSize: '13px', color: '#ffd7fb', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.wireFightButton(this.dummyButton, this.dummyLabel, SCRAP_DUMMY, 0x354157, 0x465a78);
    this.wireFightButton(this.bossButton, this.bossLabel, TV_TYRANT, 0x533152, 0x713f70);
    this.scene.events.on('update', this.updateCombat, this);
    this.scene.events.once('shutdown', () => this.scene.events.off('update', this.updateCombat, this));
    this.renderState();
  }

  private wireFightButton(
    button: Phaser.GameObjects.Rectangle,
    label: Phaser.GameObjects.Text,
    enemy: EnemyCombatDefinition,
    idleColor: number,
    hoverColor: number,
  ): void {
    button.on('pointerover', () => button.setFillStyle(hoverColor));
    button.on('pointerout', () => button.setFillStyle(idleColor));
    button.on('pointerdown', () => { button.setScale(0.97); label.setScale(0.97); });
    button.on('pointerup', () => { button.setScale(1); label.setScale(1); this.startFight(enemy); });
  }

  private startFight(enemy: EnemyCombatDefinition): void {
    const inventory: InventoryState = {
      width: 6,
      height: 5,
      blockedCells: [],
      items: this.getBackpackItems(),
    };
    const selectedPerks = this.getSelectedPerkIds();
    const build = createCombatBuild(
      inventory,
      PROTOTYPE_ITEM_MAP,
      PROTOTYPE_COMBAT_PROFILE_MAP,
      PROTOTYPE_PERK_MAP,
      selectedPerks,
    );
    if (build.items.size === 0) {
      this.setStatus('No combat-capable junk in the backpack.', '#ff9aab');
      return;
    }

    this.setup = { playerMaxHp: 100, items: build.items, enemy };
    this.state = createCombatState(this.setup);
    this.running = true;
    this.eventLog.length = 0;
    this.eventLogText.setText('');
    this.bossStatusText.setText(enemy.interference ? 'CHANNEL JAM armed. Watch the telegraph.' : '');
    this.enemyNameText.setText(enemy.name.toUpperCase());
    this.enemyBody.setFillStyle(enemy.id === TV_TYRANT.id ? 0x697f45 : 0x6f8f50);
    this.enemyBody.setStrokeStyle(8, enemy.id === TV_TYRANT.id ? 0x9b4aa7 : 0x2a2732);
    this.setStatus(
      `${enemy.name} • ${build.items.size} items • ${build.synergies.connections.length} links • ${selectedPerks.length} perks.`,
      '#b8ff8e',
    );
    this.renderState();
    this.punchEnemy(1.03);
  }

  private updateCombat(_time: number, deltaMs: number): void {
    if (!this.running || !this.setup || !this.state) return;
    const result = advanceCombat(this.state, this.setup, deltaMs);
    this.state = result.state;
    for (const event of result.events) this.consumeEvent(event);
    this.renderState();
    if (this.state.outcome !== 'active') this.running = false;
  }

  private consumeEvent(event: CombatPresentationEvent): void {
    if (event.kind === 'item-triggered') { this.pushLog(`${this.seconds(event.atMs)} • ${event.itemInstanceId} triggered`); return; }
    if (event.kind === 'item-jammed') {
      this.pushLog(`${this.seconds(event.atMs)} • ${event.itemInstanceId} JAMMED — trigger lost`);
      this.bossStatusText.setText(`SIGNAL JAM blocked ${event.itemInstanceId}.`);
      return;
    }
    if (event.kind === 'enemy-damaged') {
      this.pushLog(`${this.seconds(event.atMs)} • ${event.source === 'poison' ? 'POISON' : event.itemInstanceId} dealt ${event.amount}`);
      this.punchEnemy(0.96);
      return;
    }
    if (event.kind === 'poison-applied') { this.pushLog(`${this.seconds(event.atMs)} • +${event.amount} poison`); return; }
    if (event.kind === 'shield-gained') { this.pushLog(`${this.seconds(event.atMs)} • +${event.amount} shield`); return; }
    if (event.kind === 'player-damaged') {
      const shieldText = event.absorbedByShield > 0 ? ` (${event.absorbedByShield} blocked)` : '';
      this.pushLog(`${this.seconds(event.atMs)} • enemy hit ${event.amount}${shieldText}`);
      if (!this.reducedMotion) this.scene.tweens.add({ targets: [this.playerText, this.barGraphics], alpha: 0.45, yoyo: true, duration: 85 });
      return;
    }
    if (event.kind === 'boss-telegraph') {
      const remaining = Math.max(0, event.impactAtMs - event.atMs);
      this.bossStatusText.setText(`TV SIGNAL LOCK → ${event.itemInstanceId} • JAM IN ${(remaining / 1000).toFixed(1)}s`);
      this.pushLog(`${this.seconds(event.atMs)} • TV Tyrant targets ${event.itemInstanceId}`);
      if (!this.reducedMotion) this.scene.tweens.add({
        targets: this.enemyBody, alpha: 0.55, yoyo: true, repeat: 3, duration: 90,
        onComplete: () => this.enemyBody.setAlpha(1),
      });
      return;
    }
    if (event.kind === 'boss-jammed') {
      this.bossStatusText.setText(`CHANNEL JAM → ${event.itemInstanceId} disabled for ${(event.durationMs / 1000).toFixed(1)}s`);
      this.pushLog(`${this.seconds(event.atMs)} • JAMMED ${event.itemInstanceId}`);
      return;
    }

    const won = event.outcome === 'victory';
    this.pushLog(`${this.seconds(event.atMs)} • ${won ? 'VICTORY' : 'DEFEAT'}`);
    let rewardSuffix = '';
    if (won && this.setup && this.onVictoryReward) {
      const rewardCoins = this.rewardCoinsFor(this.setup.enemy);
      const granted = this.onVictoryReward({ enemyId: this.setup.enemy.id, coins: rewardCoins });
      rewardSuffix = granted ? `  +${rewardCoins} SCRAP COINS.` : '  Encounter reward already claimed this run.';
    }
    this.setStatus(
      won ? `VICTORY — the build cleared the fight.${rewardSuffix}` : 'DEFEAT — rearrange or buy better junk and retry.',
      won ? '#c8ff83' : '#ff8a9b',
    );
    this.bossStatusText.setText('');
    if (won && this.setup?.enemy.id === TV_TYRANT.id) this.onBossVictory?.(this.setup.enemy.id);
    if (!this.reducedMotion) this.scene.tweens.add({
      targets: this.enemyBody,
      angle: won ? 5 : -3,
      scaleX: won ? 0.92 : 1.04,
      scaleY: won ? 0.92 : 1.04,
      yoyo: true,
      duration: 180,
      repeat: 1,
      onComplete: () => this.enemyBody.setAngle(0).setScale(1),
    });
  }

  private renderState(): void {
    const state = this.state;
    const enemy = this.setup?.enemy ?? SCRAP_DUMMY;
    const playerHp = state?.playerHp ?? 100;
    const shield = state?.playerShield ?? 0;
    const enemyHp = state?.enemyHp ?? enemy.maxHp;
    const poison = state?.enemyPoison ?? 0;
    this.playerText.setText(`YOU  ♥ ${playerHp} / 100    ◈ ${shield}`);
    this.enemyText.setText(`${enemy.name}  ${enemyHp} / ${enemy.maxHp}`);
    this.poisonText.setText(`☣ POISON STACKS  ${poison}`);

    const playerRatio = Math.max(0, Math.min(1, playerHp / 100));
    const enemyRatio = Math.max(0, Math.min(1, enemyHp / enemy.maxHp));
    const left = this.centerX - 325;
    this.barGraphics.clear();
    this.barGraphics.fillStyle(0x35242b, 1); this.barGraphics.fillRoundedRect(left, this.centerY - 184, 280, 14, 6);
    this.barGraphics.fillStyle(0xff5b72, 1); this.barGraphics.fillRoundedRect(left, this.centerY - 184, 280 * playerRatio, 14, 6);
    this.barGraphics.fillStyle(0x35242b, 1); this.barGraphics.fillRoundedRect(left, this.centerY - 150, 280, 14, 6);
    this.barGraphics.fillStyle(enemy.id === TV_TYRANT.id ? 0xf06cff : 0xb96cff, 1);
    this.barGraphics.fillRoundedRect(left, this.centerY - 150, 280 * enemyRatio, 14, 6);

    if (!state || state.outcome !== 'active') { this.nextActionText.setText(''); return; }
    const nextAttack = state.queue.find((effect) => effect.kind === 'enemy-attack');
    const nextJam = state.queue.find((effect) => effect.kind === 'boss-interference');
    const parts: string[] = [];
    if (nextAttack) parts.push(`NEXT HIT ${(Math.max(0, nextAttack.dueAtMs - state.timeMs) / 1000).toFixed(1)}s`);
    if (nextJam) parts.push(`NEXT JAM ${(Math.max(0, nextJam.dueAtMs - state.timeMs) / 1000).toFixed(1)}s`);
    this.nextActionText.setText(parts.join('   •   '));
  }

  private rewardCoinsFor(enemy: EnemyCombatDefinition): number { return enemy.id === TV_TYRANT.id ? 25 : 10; }

  private punchEnemy(targetScale: number): void {
    if (this.reducedMotion) return;
    this.scene.tweens.add({
      targets: this.enemyBody, scaleX: targetScale, scaleY: targetScale, yoyo: true, duration: 85, ease: 'Sine.Out',
      onComplete: () => this.enemyBody.setScale(1),
    });
  }

  private pushLog(message: string): void {
    this.eventLog.unshift(message);
    if (this.eventLog.length > 5) this.eventLog.length = 5;
    this.eventLogText.setText(this.eventLog.join('\n'));
  }

  private seconds(timeMs: number): string { return `${(timeMs / 1000).toFixed(1)}s`; }
  private setStatus(message: string, color: string): void { this.statusText.setText(message).setColor(color); }
}
