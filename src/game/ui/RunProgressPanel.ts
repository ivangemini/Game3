import * as Phaser from 'phaser';
import { campaignLabel, loopLabel, type RunEncounterDefinition } from '../data/runEncounters';
import { loopRewardMultiplier, type RunProgressState } from '../domain/runProgression';

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
    this.rewardText = scene.add.text(left + 14, top + 190, '', { fontSize: '12px', color: '#ffd56e' });
    this.scoreText = scene.add.text(left + 14, top + 214, '', { fontSize: '12px', color: '#cfa8ff' });
    this.mutationText = scene.add.text(left + 14, top + 238, '', {
      fontSize: '10px', color: '#7edfff', fontStyle: 'bold', wordWrap: { width: 172 },
    });
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

    if (progress.mode === 'deep-choice') {
      const nextLoop = progress.loopNumber + 1;
      const mutationCount = Math.min(4, nextLoop);
      this.titleText.setText('REALITY BROKEN');
      this.stageText.setText(progress.loopNumber === 1 ? '4 WORLDS COMPLETE' : `LOOP ${progress.loopNumber} COMPLETE`);
      this.encounterText.setText('ESCAPE OR GO DEEPER?');
      this.subtitleText.setText(`Going deeper keeps this exact build for another 4 corrupted worlds. Each world stacks ${mutationCount} mutations.`);
      this.rewardText.setText(`NEXT LOOP  ×${loopRewardMultiplier(nextLoop).toFixed(2)} base rewards`);
      this.mutationText.setText('GO DEEPER commits the build to a full 12-encounter loop before the next safe exit.');
      this.createActionButton(this.left + 100, this.top + 280, 'GO DEEPER', 0x49305a, 0xd47cff, () => this.options.onEnterCorruptedLoop());
      this.createActionButton(this.left + 100, this.top + 316, 'ESCAPE / CASH OUT', 0x33432a, 0xa8ff68, () => this.options.onCashOut());
      return;
    }

    if (progress.mode === 'complete') {
      this.titleText.setText('RUN COMPLETE');
      this.stageText.setText('SCORE LOCKED');
      this.encounterText.setText('This reality survived you.');
      this.subtitleText.setText('Start a new run to chase a different backpack, mutation and perk path.');
      this.rewardText.setText('');
      this.mutationText.setText('');
      return;
    }

    const encounter = this.options.getEncounter();
    if (!encounter) return;
    this.titleText.setText(progress.mode === 'loop' ? 'CORRUPTED LOOP' : 'RUN');
    this.stageText.setText(
      progress.mode === 'campaign'
        ? campaignLabel(progress.campaignEncounterIndex)
        : loopLabel(progress.loopNumber, progress.loopEncounterIndex),
    );
    this.encounterText.setText(encounter.title.toUpperCase());
    this.subtitleText.setText(encounter.subtitle);
    this.rewardText.setText(`REWARD  +${encounter.rewardCoins} coins`);
    this.mutationText.setText(this.mutationSummary(encounter));
    this.createActionButton(this.left + 100, this.top + 302, 'START ENCOUNTER', 0x3a324d, 0xb96cff, () => {
      const started = this.options.onStartEncounter(encounter);
      this.statusText.setText(started ? 'Fight running — backpack snapshot locked.' : 'Cannot start now. Finish the current choice/fight first.');
    });
  }

  private mutationSummary(encounter: RunEncounterDefinition): string {
    const names = encounter.modifiers.map((modifier) => modifier.name).join(' + ');
    if (encounter.modifiers.length === 1) {
      return `MUTATION • ${names}\n${encounter.modifiers[0]?.description ?? ''}`;
    }
    return `MUTATIONS ×${encounter.modifiers.length}\n${names}`;
  }

  private createActionButton(
    x: number,
    y: number,
    labelText: string,
    fill: number,
    stroke: number,
    onClick: () => void,
  ): void {
    const button = this.scene.add.rectangle(x, y, 170, 30, fill, 1).setStrokeStyle(2, stroke).setInteractive({ useHandCursor: true });
    const label = this.scene.add.text(x, y, labelText, { fontSize: '11px', color: '#f7f2e8', fontStyle: 'bold' }).setOrigin(0.5);
    button.on('pointerover', () => button.setAlpha(0.82));
    button.on('pointerout', () => button.setAlpha(1));
    button.on('pointerdown', () => { button.setScale(0.97); label.setScale(0.97); });
    button.on('pointerup', () => { button.setScale(1); label.setScale(1); onClick(); });
    this.actionObjects.push(button, label);
  }
}
