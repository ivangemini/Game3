import * as Phaser from 'phaser';
import { PROTOTYPE_COMBAT_PROFILE_MAP, SCRAP_DUMMY } from '../data/combatProfiles';
import { PROTOTYPE_ITEM_MAP } from '../data/items';
import {
  advanceCombat,
  createCombatState,
  type CombatPresentationEvent,
  type CombatSetup,
  type CombatState,
} from '../domain/combat';
import { createCombatBuild } from '../domain/combatBuild';
import type { InventoryState } from '../domain/inventory';
import type { PlacedItem } from '../domain/types';

export interface CombatPanelOptions {
  readonly getBackpackItems: () => readonly PlacedItem[];
  readonly reducedMotion?: boolean;
}

export class CombatPanel {
  private readonly reducedMotion: boolean;
  private readonly getBackpackItems: () => readonly PlacedItem[];
  private readonly barGraphics: Phaser.GameObjects.Graphics;
  private readonly enemyBody: Phaser.GameObjects.Rectangle;
  private readonly playerText: Phaser.GameObjects.Text;
  private readonly enemyText: Phaser.GameObjects.Text;
  private readonly poisonText: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly eventLogText: Phaser.GameObjects.Text;
  private readonly startButton: Phaser.GameObjects.Rectangle;
  private readonly startLabel: Phaser.GameObjects.Text;
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

    this.scene.add.rectangle(centerX, centerY, 720, 530, 0x211d28, 1)
      .setStrokeStyle(5, 0x55365e);
    this.scene.add.text(centerX - 325, centerY - 250, 'LIVE COMBAT TEST', {
      fontSize: '25px',
      color: '#ff91e6',
      fontStyle: 'bold',
    });
    this.scene.add.text(centerX - 325, centerY - 216, 'Build is snapshotted when the fight starts.', {
      fontSize: '14px',
      color: '#aaa5b2',
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
    this.scene.add.text(centerX + 85, centerY + 80, SCRAP_DUMMY.name.toUpperCase(), {
      fontSize: '15px',
      color: '#f5f0e7',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.barGraphics = this.scene.add.graphics();
    this.playerText = this.scene.add.text(centerX - 325, centerY - 158, '', {
      fontSize: '17px',
      color: '#f7f2e8',
      fontStyle: 'bold',
    });
    this.enemyText = this.scene.add.text(centerX - 325, centerY - 124, '', {
      fontSize: '17px',
      color: '#f7f2e8',
      fontStyle: 'bold',
    });
    this.poisonText = this.scene.add.text(centerX - 325, centerY - 90, '', {
      fontSize: '14px',
      color: '#b8ff77',
    });
    this.statusText = this.scene.add.text(centerX - 325, centerY + 122, 'Ready. Rearrange the backpack, then start.', {
      fontSize: '15px',
      color: '#d8d1df',
      wordWrap: { width: 610 },
    });
    this.eventLogText = this.scene.add.text(centerX - 325, centerY + 158, '', {
      fontSize: '12px',
      color: '#aaa5b2',
      lineSpacing: 4,
      wordWrap: { width: 610 },
    });

    this.startButton = this.scene.add.rectangle(centerX + 220, centerY + 205, 210, 48, 0x47355c, 1)
      .setStrokeStyle(3, 0xc36cff)
      .setInteractive({ useHandCursor: true });
    this.startLabel = this.scene.add.text(centerX + 220, centerY + 205, 'START TEST FIGHT', {
      fontSize: '15px',
      color: '#f0dcff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.startButton.on('pointerover', () => this.startButton.setFillStyle(0x5a4373));
    this.startButton.on('pointerout', () => this.startButton.setFillStyle(0x47355c));
    this.startButton.on('pointerdown', () => {
      this.startButton.setScale(0.97);
      this.startLabel.setScale(0.97);
    });
    this.startButton.on('pointerup', () => {
      this.startButton.setScale(1);
      this.startLabel.setScale(1);
      this.startFight();
    });

    this.scene.events.on('update', this.updateCombat, this);
    this.scene.events.once('shutdown', () => {
      this.scene.events.off('update', this.updateCombat, this);
    });
    this.renderState();
  }

  private startFight(): void {
    const backpackItems = this.getBackpackItems();
    const inventory: InventoryState = {
      width: 6,
      height: 5,
      blockedCells: [],
      items: backpackItems,
    };
    const build = createCombatBuild(inventory, PROTOTYPE_ITEM_MAP, PROTOTYPE_COMBAT_PROFILE_MAP);
    if (build.items.size === 0) {
      this.setStatus('No combat-capable junk in the backpack.', '#ff9aab');
      return;
    }

    this.setup = {
      playerMaxHp: 100,
      items: build.items,
      enemy: SCRAP_DUMMY,
    };
    this.state = createCombatState(this.setup);
    this.running = true;
    this.eventLog.length = 0;
    this.startLabel.setText('RESTART FIGHT');
    this.setStatus(
      `Fight started with ${build.items.size} active items and ${build.synergies.connections.length} synergy links.`,
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

    if (this.state.outcome !== 'active') {
      this.running = false;
      this.startLabel.setText('FIGHT AGAIN');
    }
  }

  private consumeEvent(event: CombatPresentationEvent): void {
    if (event.kind === 'item-triggered') {
      this.pushLog(`${this.seconds(event.atMs)} • ${event.itemInstanceId} triggered`);
      return;
    }
    if (event.kind === 'enemy-damaged') {
      const prefix = event.source === 'poison' ? 'POISON' : event.itemInstanceId;
      this.pushLog(`${this.seconds(event.atMs)} • ${prefix} dealt ${event.amount}`);
      this.punchEnemy(0.96);
      return;
    }
    if (event.kind === 'poison-applied') {
      this.pushLog(`${this.seconds(event.atMs)} • +${event.amount} poison`);
      return;
    }
    if (event.kind === 'shield-gained') {
      this.pushLog(`${this.seconds(event.atMs)} • +${event.amount} shield`);
      return;
    }
    if (event.kind === 'player-damaged') {
      const shieldText = event.absorbedByShield > 0 ? ` (${event.absorbedByShield} blocked)` : '';
      this.pushLog(`${this.seconds(event.atMs)} • enemy hit ${event.amount}${shieldText}`);
      if (!this.reducedMotion) {
        this.scene.tweens.add({
          targets: [this.playerText, this.barGraphics],
          alpha: 0.45,
          yoyo: true,
          duration: 85,
        });
      }
      return;
    }

    const won = event.outcome === 'victory';
    this.pushLog(`${this.seconds(event.atMs)} • ${won ? 'VICTORY' : 'DEFEAT'}`);
    this.setStatus(
      won ? 'VICTORY — the build cleared the test enemy.' : 'DEFEAT — rearrange or buy better junk and retry.',
      won ? '#c8ff83' : '#ff8a9b',
    );
    if (!this.reducedMotion) {
      this.scene.tweens.add({
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
  }

  private renderState(): void {
    const state = this.state;
    const playerHp = state?.playerHp ?? 100;
    const shield = state?.playerShield ?? 0;
    const enemyHp = state?.enemyHp ?? SCRAP_DUMMY.maxHp;
    const poison = state?.enemyPoison ?? 0;

    this.playerText.setText(`YOU  ♥ ${playerHp} / 100    ◈ ${shield}`);
    this.enemyText.setText(`${SCRAP_DUMMY.name}  ${enemyHp} / ${SCRAP_DUMMY.maxHp}`);
    this.poisonText.setText(poison > 0 ? `☣ POISON STACKS  ${poison}` : '☣ POISON STACKS  0');

    const playerRatio = Math.max(0, Math.min(1, playerHp / 100));
    const enemyRatio = Math.max(0, Math.min(1, enemyHp / SCRAP_DUMMY.maxHp));
    const left = this.centerX - 325;

    this.barGraphics.clear();
    this.barGraphics.fillStyle(0x35242b, 1);
    this.barGraphics.fillRoundedRect(left, this.centerY - 184, 280, 14, 6);
    this.barGraphics.fillStyle(0xff5b72, 1);
    this.barGraphics.fillRoundedRect(left, this.centerY - 184, 280 * playerRatio, 14, 6);
    this.barGraphics.fillStyle(0x35242b, 1);
    this.barGraphics.fillRoundedRect(left, this.centerY - 150, 280, 14, 6);
    this.barGraphics.fillStyle(0xb96cff, 1);
    this.barGraphics.fillRoundedRect(left, this.centerY - 150, 280 * enemyRatio, 14, 6);
  }

  private punchEnemy(targetScale: number): void {
    if (this.reducedMotion) return;
    this.scene.tweens.add({
      targets: this.enemyBody,
      scaleX: targetScale,
      scaleY: targetScale,
      yoyo: true,
      duration: 85,
      ease: 'Sine.Out',
      onComplete: () => this.enemyBody.setScale(1),
    });
  }

  private pushLog(message: string): void {
    this.eventLog.unshift(message);
    if (this.eventLog.length > 5) this.eventLog.length = 5;
    this.eventLogText.setText(this.eventLog.join('\n'));
  }

  private seconds(timeMs: number): string {
    return `${(timeMs / 1000).toFixed(1)}s`;
  }

  private setStatus(message: string, color: string): void {
    this.statusText.setText(message).setColor(color);
  }
}
