import * as Phaser from 'phaser';
import { telemetry } from '../../analytics/Telemetry';
import { AdBreakPolicy } from '../../platform/AdBreakPolicy';
import type { PlatformAdapter } from '../../platform/PlatformAdapter';
import { campaignLabel, loopLabel, type RunEncounterDefinition } from '../data/runEncounters';
import {
  CAMPAIGN_ENCOUNTER_COUNT,
  CAMPAIGN_WORLDS,
  LOOP_ENCOUNTER_COUNT,
  LOOP_WORLDS,
  completedCampaignWorldCount,
  loopRewardMultiplier,
  type RunProgressState,
} from '../domain/runProgression';
import { createMaterialSurface } from './materialSurface';
import { REQUEST_NEW_RUN_EVENT } from './runUiEvents';
import { PANEL_VISUALS } from './visualTokens';

const PLATFORM_REGISTRY_KEY = 'junkpack.platform-adapter';

export interface RunProgressPanelOptions {
  readonly getProgress: () => RunProgressState;
  readonly getEncounter: () => RunEncounterDefinition | null;
  readonly onStartEncounter: (encounter: RunEncounterDefinition) => boolean;
  readonly onEnterCorruptedLoop: () => void;
  readonly onCashOut: () => void;
}

export class RunProgressPanel {
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly stageText: Phaser.GameObjects.Text;
  private readonly cycleCountText: Phaser.GameObjects.Text;
  private readonly encounterText: Phaser.GameObjects.Text;
  private readonly subtitleText: Phaser.GameObjects.Text;
  private readonly rewardText: Phaser.GameObjects.Text;
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly mutationText: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly campaignRailSegments: Phaser.GameObjects.Rectangle[] = [];
  private readonly campaignRailLabels: Phaser.GameObjects.Text[] = [];
  private readonly actionObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly adBreakPolicy: AdBreakPolicy;
  private gameplayMarkedActive = false;
  private interstitialInFlight = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly left: number,
    private readonly top: number,
    private readonly options: RunProgressPanelOptions,
  ) {
    this.adBreakPolicy = new AdBreakPolicy({ sessionStartedAtMs: runtimeNowMs() });
    this.drawShell();

    this.titleText = scene.add.text(left + 100, top + 22, 'ROUTE', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '21px', color: '#d7ff8c',
      fontStyle: 'bold', stroke: '#10120e', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(2.4);
    this.stageText = scene.add.text(left + 14, top + 50, '', {
      fontSize: '11px', color: '#ffcf69', fontStyle: 'bold', stroke: '#141218', strokeThickness: 3,
      wordWrap: { width: 132 },
    }).setDepth(2.4);
    this.cycleCountText = scene.add.text(left + 184, top + 52, '', {
      fontSize: '10px', color: '#d9b8ff', fontStyle: 'bold', stroke: '#141218', strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(2.4);

    for (let index = 0; index < CAMPAIGN_WORLDS; index += 1) {
      const segmentLeft = left + 14 + index * 28;
      this.campaignRailSegments.push(
        scene.add.rectangle(segmentLeft, top + 82, 23, 7, 0x353946, 1)
          .setOrigin(0, 0.5)
          .setStrokeStyle(1, 0x565d6d, 1)
          .setDepth(2.4),
      );
      this.campaignRailLabels.push(
        scene.add.text(segmentLeft + 11.5, top + 67, String(index + 1), {
          fontSize: '8px', color: '#858c9a', fontStyle: 'bold', stroke: '#111219', strokeThickness: 2,
        }).setOrigin(0.5, 0).setDepth(2.5),
      );
    }

    this.encounterText = scene.add.text(left + 14, top + 96, '', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '15px', color: '#f7f2e8', fontStyle: 'bold', stroke: '#121119', strokeThickness: 4,
      wordWrap: { width: 172 },
    }).setDepth(2.4);
    this.subtitleText = scene.add.text(left + 14, top + 137, '', {
      fontSize: '10px', color: '#c0b9c7', lineSpacing: 2, wordWrap: { width: 172 },
    }).setDepth(2.4);
    this.rewardText = scene.add.text(left + 100, top + 199, '', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '12px', color: '#ffd56e', fontStyle: 'bold', stroke: '#17130b', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2.5);
    this.scoreText = scene.add.text(left + 14, top + 224, '', {
      fontSize: '11px', color: '#d9b8ff', fontStyle: 'bold', stroke: '#141218', strokeThickness: 2,
    }).setDepth(2.4);
    this.mutationText = scene.add.text(left + 14, top + 247, '', {
      fontSize: '9px', color: '#8ce7ff', fontStyle: 'bold', lineSpacing: 2, wordWrap: { width: 172 },
    }).setDepth(2.4);
    this.statusText = scene.add.text(left + 14, top + 326, '', {
      fontSize: '9px', color: '#a49dab', lineSpacing: 2, wordWrap: { width: 172 }, fontStyle: 'bold',
    }).setDepth(2.4);

    scene.events.once('shutdown', () => this.stopGameplayMarkup());
    this.refresh();
  }

  refresh(message?: string): void {
    this.stopGameplayMarkup();
    for (const object of this.actionObjects) object.destroy();
    this.actionObjects.length = 0;

    const progress = this.options.getProgress();
    this.scoreText.setText(`RUN SCORE  ◆ ${progress.score}`);
    const milestoneStatus = this.campaignMilestoneStatus(progress);
    this.statusText.setText((milestoneStatus ?? message ?? 'Repack and shop between encounters.').toUpperCase());

    if (progress.mode === 'deep-choice') {
      const nextLoop = progress.loopNumber + 1;
      const mutationCount = Math.min(4, nextLoop);
      this.titleText.setText('REALITY BROKEN').setColor('#f4a0ff');
      this.stageText.setText(progress.loopNumber === 1 ? `${CAMPAIGN_WORLDS} WORLDS COMPLETE` : `LOOP ${progress.loopNumber} COMPLETE`);
      this.cycleCountText.setText(progress.loopNumber === 1 ? `${CAMPAIGN_ENCOUNTER_COUNT}/${CAMPAIGN_ENCOUNTER_COUNT}` : `${LOOP_ENCOUNTER_COUNT}/${LOOP_ENCOUNTER_COUNT}`);
      this.updateCampaignRail(progress, null);
      this.encounterText.setText('ESCAPE OR GO DEEPER?');
      this.subtitleText.setText(`Keep this exact build for another ${LOOP_WORLDS} corrupted worlds. Each world stacks ${mutationCount} mutations.`);
      this.rewardText.setText(`NEXT LOOP  ×${loopRewardMultiplier(nextLoop).toFixed(2)} REWARDS`);
      this.mutationText.setText(`${LOOP_ENCOUNTER_COUNT} MORE ENCOUNTERS BEFORE THE NEXT SAFE EXIT.`);
      this.createActionButton(this.left + 100, this.top + 280, 'GO DEEPER', 0x49305a, 0xd47cff, () => {
        void this.runCycleBoundaryAction(() => this.options.onEnterCorruptedLoop());
      });
      this.createActionButton(this.left + 100, this.top + 317, 'ESCAPE / CASH OUT', 0x33432a, 0xa8ff68, () => {
        void this.runCycleBoundaryAction(() => this.options.onCashOut());
      });
      return;
    }

    this.titleText.setColor('#d7ff8c');
    if (progress.mode === 'complete') {
      this.titleText.setText('RUN COMPLETE');
      this.stageText.setText('SCORE LOCKED');
      this.cycleCountText.setText('');
      this.updateCampaignRail(progress, null);
      this.encounterText.setText('REALITY SURVIVED YOU.');
      this.subtitleText.setText('Start a new run for a different backpack, mutation and perk path.');
      this.rewardText.setText('FINAL SCORE SAVED');
      this.mutationText.setText('NEW RUN = NEW STANDARD SEED • META PROGRESS STAYS');
      this.statusText.setText('RUN ARCHIVED • READY TO REPACK REALITY');
      this.createActionButton(this.left + 100, this.top + 302, '↻ START NEW RUN', 0x33432a, 0xb5ff4d, () => {
        this.scene.events.emit(REQUEST_NEW_RUN_EVENT);
      });
      return;
    }

    const encounter = this.options.getEncounter();
    if (!encounter) return;
    this.titleText.setText(progress.mode === 'loop' ? 'CORRUPTED ROUTE' : 'BOSS CONTRACT');
    const stage = progress.mode === 'campaign'
      ? campaignLabel(progress.campaignEncounterIndex)
      : loopLabel(progress.loopNumber, progress.loopEncounterIndex);
    this.stageText.setText(stage);
    this.cycleCountText.setText(progress.mode === 'campaign'
      ? `${progress.campaignEncounterIndex + 1}/${CAMPAIGN_ENCOUNTER_COUNT}`
      : `${progress.loopEncounterIndex + 1}/${LOOP_ENCOUNTER_COUNT}`);
    this.updateCampaignRail(progress, encounter);
    this.encounterText.setText(encounter.title.toUpperCase());
    this.subtitleText.setText(encounter.subtitle);
    this.rewardText.setText(`BOUNTY  ◈ +${encounter.rewardCoins}`);
    this.mutationText.setText(this.mutationSummary(encounter));
    this.createActionButton(this.left + 100, this.top + 302, '▶ START FIGHT', 0x443253, 0xd07cff, () => {
      const started = this.options.onStartEncounter(encounter);
      if (started) {
        telemetry.track('combat_started', { encounterId: encounter.encounterId, stage });
        this.startGameplayMarkup();
      }
      this.statusText.setText(started ? 'FIGHT LIVE • BACKPACK SNAPSHOT LOCKED' : 'BLOCKED • FINISH THE CURRENT CHOICE / FIGHT FIRST');
    });
  }

  private drawShell(): void {
    const cx = this.left + 100;
    const cy = this.top + 180;

    this.scene.add.rectangle(cx + 6, cy + 8, 204, 364, PANEL_VISUALS.ink, 0.66).setDepth(0.4);
    this.scene.add.rectangle(cx, cy, 202, 362, 0x2c2523, 1)
      .setStrokeStyle(6, 0x735d50)
      .setDepth(0.6);
    this.scene.add.rectangle(cx, cy, 190, 350, 0x171a21, 1)
      .setStrokeStyle(2, 0x555a65, 0.72)
      .setDepth(0.8);
    createMaterialSurface(this.scene, {
      x: cx,
      y: cy,
      width: 182,
      height: 342,
      kind: 'scrap',
      seed: 'run-progress:boss-contract',
      depth: 0.9,
      alpha: 0.72,
    });

    // Clipboard clamp / route ticket header.
    this.scene.add.rectangle(cx + 2, this.top + 20, 150, 42, 0x0d0f14, 0.72).setDepth(1.1);
    this.scene.add.rectangle(cx, this.top + 17, 148, 40, 0x48505a, 1)
      .setStrokeStyle(3, 0x9da5b0)
      .setDepth(1.2);
    this.scene.add.rectangle(cx, this.top + 17, 88, 18, 0x17191e, 1)
      .setStrokeStyle(1, 0xc5ccd5, 0.48)
      .setDepth(1.3);

    const bountyPlate = this.scene.add.rectangle(cx, this.top + 199, 174, 31, 0x2d241b, 1)
      .setStrokeStyle(2, 0xb08744)
      .setAngle(-0.4)
      .setDepth(1.4);
    createMaterialSurface(this.scene, {
      x: cx,
      y: this.top + 199,
      width: 164,
      height: 21,
      kind: 'paper',
      seed: 'run-progress:bounty-strip',
      depth: 1.5,
      alpha: 0.45,
    }).setAngle(-0.4);
    bountyPlate.setAlpha(0.94);

    this.scene.add.rectangle(cx, this.top + 239, 174, 2, 0x5e5361, 0.45).setDepth(1.3);
    this.scene.add.rectangle(cx, this.top + 294, 174, 2, 0x5e5361, 0.3).setDepth(1.3);

    // Small hazard marks around the mutation block.
    const hazard = this.scene.add.graphics().setDepth(1.6);
    hazard.lineStyle(3, 0x5ca5b8, 0.28);
    hazard.lineBetween(this.left + 12, this.top + 242, this.left + 12, this.top + 286);
    hazard.lineBetween(this.left + 188, this.top + 242, this.left + 188, this.top + 286);

    for (const [x, y] of [
      [this.left + 9, this.top + 9], [this.left + 191, this.top + 9],
      [this.left + 9, this.top + 351], [this.left + 191, this.top + 351],
    ] as const) {
      this.scene.add.circle(x, y, 5, 0x555b65, 1)
        .setStrokeStyle(1, 0xbac1cb, 0.55)
        .setDepth(1.8);
    }
  }

  private campaignMilestoneStatus(progress: RunProgressState): string | null {
    if (progress.mode !== 'campaign' || progress.campaignEncounterIndex <= 0) return null;
    if (progress.campaignEncounterIndex % 3 !== 0) return null;
    const completed = completedCampaignWorldCount(progress);
    if (completed <= 0 || completed >= CAMPAIGN_WORLDS) return null;
    return `WORLD ${completed} CLEARED • REPACK FOR WORLD ${completed + 1}`;
  }

  private updateCampaignRail(progress: RunProgressState, encounter: RunEncounterDefinition | null): void {
    const visible = progress.mode === 'campaign'
      || (progress.mode === 'deep-choice' && progress.loopNumber === 1);
    const completed = completedCampaignWorldCount(progress);
    const currentWorld = progress.mode === 'campaign'
      ? (encounter?.world ?? Math.min(CAMPAIGN_WORLDS, completed + 1)) : CAMPAIGN_WORLDS;

    for (let index = 0; index < CAMPAIGN_WORLDS; index += 1) {
      const world = index + 1;
      const segment = this.campaignRailSegments[index];
      const label = this.campaignRailLabels[index];
      if (!segment || !label) continue;
      segment.setVisible(visible);
      label.setVisible(visible);
      if (!visible) continue;

      if (world <= completed) {
        segment.setFillStyle(0xb5ff4d, 1).setStrokeStyle(1, 0xd8ff9e, 1);
        label.setText(`✓${world}`).setColor('#d8ff9e');
      } else if (world === currentWorld) {
        segment.setFillStyle(0xff91e6, 1).setStrokeStyle(1, 0xffcff2, 1);
        label.setText(`>${world}`).setColor('#ffcff2');
      } else {
        segment.setFillStyle(0x353946, 1).setStrokeStyle(1, 0x565d6d, 1);
        label.setText(String(world)).setColor('#858c9a');
      }
    }
  }

  private mutationSummary(encounter: RunEncounterDefinition): string {
    const names = encounter.modifiers.map((modifier) => modifier.name).join(' + ');
    if (encounter.modifiers.length === 1) {
      return `MUTATION • ${names}\n${encounter.modifiers[0]?.description ?? ''}`;
    }
    return `MUTATIONS ×${encounter.modifiers.length}\n${names}`;
  }

  private startGameplayMarkup(): void {
    if (this.gameplayMarkedActive) return;
    this.gameplayMarkedActive = true;
    this.platformAdapter()?.gameplayStart();
  }

  private stopGameplayMarkup(): void {
    if (!this.gameplayMarkedActive) return;
    this.gameplayMarkedActive = false;
    this.platformAdapter()?.gameplayStop();
  }

  private async runCycleBoundaryAction(action: () => void): Promise<void> {
    if (this.interstitialInFlight) return;
    const platform = this.platformAdapter();
    const nowMs = runtimeNowMs();
    const eligible = platform && platform.id !== 'local' && this.adBreakPolicy.canShowInterstitial({
      breakPoint: 'cycle-boundary',
      gameplayActive: this.gameplayMarkedActive,
      nowMs,
    });
    if (!eligible || !platform) {
      action();
      return;
    }

    this.interstitialInFlight = true;
    this.statusText.setText('NATURAL BREAK • AD MAY PLAY BEFORE CONTINUING');
    try {
      const result = await platform.showInterstitial();
      telemetry.track('ad_result', { placement: 'cycle-boundary', format: 'interstitial', result });
      if (result === 'shown') this.adBreakPolicy.recordInterstitialShown(runtimeNowMs());
    } catch {
      telemetry.track('ad_result', { placement: 'cycle-boundary', format: 'interstitial', result: 'failed' });
    } finally {
      this.interstitialInFlight = false;
      action();
    }
  }

  private platformAdapter(): PlatformAdapter | undefined {
    return this.scene.registry.get(PLATFORM_REGISTRY_KEY) as PlatformAdapter | undefined;
  }

  private createActionButton(
    x: number,
    y: number,
    labelText: string,
    fill: number,
    stroke: number,
    onClick: () => void,
  ): void {
    const shadow = this.scene.add.rectangle(x + 3, y + 4, 178, 36, PANEL_VISUALS.ink, 0.68);
    const button = this.scene.add.rectangle(x, y, 178, 36, fill, 1)
      .setStrokeStyle(3, stroke).setInteractive({ useHandCursor: true });
    const inner = this.scene.add.rectangle(x, y, 166, 26, fill, 0.45)
      .setStrokeStyle(1, stroke, 0.34);
    const label = this.scene.add.text(x, y, labelText, {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '11px', color: '#f7f2e8', fontStyle: 'bold', stroke: '#17131b', strokeThickness: 4,
    }).setOrigin(0.5);
    button.on('pointerover', () => {
      button.setAlpha(0.9).setStrokeStyle(4, stroke);
      inner.setAlpha(0.72);
    });
    button.on('pointerout', () => {
      button.setAlpha(1).setStrokeStyle(3, stroke);
      inner.setAlpha(1);
    });
    button.on('pointerdown', () => {
      button.setScale(0.97);
      inner.setScale(0.97);
      label.setScale(0.97);
      shadow.setScale(0.97);
    });
    const restore = (): void => {
      button.setScale(1);
      inner.setScale(1);
      label.setScale(1);
      shadow.setScale(1);
    };
    button.on('pointerupoutside', restore);
    button.on('pointerup', () => { restore(); onClick(); });
    this.actionObjects.push(shadow, button, inner, label);
  }
}

function runtimeNowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
