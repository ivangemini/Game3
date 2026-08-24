import * as Phaser from 'phaser';
import { campaignLabel, getRunEncounter, type RunEncounterDefinition } from '../data/runEncounters';
import type { RunProgressState } from '../domain/runProgression';

export interface RunProgressPanelOptions {
  readonly getProgress: () => RunProgressState;
  readonly onStartEncounter: (encounter: RunEncounterDefinition) => boolean;
  readonly onEnterEndless: () => void;
  readonly onCashOut: () => void;
}

export class RunProgressPanel {
  private readonly titleText: Phaser.GameObjects.Text;
  private readonly stageText: Phaser.GameObjects.Text;
  private readonly encounterText: Phaser.GameObjects.Text;
  private readonly subtitleText: Phaser.GameObjects.Text;
  private readonly rewardText: Phaser.GameObjects.Text;
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly actionObjects: Phaser.GameObjects.GameObject[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly left: number,
    private readonly top: number,
    private readonly options: RunProgressPanelOptions,
  ) {
    scene.add.rectangle(left + 100, top + 180, 200, 360, 0x151821, 1).setStrokeStyle(4, 0x4e5668);
    this.titleText = scene.add.text(left + 14, top + 14, 'RUN', { fontSize: '21px', color: '#b5ff4d', fontStyle: 'bold' });
    this.stageText = scene.add.text(left + 14, top + 49, '', { fontSize: '13px', color: '#ffcf69', fontStyle: 'bold' });
    this.encounterText = scene.add.text(left + 14, top + 82, '', {
      fontSize: '15px', color: '#f7f2e8', fontStyle: 'bold', wordWrap: { width: 172 },
    });
    this.subtitleText = scene.add.text(left + 14, top + 126, '', {
      fontSize: '11px', color: '#aaa5b2', lineSpacing: 3, wordWrap: { width: 172 },
    });
    this.rewardText = scene.add.text(left + 14, top + 198, '', { fontSize: '12px', color: '#ffd56e' });
    this.scoreText = scene.add.text(left + 14, top + 224, '', { fontSize: '12px', color: '#cfa8ff' });
    this.statusText = scene.add.text(left + 14, top + 326, '', {
      fontSize: '10px', color: '#8e8998', wordWrap: { width: 172 },
    });
    this.refresh();
  }

  refresh(message?: string): void {
    for (const object of this.actionObjects) object.destroy();
    this.actionObjects.length = 0;

    const progress = this.options.getProgress();
    this.scoreText.setText(`SCORE  ${progress.score}`);
    this.statusText.setText(message ?? 'Repack and shop between encounters.');

    if (progress.mode === 'cashout') {
      this.titleText.setText('RUN CLEARED');
      this.stageText.setText('3 WORLDS COMPLETE');
      this.encounterText.setText('Take the win or keep the build alive.');
      this.subtitleText.setText('Endless scales every wave. Every 5th wave is a corrupted boss.');
      this.rewardText.setText('ENDLESS START  ×1.50 rewards');
      this.createActionButton(this.left + 100, this.top + 270, 'ENTER ENDLESS', 0x49305a, 0xd47cff, () => this.options.onEnterEndless());
      this.createActionButton(this.left + 100, this.top + 310, 'CASH OUT', 0x33432a, 0xa8ff68, () => this.options.onCashOut());
      return;
    }

    if (progress.mode === 'complete') {
      this.titleText.setText('RUN COMPLETE');
      this.stageText.setText('SCORE LOCKED');
      this.encounterText.setText('This run is finished.');
      this.subtitleText.setText('Start a new run to chase a different backpack and perk path.');
      this.rewardText.setText('');
      return;
    }

    const encounter = getRunEncounter(progress);
    if (!encounter) return;
    this.titleText.setText(progress.mode === 'endless' ? 'ENDLESS' : 'RUN');
    this.stageText.setText(progress.mode === 'campaign' ? campaignLabel(progress.campaignEncounterIndex) : `WAVE ${progress.endlessWave}`);
    this.encounterText.setText(encounter.title.toUpperCase());
    this.subtitleText.setText(encounter.subtitle);
    this.rewardText.setText(`REWARD  +${encounter.rewardCoins} coins`);
    this.createActionButton(this.left + 100, this.top + 282, progress.mode === 'endless' ? `START WAVE ${progress.endlessWave}` : 'START ENCOUNTER', 0x3a324d, 0xb96cff, () => {
      const started = this.options.onStartEncounter(encounter);
      this.statusText.setText(started ? 'Fight running — backpack snapshot locked.' : 'Cannot start now. Finish the current choice/fight first.');
    });
    if (progress.mode === 'endless') {
      this.createActionButton(this.left + 100, this.top + 320, 'CASH OUT RUN', 0x30392b, 0x91d860, () => this.options.onCashOut());
    }
  }

  private createActionButton(
    x: number,
    y: number,
    labelText: string,
    fill: number,
    stroke: number,
    onClick: () => void,
  ): void {
    const button = this.scene.add.rectangle(x, y, 170, 32, fill, 1).setStrokeStyle(2, stroke).setInteractive({ useHandCursor: true });
    const label = this.scene.add.text(x, y, labelText, { fontSize: '11px', color: '#f7f2e8', fontStyle: 'bold' }).setOrigin(0.5);
    button.on('pointerover', () => button.setAlpha(0.82));
    button.on('pointerout', () => button.setAlpha(1));
    button.on('pointerdown', () => { button.setScale(0.97); label.setScale(0.97); });
    button.on('pointerup', () => { button.setScale(1); label.setScale(1); onClick(); });
    this.actionObjects.push(button, label);
  }
}
