import * as Phaser from 'phaser';
import { telemetry } from '../../analytics/Telemetry';
import { AdBreakPolicy } from '../../platform/AdBreakPolicy';
import type { PlatformAdapter } from '../../platform/PlatformAdapter';
import { campaignLabel, loopLabel, type RunEncounterDefinition } from '../data/runEncounters';
import { loopRewardMultiplier, type RunProgressState } from '../domain/runProgression';
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
  private readonly encounterText: Phaser.GameObjects.Text;
  private readonly subtitleText: Phaser.GameObjects.Text;
  private readonly rewardText: Phaser.GameObjects.Text;
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly mutationText: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;
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
    this.titleText = scene.add.text(left + 14, top + 13, 'RUN', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '22px', color: '#d7ff8c',
      fontStyle: 'bold', stroke: '#10120e', strokeThickness: 5,
    });
    this.stageText = scene.add.text(left + 14, top + 50, '', {
      fontSize: '14px', color: '#ffcf69', fontStyle: 'bold', stroke: '#141218', strokeThickness: 3,
    });
    this.encounterText = scene.add.text(left + 14, top + 82, '', {
      fontSize: '16px', color: '#f7f2e8', fontStyle: 'bold', stroke: '#121119', strokeThickness: 3,
      wordWrap: { width: 172 },
    });
    this.subtitleText = scene.add.text(left + 14, top + 127, '', {
      fontSize: '12px', color: '#c0b9c7', lineSpacing: 3, wordWrap: { width: 172 },
    });
    this.rewardText = scene.add.text(left + 14, top + 193, '', {
      fontSize: '13px', color: '#ffd56e', fontStyle: 'bold',
    });
    this.scoreText = scene.add.text(left + 14, top + 217, '', {
      fontSize: '13px', color: '#d9b8ff', fontStyle: 'bold',
    });
    this.mutationText = scene.add.text(left + 14, top + 242, '', {
      fontSize: '11px', color: '#8ce7ff', fontStyle: 'bold', lineSpacing: 2, wordWrap: { width: 172 },
    });
    this.statusText = scene.add.text(left + 14, top + 326, '', {
      fontSize: '11px', color: '#a49dab', lineSpacing: 2, wordWrap: { width: 172 },
    });
    scene.events.once('shutdown', () => this.stopGameplayMarkup());
    this.refresh();
  }

  refresh(message?: string): void {
    this.stopGameplayMarkup();
    for (const object of this.actionObjects) object.destroy();
    this.actionObjects.length = 0;

    const progress = this.options.getProgress();
    this.scoreText.setText(`SCORE  ◆ ${progress.score}`);
    this.statusText.setText((message ?? 'Repack and shop between encounters.').toUpperCase());

    if (progress.mode === 'deep-choice') {
      const nextLoop = progress.loopNumber + 1;
      const mutationCount = Math.min(4, nextLoop);
      this.titleText.setText('REALITY BROKEN').setColor('#f4a0ff');
      this.stageText.setText(progress.loopNumber === 1 ? '4 WORLDS COMPLETE' : `LOOP ${progress.loopNumber} COMPLETE`);
      this.encounterText.setText('ESCAPE OR GO DEEPER?');
      this.subtitleText.setText(`Keep this exact build for another 4 corrupted worlds. Each world stacks ${mutationCount} mutations.`);
      this.rewardText.setText(`NEXT LOOP  ×${loopRewardMultiplier(nextLoop).toFixed(2)} REWARDS`);
      this.mutationText.setText('GO DEEPER = 12 MORE ENCOUNTERS BEFORE THE NEXT SAFE EXIT.');
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
      this.encounterText.setText('REALITY SURVIVED YOU.');
      this.subtitleText.setText('Start a new run for a different backpack, mutation and perk path.');
      this.rewardText.setText('');
      this.mutationText.setText('');
      return;
    }

    const encounter = this.options.getEncounter();
    if (!encounter) return;
    this.titleText.setText(progress.mode === 'loop' ? 'CORRUPTED LOOP' : 'RUN');
    const stage = progress.mode === 'campaign'
      ? campaignLabel(progress.campaignEncounterIndex)
      : loopLabel(progress.loopNumber, progress.loopEncounterIndex);
    this.stageText.setText(stage);
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
    this.scene.add.rectangle(cx + 5, cy + 7, 200, 360, PANEL_VISUALS.ink, 0.58);
    this.scene.add.rectangle(cx, cy, 200, 360, 0x1b1c24, 1).setStrokeStyle(5, 0x646b78);
    this.scene.add.rectangle(cx, cy, 188, 348, 0x141720, 1).setStrokeStyle(1, 0x343843);
    this.scene.add.rectangle(cx, this.top + 30, 168, 44, 0x303728, 0.72).setStrokeStyle(2, 0x70864c);
    this.scene.add.rectangle(cx, this.top + 181, 172, 2, 0x5e5361, 0.55);
    this.scene.add.rectangle(cx, this.top + 233, 172, 2, 0x5e5361, 0.35);
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
    const shadow = this.scene.add.rectangle(x + 3, y + 4, 170, 32, PANEL_VISUALS.ink, 0.6);
    const button = this.scene.add.rectangle(x, y, 170, 32, fill, 1)
      .setStrokeStyle(3, stroke).setInteractive({ useHandCursor: true });
    const label = this.scene.add.text(x, y, labelText, {
      fontSize: '12px', color: '#f7f2e8', fontStyle: 'bold', stroke: '#17131b', strokeThickness: 3,
    }).setOrigin(0.5);
    button.on('pointerover', () => button.setAlpha(0.84));
    button.on('pointerout', () => button.setAlpha(1));
    button.on('pointerdown', () => { button.setScale(0.97); label.setScale(0.97); shadow.setScale(0.97); });
    const restore = (): void => { button.setScale(1); label.setScale(1); shadow.setScale(1); };
    button.on('pointerupoutside', restore);
    button.on('pointerup', () => { restore(); onClick(); });
    this.actionObjects.push(shadow, button, label);
  }
}

function runtimeNowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
