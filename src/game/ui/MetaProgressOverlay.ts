import * as Phaser from 'phaser';
import {
  createMetaProgressionSnapshot,
  type AchievementSnapshot,
  type ArchiveMilestoneSnapshot,
  type MetaProgressionInput,
} from '../domain/metaProgression';
import { dismissOverlay, pressPulse, revealOverlay } from './uiMotion';

const DEPTH = 1210;
const ACHIEVEMENT_PAGE_SIZE = 8;

export class MetaProgressOverlay {
  private readonly root: Phaser.GameObjects.Container;
  private readonly content: Phaser.GameObjects.Container;
  private achievementPage = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly allItemIds: readonly string[],
    private readonly allRecipeIds: readonly string[],
    private readonly secondStageRecipeIds: readonly string[],
    private readonly getProgress: () => MetaProgressionInput,
  ) {
    this.root = scene.add.container(0, 0).setDepth(DEPTH).setVisible(false);
    this.content = scene.add.container(0, 0);
    const blocker = scene.add.rectangle(800, 450, 1600, 900, 0x050609, 0.95)
      .setInteractive({ useHandCursor: false });
    const panel = scene.add.rectangle(800, 458, 1480, 800, 0x10131b, 1)
      .setStrokeStyle(3, 0x665178, 1);
    this.root.add([blocker, panel, this.content]);

    const escape = (): void => this.hide();
    scene.input.keyboard?.on('keydown-ESC', escape);
    scene.events.once('shutdown', () => scene.input.keyboard?.off('keydown-ESC', escape));
  }

  show(): void {
    this.refresh();
    revealOverlay(this.scene, this.root, this.content);
  }

  hide(): void {
    if (!this.root.visible) return;
    dismissOverlay(this.scene, this.root, this.content);
  }

  isVisible(): boolean {
    return this.root.visible;
  }

  private refresh(): void {
    this.content.removeAll(true);
    const snapshot = createMetaProgressionSnapshot(
      this.allItemIds,
      this.allRecipeIds,
      this.secondStageRecipeIds,
      this.getProgress(),
    );

    this.content.add(this.scene.add.text(94, 74, 'TROPHY SHELF', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '36px', color: '#f7f2e8', stroke: '#090a0d', strokeThickness: 7,
    }));
    this.content.add(this.scene.add.text(94, 120,
      `ARCHIVE RANK • ${snapshot.currentRank.name.toUpperCase()}    SEAL • ${snapshot.currentRank.seal}`,
      { fontSize: '14px', color: '#ff91e6', fontStyle: 'bold' },
    ));
    this.content.add(this.scene.add.text(94, 148,
      `ACHIEVEMENTS ${snapshot.unlockedAchievementCount}/${snapshot.totalAchievementCount}    SECRET EVOLUTIONS ${snapshot.discoveredSecondStageRecipes}/${snapshot.totalSecondStageRecipes}`,
      { fontSize: '12px', color: '#aeb4c3', fontStyle: 'bold' },
    ));

    const close = this.scene.add.rectangle(1454, 105, 116, 40, 0x2b2e3a, 1)
      .setStrokeStyle(2, 0x7f8496)
      .setInteractive({ useHandCursor: true });
    const closeText = this.scene.add.text(1454, 105, 'CLOSE  ×', {
      fontSize: '13px', color: '#f7f2e8', fontStyle: 'bold',
    }).setOrigin(0.5);
    close.on('pointerover', () => close.setFillStyle(0x414655));
    close.on('pointerout', () => close.setFillStyle(0x2b2e3a));
    close.on('pointerdown', () => pressPulse(this.scene, [close, closeText]));
    close.on('pointerup', () => this.hide());
    this.content.add([close, closeText]);

    this.content.add(this.scene.add.text(94, 190, 'ARCHIVE RANKS • COSMETIC SEALS', {
      fontSize: '13px', color: '#b5ff4d', fontStyle: 'bold',
    }));
    snapshot.milestones.forEach((milestone, index) => this.drawMilestone(milestone, 94, 224 + index * 112));

    this.content.add(this.scene.add.text(585, 190, 'ACHIEVEMENTS • DERIVED FROM REAL META PROGRESS', {
      fontSize: '13px', color: '#ffcf69', fontStyle: 'bold',
    }));
    const maxPage = Math.max(0, Math.ceil(snapshot.achievements.length / ACHIEVEMENT_PAGE_SIZE) - 1);
    this.achievementPage = Math.min(this.achievementPage, maxPage);
    const start = this.achievementPage * ACHIEVEMENT_PAGE_SIZE;
    snapshot.achievements.slice(start, start + ACHIEVEMENT_PAGE_SIZE).forEach((achievement, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      this.drawAchievement(achievement, 585 + col * 440, 224 + row * 138);
    });
    this.drawPagination(this.achievementPage, maxPage);
  }

  private drawMilestone(milestone: ArchiveMilestoneSnapshot, x: number, y: number): void {
    const unlocked = milestone.unlocked;
    const card = this.scene.add.rectangle(x + 220, y + 48, 440, 96, unlocked ? 0x243322 : 0x181b24, 1)
      .setStrokeStyle(2, unlocked ? 0x9bdc5b : 0x3d4251);
    const icon = this.scene.add.text(x + 27, y + 18, unlocked ? '◆' : '◇', {
      fontSize: '30px', color: unlocked ? '#b5ff4d' : '#626877', fontStyle: 'bold',
    });
    const title = this.scene.add.text(x + 70, y + 10, milestone.name.toUpperCase(), {
      fontSize: '15px', color: unlocked ? '#f7f2e8' : '#8e939f', fontStyle: 'bold',
    });
    const seal = this.scene.add.text(x + 70, y + 34, unlocked ? milestone.seal : `LOCKED • ${milestone.percent}%`, {
      fontSize: '10px', color: unlocked ? '#ff91e6' : '#6f7481', fontStyle: 'bold',
    });
    const requirement = this.scene.add.text(x + 70, y + 57, milestone.requirementText, {
      fontSize: '9px', color: unlocked ? '#b6bac5' : '#777c89', wordWrap: { width: 350 },
    });
    this.content.add([card, icon, title, seal, requirement]);
    this.drawProgressBar(x + 70, y + 84, 344, milestone.percent, unlocked ? 0xb5ff4d : 0x7f8491);
  }

  private drawAchievement(achievement: AchievementSnapshot, x: number, y: number): void {
    const unlocked = achievement.unlocked;
    const card = this.scene.add.rectangle(x + 205, y + 59, 410, 118, unlocked ? 0x2a2332 : 0x181b24, 1)
      .setStrokeStyle(2, unlocked ? 0xd18cff : 0x3d4251);
    const badge = this.scene.add.text(x + 35, y + 27, achievement.badge, {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '31px',
      color: unlocked ? '#ff91e6' : '#555b69',
    }).setOrigin(0.5);
    const title = this.scene.add.text(x + 70, y + 14, achievement.name.toUpperCase(), {
      fontSize: '13px', color: unlocked ? '#f7f2e8' : '#8b909c', fontStyle: 'bold',
    });
    const description = this.scene.add.text(x + 70, y + 39, achievement.description, {
      fontSize: '10px', color: unlocked ? '#bfc3cd' : '#6e7380', wordWrap: { width: 315 },
    });
    const progress = this.scene.add.text(x + 70, y + 78,
      unlocked ? 'UNLOCKED' : `${achievement.current}/${achievement.target} • ${achievement.percent}%`,
      { fontSize: '10px', color: unlocked ? '#b5ff4d' : '#8a90a0', fontStyle: 'bold' },
    );
    this.content.add([card, badge, title, description, progress]);
    this.drawProgressBar(x + 70, y + 103, 314, achievement.percent, unlocked ? 0xff91e6 : 0x777d8c);
  }

  private drawProgressBar(x: number, y: number, width: number, percent: number, color: number): void {
    const safePercent = Math.max(0, Math.min(100, percent));
    const track = this.scene.add.rectangle(x + width / 2, y, width, 5, 0x0d0f15, 1)
      .setStrokeStyle(1, 0x323643);
    const fillWidth = Math.max(0, width * safePercent / 100);
    this.content.add(track);
    if (fillWidth <= 0) return;
    const fill = this.scene.add.rectangle(x, y, fillWidth, 3, color, 1).setOrigin(0, 0.5);
    this.content.add(fill);
  }

  private drawPagination(page: number, maxPage: number): void {
    const y = 806;
    this.content.add(this.scene.add.text(1220, y, `TROPHIES ${page + 1}/${maxPage + 1}`, {
      fontSize: '11px', color: '#9ea4b2', fontStyle: 'bold',
    }).setOrigin(0.5));
    this.addPageButton(1080, y, '‹ PREV', page > 0, () => {
      this.achievementPage = page - 1;
      this.refresh();
    });
    this.addPageButton(1360, y, 'NEXT ›', page < maxPage, () => {
      this.achievementPage = page + 1;
      this.refresh();
    });
  }

  private addPageButton(x: number, y: number, label: string, enabled: boolean, callback: () => void): void {
    const rect = this.scene.add.rectangle(x, y, 118, 34, enabled ? 0x2a2e3a : 0x181a21, 1)
      .setStrokeStyle(2, enabled ? 0x666d7e : 0x30333d);
    const text = this.scene.add.text(x, y, label, {
      fontSize: '10px', color: enabled ? '#e7e4ec' : '#555965', fontStyle: 'bold',
    }).setOrigin(0.5);
    if (enabled) {
      rect.setInteractive({ useHandCursor: true });
      rect.on('pointerover', () => rect.setFillStyle(0x3a3f4d));
      rect.on('pointerout', () => rect.setFillStyle(0x2a2e3a));
      rect.on('pointerdown', () => pressPulse(this.scene, [rect, text]));
      rect.on('pointerup', callback);
    }
    this.content.add([rect, text]);
  }
}
