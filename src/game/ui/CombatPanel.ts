import * as Phaser from 'phaser';
import {
  audioCueForClutterCrushEvent,
  audioCueForCombatEvent,
  audioCueForDuplicateDebtEvent,
  audioCueForEdgeRentEvent,
  audioCueForTimeTaxEvent,
  combatStartAudioCue,
  type AudioCue,
} from '../audio/audioCues';
import { PROTOTYPE_COMBAT_PROFILE_MAP, SCRAP_DUMMY, TV_TYRANT } from '../data/combatProfiles';
import { PROTOTYPE_ITEM_MAP } from '../data/items';
import { PROTOTYPE_PERK_MAP } from '../data/perks';
import {
  advanceCombatWithBossRules,
  clutterCrushDefinitionForEnemyId,
  duplicateDebtDefinitionForEnemyId,
  edgeRentDefinitionForEnemyId,
  isBossRuleEnemy,
  isClutterCrushPresentationEvent,
  isDuplicateDebtPresentationEvent,
  isEdgeRentPresentationEvent,
  isTimeTaxPresentationEvent,
  timeTaxDefinitionForEnemyId,
  type BossCombatPresentationEvent,
} from '../domain/bossCombat';
import {
  createCombatState,
  type CombatOutcome,
  type CombatSetup,
  type CombatState,
  type EnemyCombatDefinition,
} from '../domain/combat';
import { createCombatBuild } from '../domain/combatBuild';
import type { HeroDefinition } from '../domain/heroes';
import type { InventoryState } from '../domain/inventory';
import {
  applyLateWorldPressure,
  evaluateLateWorldPressure,
  type LateWorldPressureResult,
} from '../domain/lateWorldPressure';
import type { Cell, ItemTag, PlacedItem } from '../domain/types';
import { resolveAuthoredTexture, uiArtKey } from './authoredArt';

export interface CombatVictoryReward {
  readonly encounterId: string;
  readonly enemyId: string;
  readonly coins: number;
}

export interface CombatOutcomeNotice {
  readonly encounterId: string;
  readonly enemyId: string;
  readonly outcome: Exclude<CombatOutcome, 'active'>;
}

export interface CombatPanelOptions {
  readonly getBackpackItems: () => readonly PlacedItem[];
  readonly getSelectedPerkIds?: () => readonly string[];
  readonly getHeroDefinition?: () => HeroDefinition | undefined;
  readonly reducedMotion?: boolean;
  readonly onVictoryReward?: (reward: CombatVictoryReward) => boolean;
  readonly onBossVictory?: (encounterId: string, enemyId: string) => void;
  readonly onOutcome?: (notice: CombatOutcomeNotice) => void;
  readonly onAudioCue?: (cue: AudioCue) => void;
  readonly backpackGrid?: { readonly left: number; readonly top: number; readonly cellSize: number };
  readonly showDebugButtons?: boolean;
}

export class CombatPanel {
  private readonly reducedMotion: boolean;
  private readonly getBackpackItems: () => readonly PlacedItem[];
  private readonly getSelectedPerkIds: () => readonly string[];
  private readonly getHeroDefinition: () => HeroDefinition | undefined;
  private readonly onVictoryReward?: (reward: CombatVictoryReward) => boolean;
  private readonly onBossVictory?: (encounterId: string, enemyId: string) => void;
  private readonly onOutcome?: (notice: CombatOutcomeNotice) => void;
  private readonly onAudioCue?: (cue: AudioCue) => void;
  private readonly backpackGrid: { readonly left: number; readonly top: number; readonly cellSize: number };
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
  private readonly eventLog: string[] = [];
  private readonly backpackLockObjects: Phaser.GameObjects.GameObject[] = [];
  private setup: CombatSetup | null = null;
  private state: CombatState | null = null;
  private running = false;
  private currentEncounterId = 'debug:none';
  private currentRewardCoins = 0;
  private lateWorldPressure: LateWorldPressureResult | null = null;
  private lateWorldHazardIcon: Phaser.GameObjects.Image | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly centerX: number,
    private readonly centerY: number,
    options: CombatPanelOptions,
  ) {
    this.reducedMotion = options.reducedMotion ?? false;
    this.getBackpackItems = options.getBackpackItems;
    this.getSelectedPerkIds = options.getSelectedPerkIds ?? (() => []);
    this.getHeroDefinition = options.getHeroDefinition ?? (() => undefined);
    this.onVictoryReward = options.onVictoryReward;
    this.onBossVictory = options.onBossVictory;
    this.onOutcome = options.onOutcome;
    this.onAudioCue = options.onAudioCue;
    this.backpackGrid = options.backpackGrid ?? { left: 90, top: 225, cellSize: 76 };

    scene.add.rectangle(centerX, centerY, 720, 530, 0x211d28, 1).setStrokeStyle(5, 0x55365e);
    scene.add.text(centerX - 325, centerY - 250, 'LIVE COMBAT', {
      fontSize: '25px', color: '#ff91e6', fontStyle: 'bold',
    });
    scene.add.text(centerX - 325, centerY - 216, 'Build + hero + perks snapshot at fight start. Bosses attack backpack rules.', {
      fontSize: '13px', color: '#aaa5b2',
    });

    this.enemyBody = scene.add.rectangle(centerX + 85, centerY - 42, 250, 190, 0x6f8f50, 1).setStrokeStyle(8, 0x2a2732);
    scene.add.rectangle(centerX + 85, centerY - 42, 188, 110, 0x9aca68, 1).setStrokeStyle(7, 0x34313c);
    scene.add.circle(centerX + 45, centerY - 58, 18, 0xffe26d);
    scene.add.circle(centerX + 125, centerY - 54, 22, 0xffc65c);
    scene.add.circle(centerX + 48, centerY - 58, 6, 0x1a1922);
    scene.add.circle(centerX + 121, centerY - 54, 8, 0x1a1922);
    scene.add.text(centerX + 85, centerY - 15, '▂▂▂', { fontSize: '30px', color: '#302038' }).setOrigin(0.5);
    this.enemyNameText = scene.add.text(centerX + 85, centerY + 80, 'WAITING FOR ENCOUNTER', {
      fontSize: '15px', color: '#f5f0e7', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.barGraphics = scene.add.graphics();
    this.playerText = scene.add.text(centerX - 325, centerY - 158, '', { fontSize: '17px', color: '#f7f2e8', fontStyle: 'bold' });
    this.enemyText = scene.add.text(centerX - 325, centerY - 124, '', { fontSize: '17px', color: '#f7f2e8', fontStyle: 'bold' });
    this.poisonText = scene.add.text(centerX - 325, centerY - 90, '', { fontSize: '14px', color: '#b8ff77' });
    this.nextActionText = scene.add.text(centerX - 325, centerY + 88, '', { fontSize: '12px', color: '#ffcf69', fontStyle: 'bold' });
    this.bossStatusText = scene.add.text(centerX - 325, centerY + 110, '', {
      fontSize: '12px', color: '#f08cff', fontStyle: 'bold', wordWrap: { width: 610 },
    });
    this.statusText = scene.add.text(centerX - 325, centerY + 134, 'Ready. Use the RUN panel to start the next encounter.', {
      fontSize: '13px', color: '#d8d1df', wordWrap: { width: 610 },
    });
    this.eventLogText = scene.add.text(centerX - 325, centerY + 166, '', {
      fontSize: '10px', color: '#aaa5b2', lineSpacing: 3, wordWrap: { width: 610 },
    });

    if (options.showDebugButtons) {
      this.createFightButton(centerX + 98, centerY + 222, 'DEBUG DUMMY', 'debug:dummy', SCRAP_DUMMY, 0x354157, 0x68a8ff);
      this.createFightButton(centerX + 270, centerY + 222, 'DEBUG BOSS', 'debug:tv', TV_TYRANT, 0x533152, 0xf06cff);
    }

    scene.events.on('update', this.updateCombat, this);
    scene.events.once('shutdown', () => {
      scene.events.off('update', this.updateCombat, this);
      this.setBackpackLocked(false);
      this.setLateWorldHazardVisual(null);
    });
    this.renderState();
  }

  isRunning(): boolean { return this.running; }

  startEncounter(encounterId: string, enemy: EnemyCombatDefinition, rewardCoins: number): boolean {
    if (this.running) return false;
    const inventory: InventoryState = { width: 6, height: 5, blockedCells: [], items: this.getBackpackItems() };
    const selectedPerks = this.getSelectedPerkIds();
    const hero = this.getHeroDefinition();
    const build = createCombatBuild(
      inventory,
      PROTOTYPE_ITEM_MAP,
      PROTOTYPE_COMBAT_PROFILE_MAP,
      PROTOTYPE_PERK_MAP,
      selectedPerks,
      hero,
    );
    if (build.items.size === 0) {
      this.setStatus('No combat-capable junk in the backpack.', '#ff9aab');
      return false;
    }

    this.currentEncounterId = encounterId;
    this.currentRewardCoins = Math.max(0, Math.floor(rewardCoins));
    this.lateWorldPressure = evaluateLateWorldPressure(enemy.id, build.items);
    const runtimeEnemy = applyLateWorldPressure(enemy, this.lateWorldPressure);
    this.setBackpackLocked(true);
    this.setup = { playerMaxHp: 100, items: build.items, enemy: runtimeEnemy };
    this.state = createCombatState(this.setup);
    this.running = true;
    this.eventLog.length = 0;
    this.eventLogText.setText('');
    const boss = this.isBoss(runtimeEnemy);
    this.onAudioCue?.(combatStartAudioCue(runtimeEnemy.id, boss));
    this.setLateWorldHazardVisual(this.lateWorldPressure);
    if (boss) {
      this.bossStatusText.setText(`${this.bossSystems(runtimeEnemy).join(' + ')} armed.`).setColor('#f08cff');
    } else if (this.lateWorldPressure) {
      const pressure = this.lateWorldPressure;
      this.bossStatusText.setText(this.lateWorldPressureStatus(pressure)).setColor(pressure.world === 5 ? '#ffb27a' : '#8ceeff');
      this.showBackpackItems(
        pressure.affectedItemInstanceIds,
        pressure.world === 5 ? 0xff9a62 : 0x67e7ff,
        980,
        true,
      );
      this.pushLog(`0.0s • ${pressure.name.toUpperCase()} reads ${pressure.pressureCount} pressure`);
    } else {
      this.bossStatusText.setText('').setColor('#f08cff');
    }
    this.enemyNameText.setText(runtimeEnemy.name.toUpperCase());
    if (boss) {
      this.enemyBody.setFillStyle(0x697f45).setStrokeStyle(8, 0x9b4aa7);
    } else if (this.lateWorldPressure?.world === 5) {
      this.enemyBody.setFillStyle(0x754739).setStrokeStyle(8, 0xff9a62);
    } else if (this.lateWorldPressure?.world === 6) {
      this.enemyBody.setFillStyle(0x315b62).setStrokeStyle(8, 0x67e7ff);
    } else {
      this.enemyBody.setFillStyle(0x6f8f50).setStrokeStyle(8, 0x2a2732);
    }
    const heroText = hero ? ` • ${hero.name}` : '';
    const pressureText = this.lateWorldPressure && this.lateWorldPressure.pressureCount > 0
      ? ` • ${this.lateWorldPressure.name} active`
      : '';
    this.setStatus(`${runtimeEnemy.name}${heroText} • ${build.items.size} items • ${build.synergies.connections.length} links • ${selectedPerks.length} perks${pressureText}.`, '#b8ff8e');
    this.renderState();
    this.punchEnemy(this.lateWorldPressure ? 1.06 : 1.03);
    return true;
  }

  private createFightButton(x: number, y: number, title: string, encounterId: string, enemy: EnemyCombatDefinition, fill: number, stroke: number): void {
    const button = this.scene.add.rectangle(x, y, 160, 42, fill, 1).setStrokeStyle(2, stroke).setInteractive({ useHandCursor: true });
    const label = this.scene.add.text(x, y, title, { fontSize: '13px', color: '#f5eaff', fontStyle: 'bold' }).setOrigin(0.5);
    button.on('pointerover', () => button.setAlpha(0.82));
    button.on('pointerout', () => button.setAlpha(1));
    button.on('pointerdown', () => { button.setScale(0.97); label.setScale(0.97); });
    button.on('pointerup', () => {
      button.setScale(1); label.setScale(1);
      this.startEncounter(encounterId, enemy, enemy.id === TV_TYRANT.id ? 25 : 10);
    });
  }

  private updateCombat(_time: number, deltaMs: number): void {
    if (!this.running || !this.setup || !this.state) return;
    const result = advanceCombatWithBossRules(this.state, this.setup, deltaMs);
    this.state = result.state;
    for (const event of result.events) this.consumeEvent(event);
    this.renderState();
    if (this.state.outcome !== 'active') {
      this.running = false;
      this.setBackpackLocked(false);
    }
  }

  private consumeEvent(event: BossCombatPresentationEvent): void {
    if (isTimeTaxPresentationEvent(event)) {
      this.onAudioCue?.(audioCueForTimeTaxEvent(event));
      if (event.kind === 'boss-time-tax-telegraph') {
        this.bossStatusText.setText(`TIME TAX → ${event.itemInstanceId} • FASTEST ITEM • IMPACT IN ${((event.impactAtMs - event.atMs) / 1000).toFixed(1)}s`);
        this.showBackpackItem(event.itemInstanceId, 0xffd36d, Math.max(120, event.impactAtMs - event.atMs), true);
        this.pushLog(`${this.seconds(event.atMs)} • snail invoices ${event.itemInstanceId}`);
        return;
      }
      this.bossStatusText.setText(`TIME TAX → ${event.itemInstanceId} next trigger +${(event.delayMs / 1000).toFixed(1)}s`);
      this.showBackpackItem(event.itemInstanceId, 0xff8f5f, Math.min(650, event.delayMs), false);
      this.pushLog(`${this.seconds(event.atMs)} • ${event.itemInstanceId} DELAYED +${(event.delayMs / 1000).toFixed(1)}s`);
      return;
    }

    if (isClutterCrushPresentationEvent(event)) {
      this.onAudioCue?.(audioCueForClutterCrushEvent(event));
      if (event.kind === 'boss-clutter-telegraph') {
        const label = event.affectedItemCount > 0 ? `${event.affectedItemCount} LOOSE ITEMS` : 'ALL JUNK ANCHORED';
        this.bossStatusText.setText(`CLUTTER CRUSH → ${label} • IMPACT IN ${((event.impactAtMs - event.atMs) / 1000).toFixed(1)}s`);
        this.showBackpackItems(event.itemInstanceIds, 0x7de6ff, Math.max(120, event.impactAtMs - event.atMs), true);
        this.pushLog(`${this.seconds(event.atMs)} • closet scans ${event.affectedItemCount} loose items`);
        return;
      }
      this.bossStatusText.setText(`CLUTTER CRUSH → ${event.totalDamage} pressure • ${event.absorbedByShield} shielded`);
      this.showBackpackItems(event.itemInstanceIds, 0x42b8ff, 520, false);
      this.pushLog(`${this.seconds(event.atMs)} • loose-junk crush ${event.healthDamage} HP`);
      if (!this.reducedMotion && event.healthDamage > 0) {
        this.scene.tweens.add({ targets: [this.playerText, this.barGraphics], alpha: 0.45, yoyo: true, duration: 95 });
      }
      return;
    }

    if (isDuplicateDebtPresentationEvent(event)) {
      this.onAudioCue?.(audioCueForDuplicateDebtEvent(event));
      if (event.kind === 'boss-duplicate-telegraph') {
        const label = event.definitionId
          ? `${event.definitionId.toUpperCase()} ×${event.copyCount} • ${event.extraCopyCount} EXTRA`
          : 'NO DUPLICATES';
        const phaseLabel = event.phase === 2 ? 'FINAL AUDIT' : 'DUPLICATE DEBT';
        const rate = event.damagePerExtraCopy ?? 4;
        this.bossStatusText.setText(`${phaseLabel} → ${label} • ${rate}/EXTRA • IMPACT IN ${((event.impactAtMs - event.atMs) / 1000).toFixed(1)}s`);
        this.showBackpackItems(event.itemInstanceIds, event.phase === 2 ? 0xff785b : 0xffb86b, Math.max(120, event.impactAtMs - event.atMs), true);
        this.pushLog(`${this.seconds(event.atMs)} • ${event.phase === 2 ? 'FINAL AUDIT' : 'auditor'} finds ${event.extraCopyCount} duplicate debt`);
        return;
      }
      this.bossStatusText.setText(`${event.phase === 2 ? 'FINAL AUDIT' : 'DUPLICATE DEBT'} → ${event.totalDamage} fine • ${event.absorbedByShield} shielded`);
      this.showBackpackItems(event.itemInstanceIds, 0xff7a59, 520, false);
      this.pushLog(`${this.seconds(event.atMs)} • duplicate fine ${event.healthDamage} HP`);
      if (!this.reducedMotion && event.healthDamage > 0) {
        this.scene.tweens.add({ targets: [this.playerText, this.barGraphics], alpha: 0.45, yoyo: true, duration: 95 });
      }
      return;
    }

    if (isEdgeRentPresentationEvent(event)) {
      this.onAudioCue?.(audioCueForEdgeRentEvent(event));
      if (event.kind === 'boss-edge-telegraph') {
        const label = event.affectedItemCount > 0 ? `${event.affectedItemCount} BORDER ITEMS` : 'CENTERED BUILD';
        const phaseLabel = event.phase === 2 ? 'BORDER LOCKDOWN' : 'EDGE RENT';
        const rate = event.damagePerEdgeItem ?? 2;
        this.bossStatusText.setText(`${phaseLabel} → ${label} • ${rate}/EDGE • IMPACT IN ${((event.impactAtMs - event.atMs) / 1000).toFixed(1)}s`);
        this.showBackpackItems(event.itemInstanceIds, event.phase === 2 ? 0x2fc8ff : 0x6be7ff, Math.max(120, event.impactAtMs - event.atMs), true);
        this.pushLog(`${this.seconds(event.atMs)} • ${event.phase === 2 ? 'BORDER LOCKDOWN' : 'shark'} rents ${event.affectedItemCount} edge items`);
        return;
      }
      this.bossStatusText.setText(`${event.phase === 2 ? 'BORDER LOCKDOWN' : 'EDGE RENT'} → ${event.totalDamage} rent • ${event.absorbedByShield} shielded`);
      this.showBackpackItems(event.itemInstanceIds, 0x36b8ff, 540, false);
      this.pushLog(`${this.seconds(event.atMs)} • border rent ${event.healthDamage} HP`);
      if (!this.reducedMotion && event.healthDamage > 0) {
        this.scene.tweens.add({ targets: [this.playerText, this.barGraphics], alpha: 0.45, yoyo: true, duration: 95 });
      }
      return;
    }

    this.onAudioCue?.(audioCueForCombatEvent(event));
    if (event.kind === 'item-triggered') { this.pushLog(`${this.seconds(event.atMs)} • ${event.itemInstanceId} triggered`); return; }
    if (event.kind === 'item-jammed') { this.pushLog(`${this.seconds(event.atMs)} • ${event.itemInstanceId} JAMMED — trigger lost`); return; }
    if (event.kind === 'item-slimed') { this.pushLog(`${this.seconds(event.atMs)} • ${event.itemInstanceId} blocked by SLIME [${event.cell.x},${event.cell.y}]`); return; }
    if (event.kind === 'item-scrambled') { this.pushLog(`${this.seconds(event.atMs)} • ${event.itemInstanceId} MAGNET-SCRAMBLED on row ${event.row + 1}`); return; }
    if (event.kind === 'item-eclipsed') { this.pushLog(`${this.seconds(event.atMs)} • ${event.itemInstanceId} ECLIPSED [${event.tag.toUpperCase()}]`); return; }
    if (event.kind === 'enemy-damaged') { this.pushLog(`${this.seconds(event.atMs)} • ${event.source === 'poison' ? 'POISON' : event.itemInstanceId} dealt ${event.amount}`); this.punchEnemy(0.96); return; }
    if (event.kind === 'poison-applied') { this.pushLog(`${this.seconds(event.atMs)} • +${event.amount} poison`); return; }
    if (event.kind === 'shield-gained') { this.pushLog(`${this.seconds(event.atMs)} • +${event.amount} shield`); return; }
    if (event.kind === 'player-damaged') {
      const blocked = event.absorbedByShield > 0 ? ` (${event.absorbedByShield} blocked)` : '';
      this.pushLog(`${this.seconds(event.atMs)} • enemy hit ${event.amount}${blocked}`);
      if (!this.reducedMotion) this.scene.tweens.add({ targets: [this.playerText, this.barGraphics], alpha: 0.45, yoyo: true, duration: 85 });
      return;
    }
    if (event.kind === 'boss-telegraph') {
      this.bossStatusText.setText(`TV SIGNAL LOCK → ${event.itemInstanceId} • JAM IN ${((event.impactAtMs - event.atMs) / 1000).toFixed(1)}s`);
      this.pushLog(`${this.seconds(event.atMs)} • TV targets ${event.itemInstanceId}`); return;
    }
    if (event.kind === 'boss-jammed') {
      this.bossStatusText.setText(`CHANNEL JAM → ${event.itemInstanceId} disabled ${(event.durationMs / 1000).toFixed(1)}s`);
      this.pushLog(`${this.seconds(event.atMs)} • JAMMED ${event.itemInstanceId}`); return;
    }
    if (event.kind === 'boss-cell-telegraph') {
      this.bossStatusText.setText(`SLIME SIGNAL → CELL ${event.cell.x + 1}:${event.cell.y + 1} IN ${((event.impactAtMs - event.atMs) / 1000).toFixed(1)}s`);
      this.showBackpackCell(event.cell, 0xffcf69, Math.max(120, event.impactAtMs - event.atMs), true);
      this.pushLog(`${this.seconds(event.atMs)} • slime targets cell ${event.cell.x + 1}:${event.cell.y + 1}`); return;
    }
    if (event.kind === 'boss-cell-slimed') {
      this.bossStatusText.setText(`SLIMED CELL ${event.cell.x + 1}:${event.cell.y + 1} • ${(event.durationMs / 1000).toFixed(1)}s`);
      this.showBackpackCell(event.cell, 0x76ff5b, event.durationMs, false);
      this.pushLog(`${this.seconds(event.atMs)} • cell ${event.cell.x + 1}:${event.cell.y + 1} SLIMED`); return;
    }
    if (event.kind === 'boss-row-telegraph') {
      const targetReason = event.magneticPriority ? 'METAL DETECTED' : 'OCCUPIED ROW';
      this.bossStatusText.setText(`MAGNET SCRAMBLE → ROW ${event.row + 1} • ${targetReason} • IMPACT IN ${((event.impactAtMs - event.atMs) / 1000).toFixed(1)}s`);
      this.showBackpackRow(event.row, 0x58d7ff, Math.max(120, event.impactAtMs - event.atMs), true);
      this.pushLog(`${this.seconds(event.atMs)} • magnet locks row ${event.row + 1}`); return;
    }
    if (event.kind === 'boss-row-scrambled') {
      this.bossStatusText.setText(`MAGNET SCRAMBLE → ROW ${event.row + 1} unstable ${(event.durationMs / 1000).toFixed(1)}s`);
      this.showBackpackRow(event.row, 0x5de7ff, event.durationMs, false);
      this.pushLog(`${this.seconds(event.atMs)} • row ${event.row + 1} SCRAMBLED`); return;
    }
    if (event.kind === 'boss-tag-telegraph') {
      this.bossStatusText.setText(`TAG ECLIPSE → ${event.tag.toUpperCase()} ×${event.affectedItemCount} • IMPACT IN ${((event.impactAtMs - event.atMs) / 1000).toFixed(1)}s`);
      this.showBackpackTag(event.tag, 0xf5d5ff, Math.max(120, event.impactAtMs - event.atMs), true);
      this.pushLog(`${this.seconds(event.atMs)} • moon targets ${event.tag.toUpperCase()} ×${event.affectedItemCount}`); return;
    }
    if (event.kind === 'boss-tag-eclipsed') {
      this.bossStatusText.setText(`TAG ECLIPSE → ${event.tag.toUpperCase()} silenced ${(event.durationMs / 1000).toFixed(1)}s • ${event.affectedItemCount} items`);
      this.showBackpackTag(event.tag, 0xc46cff, event.durationMs, false);
      this.pushLog(`${this.seconds(event.atMs)} • ${event.tag.toUpperCase()} FAMILY ECLIPSED`); return;
    }

    const won = event.outcome === 'victory';
    const encounterId = this.currentEncounterId;
    const enemyId = this.setup?.enemy.id ?? 'unknown';
    this.pushLog(`${this.seconds(event.atMs)} • ${won ? 'VICTORY' : 'DEFEAT'}`);
    let rewardSuffix = '';
    if (won && this.setup && this.onVictoryReward && this.currentRewardCoins > 0) {
      const granted = this.onVictoryReward({ encounterId, enemyId, coins: this.currentRewardCoins });
      rewardSuffix = granted ? ` +${this.currentRewardCoins} COINS.` : ' Reward already claimed.';
    }
    this.setStatus(won ? `VICTORY.${rewardSuffix}` : 'DEFEAT — rearrange or buy better junk and retry.', won ? '#c8ff83' : '#ff8a9b');
    this.bossStatusText.setText('').setColor('#f08cff');
    this.setLateWorldHazardVisual(null);
    this.lateWorldPressure = null;
    if (won && this.setup && this.isBoss(this.setup.enemy)) this.onBossVictory?.(encounterId, enemyId);
    this.onOutcome?.({ encounterId, enemyId, outcome: event.outcome });
  }

  private setBackpackLocked(locked: boolean): void {
    for (const object of this.backpackLockObjects) object.destroy();
    this.backpackLockObjects.length = 0;
    if (!locked) return;
    const { left, top, cellSize } = this.backpackGrid;
    const width = cellSize * 6;
    const height = cellSize * 5;
    const shield = this.scene.add.rectangle(left + width / 2, top + height / 2, width, height, 0x080910, 0.08).setInteractive().setDepth(150);
    const label = this.scene.add.text(left + width / 2, top - 13, 'COMBAT SNAPSHOT LOCKED', {
      fontSize: '12px', color: '#ffcf69', fontStyle: 'bold', stroke: '#11121a', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(151);
    this.backpackLockObjects.push(shield, label);
  }

  private showBackpackCell(cell: Cell, color: number, durationMs: number, telegraph: boolean): void {
    const { left, top, cellSize } = this.backpackGrid;
    const overlay = this.scene.add.rectangle(left + (cell.x + 0.5) * cellSize, top + (cell.y + 0.5) * cellSize, cellSize - 9, cellSize - 9, color, telegraph ? 0.16 : 0.38)
      .setStrokeStyle(telegraph ? 4 : 5, color).setDepth(160);
    if (!this.reducedMotion && telegraph) this.scene.tweens.add({ targets: overlay, alpha: 0.35, yoyo: true, repeat: -1, duration: 160 });
    this.scene.time.delayedCall(durationMs, () => overlay.destroy());
  }

  private showBackpackItem(itemInstanceId: string, color: number, durationMs: number, telegraph: boolean): void {
    const item = this.setup?.items.get(itemInstanceId);
    if (!item) return;
    for (const cell of item.occupiedCells) this.showBackpackCell(cell, color, durationMs, telegraph);
  }

  private showBackpackItems(itemInstanceIds: readonly string[], color: number, durationMs: number, telegraph: boolean): void {
    for (const itemInstanceId of itemInstanceIds) this.showBackpackItem(itemInstanceId, color, durationMs, telegraph);
  }

  private showBackpackRow(row: number, color: number, durationMs: number, telegraph: boolean): void {
    const { left, top, cellSize } = this.backpackGrid;
    const width = cellSize * 6;
    const overlay = this.scene.add.rectangle(left + width / 2, top + (row + 0.5) * cellSize, width - 8, cellSize - 8, color, telegraph ? 0.13 : 0.3)
      .setStrokeStyle(telegraph ? 4 : 5, color).setDepth(159);
    if (!this.reducedMotion && telegraph) this.scene.tweens.add({ targets: overlay, alpha: 0.34, yoyo: true, repeat: -1, duration: 130 });
    if (!this.reducedMotion && !telegraph) this.scene.tweens.add({ targets: overlay, x: { from: overlay.x - 5, to: overlay.x + 5 }, yoyo: true, repeat: 3, duration: 55 });
    this.scene.time.delayedCall(durationMs, () => overlay.destroy());
  }

  private showBackpackTag(tag: ItemTag, color: number, durationMs: number, telegraph: boolean): void {
    const items = this.setup?.items;
    if (!items) return;
    for (const item of items.values()) {
      if (!item.tags.includes(tag)) continue;
      for (const cell of item.occupiedCells) this.showBackpackCell(cell, color, durationMs, telegraph);
    }
  }

  private renderState(): void {
    const state = this.state;
    const enemy = this.setup?.enemy ?? SCRAP_DUMMY;
    const playerHp = state?.playerHp ?? 100;
    const enemyHp = state?.enemyHp ?? enemy.maxHp;
    this.playerText.setText(`YOU ♥ ${playerHp}/100  ◈ ${state?.playerShield ?? 0}`);
    this.enemyText.setText(`${enemy.name} ${enemyHp}/${enemy.maxHp}`);
    this.poisonText.setText(`☣ POISON ${state?.enemyPoison ?? 0}`);
    const left = this.centerX - 325;
    const boss = this.isBoss(enemy);
    this.barGraphics.clear();
    this.drawBar(left, this.centerY - 184, 280, playerHp / 100, 0xff5b72);
    this.drawBar(left, this.centerY - 150, 280, enemyHp / enemy.maxHp, boss ? 0xf06cff : 0xb96cff);
    if (!state || state.outcome !== 'active') { this.nextActionText.setText(''); return; }
    const entries: string[] = [];
    const labels: Array<[string, string]> = [
      ['enemy-attack', 'HIT'], ['boss-interference', 'JAM'], ['boss-cell-interference', 'SLIME'],
      ['boss-row-interference', 'MAGNET'], ['boss-tag-interference', 'ECLIPSE'],
    ];
    for (const [kind, label] of labels) {
      const effect = state.queue.find((candidate) => candidate.kind === kind);
      if (effect) entries.push(`${label} ${((effect.dueAtMs - state.timeMs) / 1000).toFixed(1)}s`);
    }
    const timeTax = timeTaxDefinitionForEnemyId(enemy.id);
    if (timeTax) {
      const nextImpact = (Math.floor(state.timeMs / timeTax.intervalMs) + 1) * timeTax.intervalMs;
      entries.push(`TAX ${Math.max(0, (nextImpact - state.timeMs) / 1000).toFixed(1)}s`);
    }
    const clutter = clutterCrushDefinitionForEnemyId(enemy.id);
    if (clutter) {
      const nextImpact = (Math.floor(state.timeMs / clutter.intervalMs) + 1) * clutter.intervalMs;
      entries.push(`CRUSH ${Math.max(0, (nextImpact - state.timeMs) / 1000).toFixed(1)}s`);
    }
    const duplicateDebt = duplicateDebtDefinitionForEnemyId(enemy.id);
    if (duplicateDebt) {
      const nextImpact = (Math.floor(state.timeMs / duplicateDebt.intervalMs) + 1) * duplicateDebt.intervalMs;
      entries.push(`DEBT ${Math.max(0, (nextImpact - state.timeMs) / 1000).toFixed(1)}s`);
    }
    const edgeRent = edgeRentDefinitionForEnemyId(enemy.id);
    if (edgeRent) {
      const nextImpact = (Math.floor(state.timeMs / edgeRent.intervalMs) + 1) * edgeRent.intervalMs;
      entries.push(`RENT ${Math.max(0, (nextImpact - state.timeMs) / 1000).toFixed(1)}s`);
    }
    this.nextActionText.setText(entries.join(' • '));
  }

  private drawBar(x: number, y: number, width: number, ratio: number, color: number): void {
    this.barGraphics.fillStyle(0x35242b, 1); this.barGraphics.fillRoundedRect(x, y, width, 14, 6);
    this.barGraphics.fillStyle(color, 1); this.barGraphics.fillRoundedRect(x, y, width * Math.max(0, Math.min(1, ratio)), 14, 6);
  }

  private isBoss(enemy: EnemyCombatDefinition): boolean {
    return !!enemy.interference || !!enemy.cellInterference || !!enemy.rowInterference || !!enemy.tagInterference || isBossRuleEnemy(enemy.id);
  }

  private bossSystems(enemy: EnemyCombatDefinition): string[] {
    const systems: string[] = [];
    if (enemy.interference) systems.push('CHANNEL JAM');
    if (enemy.cellInterference) systems.push('SLIME SIGNAL');
    if (enemy.rowInterference) systems.push('MAGNET SCRAMBLE');
    if (enemy.tagInterference) systems.push('TAG ECLIPSE');
    if (timeTaxDefinitionForEnemyId(enemy.id)) systems.push('TIME TAX');
    if (clutterCrushDefinitionForEnemyId(enemy.id)) systems.push('CLUTTER CRUSH');
    if (duplicateDebtDefinitionForEnemyId(enemy.id)) systems.push('DUPLICATE DEBT');
    if (edgeRentDefinitionForEnemyId(enemy.id)) systems.push('EDGE RENT');
    return systems;
  }

  private lateWorldPressureStatus(pressure: LateWorldPressureResult): string {
    if (pressure.pressureCount === 0) return `${pressure.name.toUpperCase()} • CLEAN BUILD • NO SURCHARGE`;
    const target = pressure.metric === 'duplicate-stack'
      ? `${pressure.pressureCount} EXTRA ${pressure.pressureCount === 1 ? 'COPY' : 'COPIES'}`
      : `${pressure.pressureCount} EDGE ${pressure.pressureCount === 1 ? 'ITEM' : 'ITEMS'}`;
    const effects: string[] = [];
    if (pressure.enemyHpPct > 0) effects.push(`ENEMY HP +${pressure.enemyHpPct}%`);
    if (pressure.enemyDamagePct > 0) effects.push(`DAMAGE +${pressure.enemyDamagePct}%`);
    if (pressure.enemyAttackSpeedPct > 0) effects.push(`ATTACK SPEED +${pressure.enemyAttackSpeedPct}%`);
    return `${pressure.name.toUpperCase()} • ${target} → ${effects.join(' • ')}`;
  }

  private setLateWorldHazardVisual(pressure: LateWorldPressureResult | null): void {
    if (this.lateWorldHazardIcon) {
      this.scene.tweens.killTweensOf(this.lateWorldHazardIcon);
      this.lateWorldHazardIcon.destroy();
      this.lateWorldHazardIcon = null;
    }
    if (!pressure) return;
    const key = pressure.world === 5 ? 'world5-audit' : 'world6-edge';
    const texture = resolveAuthoredTexture(this.scene, uiArtKey(key));
    if (!texture) return;
    const icon = this.scene.add.image(
      this.centerX + 304,
      this.centerY - 218,
      texture.textureKey,
      texture.frame,
    ).setDisplaySize(46, 46).setDepth(45);
    this.lateWorldHazardIcon = icon;
    if (this.reducedMotion) return;
    icon.setScale(0.31).setAlpha(0.75);
    this.scene.tweens.add({
      targets: icon,
      scaleX: 0.36,
      scaleY: 0.36,
      alpha: 1,
      yoyo: true,
      repeat: -1,
      duration: 520,
      ease: 'Sine.InOut',
    });
  }

  private punchEnemy(scale: number): void {
    if (this.reducedMotion) return;
    this.scene.tweens.add({ targets: this.enemyBody, scaleX: scale, scaleY: scale, yoyo: true, duration: 85, onComplete: () => this.enemyBody.setScale(1) });
  }

  private pushLog(message: string): void {
    this.eventLog.unshift(message);
    if (this.eventLog.length > 5) this.eventLog.length = 5;
    this.eventLogText.setText(this.eventLog.join('\n'));
  }

  private seconds(ms: number): string { return `${(ms / 1000).toFixed(1)}s`; }
  private setStatus(message: string, color: string): void { this.statusText.setText(message).setColor(color); }
}
