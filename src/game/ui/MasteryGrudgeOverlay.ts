import * as Phaser from 'phaser';
import { PROTOTYPE_HERO_MAP } from '../data/heroes';
import {
  bossMasteryChallengesForBoss,
  bossMasteryChallengeStarCount,
  normalizeBossMasteryChallengeIds,
} from '../domain/bossMasteryChallenges';
import { createBossGrudgeSnapshots, type BossHistoryState } from '../domain/bossGrudges';
import { createHeroMasterySnapshot, type HeroMasteryXpState } from '../domain/heroMastery';
import type { HeroId } from '../domain/heroes';
import { bossArtKeyForEnemyId, createAuthoredPortraitSlot, heroArtKey, resolveAuthoredTexture, uiArtKey } from './authoredArt';
import { dismissOverlay, pressPulse, revealOverlay } from './uiMotion';

const DEPTH = 1225;
const HERO_IDS: readonly HeroId[] = ['scavenger', 'engineer', 'alchemist', 'beastfriend'];
type Tab = 'heroes' | 'bosses';

export interface MasteryGrudgeOverlayOptions {
  readonly getHeroMasteryXp: () => HeroMasteryXpState;
  readonly getBossHistory: () => readonly BossHistoryState[];
  readonly getCompletedBossChallengeIds: () => readonly string[];
  readonly reducedMotion: boolean;
  readonly onOpenArchiveTrophies?: () => void;
}

export class MasteryGrudgeOverlay {
  private readonly root: Phaser.GameObjects.Container;
  private readonly content: Phaser.GameObjects.Container;
  private tab: Tab = 'heroes';

  constructor(private readonly scene: Phaser.Scene, private readonly options: MasteryGrudgeOverlayOptions) {
    this.root = scene.add.container(0, 0).setDepth(DEPTH).setVisible(false);
    this.content = scene.add.container(0, 0);
    this.root.add([
      scene.add.rectangle(800, 450, 1600, 900, 0x050609, 0.96).setInteractive(),
      scene.add.rectangle(807, 461, 1488, 810, 0x050609, 0.72),
      scene.add.rectangle(800, 454, 1480, 802, 0x11151b, 1).setStrokeStyle(4, 0x655075),
      scene.add.rectangle(800, 454, 1458, 780, 0x17191f, 0.9).setStrokeStyle(2, 0x34303b),
      this.content,
    ]);
    const escape = (): void => this.hide();
    scene.input.keyboard?.on('keydown-ESC', escape);
    scene.events.once('shutdown', () => scene.input.keyboard?.off('keydown-ESC', escape));
  }

  show(tab: Tab = this.tab): void { this.tab = tab; this.refresh(); revealOverlay(this.scene, this.root, this.content); }
  hide(): void { if (this.root.visible) dismissOverlay(this.scene, this.root, this.content); }
  isVisible(): boolean { return this.root.visible; }

  refresh(): void {
    this.content.removeAll(true);
    this.drawHeader();
    if (this.tab === 'heroes') this.drawHeroes();
    else this.drawBosses();
  }

  private drawHeader(): void {
    this.content.add(this.scene.add.text(92, 65, 'MASTERY & GRUDGES', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '34px', color: '#f7f2e8', stroke: '#090a0d', strokeThickness: 7,
    }));
    this.content.add(this.scene.add.text(94, 108, 'LONG-TERM GOALS • COUNTERPLAY STARS • COSMETIC REWARDS • NO PERMANENT COMBAT STATS', {
      fontSize: '11px', color: '#aaa5b2', fontStyle: 'bold',
    }));
    this.addTab(98, 'HERO MASTERY', 'heroes');
    this.addTab(326, 'BOSS MASTERY', 'bosses');
    if (this.options.onOpenArchiveTrophies) this.addArchiveButton(554);
    const close = this.scene.add.rectangle(1450, 93, 116, 40, 0x2b2e3a, 1).setStrokeStyle(2, 0x7f8496).setInteractive({ useHandCursor: true });
    const label = this.scene.add.text(1450, 93, 'CLOSE  ×', { fontSize: '13px', color: '#f7f2e8', fontStyle: 'bold' }).setOrigin(0.5);
    close.on('pointerover', () => close.setFillStyle(0x414655));
    close.on('pointerout', () => close.setFillStyle(0x2b2e3a));
    close.on('pointerdown', () => pressPulse(this.scene, [close, label], this.options.reducedMotion));
    close.on('pointerup', () => this.hide());
    this.content.add([close, label]);
  }

  private addTab(x: number, label: string, tab: Tab): void {
    const active = this.tab === tab;
    const rect = this.scene.add.rectangle(x + 106, 151, 212, 38, active ? 0x48304f : 0x252832, 1)
      .setStrokeStyle(2, active ? 0xff91e6 : 0x555a68).setInteractive({ useHandCursor: true });
    const text = this.scene.add.text(x + 118, 151, label, { fontSize: '10px', color: active ? '#ffe7fb' : '#a9aeba', fontStyle: 'bold' }).setOrigin(0.5);
    const iconId = tab === 'heroes' ? 'mastery' : 'grudge';
    const texture = resolveAuthoredTexture(this.scene, uiArtKey(iconId));
    const icon = texture
      ? this.scene.add.image(x + 28, 151, texture.textureKey, texture.frame).setDisplaySize(26, 26)
      : this.scene.add.text(x + 28, 151, tab === 'heroes' ? '★' : '!', {
        fontSize: '16px', color: active ? '#ffd56e' : '#9ca1ad', fontStyle: 'bold',
      }).setOrigin(0.5);
    rect.on('pointerdown', () => pressPulse(this.scene, [rect, text, icon], this.options.reducedMotion));
    rect.on('pointerup', () => { this.tab = tab; this.refresh(); });
    this.content.add([rect, text, icon]);
  }

  private addArchiveButton(x: number): void {
    const rect = this.scene.add.rectangle(x + 110, 151, 220, 38, 0x202832, 1)
      .setStrokeStyle(2, 0x65707d).setInteractive({ useHandCursor: true });
    const text = this.scene.add.text(x + 110, 151, 'ARCHIVE TROPHIES ›', {
      fontSize: '10px', color: '#b9c7d3', fontStyle: 'bold',
    }).setOrigin(0.5);
    rect.on('pointerover', () => rect.setFillStyle(0x2d3742));
    rect.on('pointerout', () => rect.setFillStyle(0x202832));
    rect.on('pointerdown', () => pressPulse(this.scene, [rect, text], this.options.reducedMotion));
    rect.on('pointerup', () => this.options.onOpenArchiveTrophies?.());
    this.content.add([rect, text]);
  }

  private drawHeroes(): void {
    const state = this.options.getHeroMasteryXp();
    HERO_IDS.forEach((heroId, index) => {
      const snapshot = createHeroMasterySnapshot(heroId, state);
      const x = 92 + (index % 2) * 718;
      const y = 202 + Math.floor(index / 2) * 298;
      const hero = PROTOTYPE_HERO_MAP.get(heroId);
      this.content.add(this.scene.add.rectangle(x + 337, y + 130, 674, 260, 0x1b1d24, 1)
        .setStrokeStyle(3, snapshot.level >= 20 ? 0xffd56e : 0x6d5478));
      const portrait = createAuthoredPortraitSlot(this.scene, heroArtKey(heroId), x + 92, y + 125, 144, 178, DEPTH + 2);
      this.content.add(portrait);
      this.content.add(this.scene.add.text(x + 184, y + 44, (hero?.name ?? heroId).toUpperCase(), {
        fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '21px', color: '#f7f2e8', stroke: '#111218', strokeThickness: 4,
      }));
      this.content.add(this.scene.add.text(x + 184, y + 80, `MASTERY LEVEL ${snapshot.level}/20`, {
        fontSize: '12px', color: snapshot.level >= 20 ? '#ffd56e' : '#b5ff4d', fontStyle: 'bold',
      }));
      const nextXp = snapshot.nextLevelXp === null ? 'MAXIMUM MASTERY' : `NEXT LEVEL ${snapshot.nextLevelXp} XP`;
      this.content.add(this.scene.add.text(x + 184, y + 106, `${snapshot.xp} XP • ${nextXp}`, { fontSize: '10px', color: '#aeb4c0', fontStyle: 'bold' }));
      this.addBar(x + 184, y + 134, 442, snapshot.levelProgress, snapshot.level >= 20 ? 0xffd56e : 0xb884ee);
      const next = snapshot.nextReward;
      this.content.add(this.scene.add.text(x + 184, y + 160, 'NEXT COSMETIC', { fontSize: '9px', color: '#ff91e6', fontStyle: 'bold' }));
      this.content.add(this.scene.add.text(x + 184, y + 182,
        next ? `LV ${next.level} • ${next.name.toUpperCase()} • ${next.kind.toUpperCase()}` : 'ALL MASTERY COSMETICS UNLOCKED',
        { fontSize: '11px', color: next ? '#f3d9ff' : '#ffd56e', fontStyle: 'bold', wordWrap: { width: 432 } },
      ));
      this.content.add(this.scene.add.text(x + 184, y + 216, `UNLOCKED ${snapshot.unlockedRewards.length}/7`, { fontSize: '9px', color: '#858b98' }));
    });
  }

  private drawBosses(): void {
    const completed = new Set(normalizeBossMasteryChallengeIds(this.options.getCompletedBossChallengeIds()));
    createBossGrudgeSnapshots(this.options.getBossHistory()).forEach((boss, index) => {
      const x = 92 + (index % 3) * 475;
      const y = 202 + Math.floor(index / 3) * 300;
      const revenge = boss.revengePending;
      const counterplayStars = bossMasteryChallengeStarCount([...completed], boss.bossId);
      const challenges = bossMasteryChallengesForBoss(boss.bossId);
      const nextChallenge = challenges.find((challenge) => !completed.has(challenge.id));
      const stroke = revenge ? 0xff6f61 : counterplayStars >= 3 ? 0xffd56e : boss.masteryTier >= 3 ? 0xd494ff : 0x5f6472;
      const card = this.scene.add.rectangle(x + 220, y + 130, 440, 260, revenge ? 0x2c1d23 : 0x1b1d24, 1).setStrokeStyle(revenge ? 4 : 3, stroke);
      this.content.add(card);
      const key = bossArtKeyForEnemyId(boss.bossId);
      if (key) this.content.add(createAuthoredPortraitSlot(this.scene, key, x + 84, y + 92, 126, 126, DEPTH + 2));
      this.content.add(this.scene.add.text(x + 160, y + 36, displayName(boss.bossId), {
        fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '16px', color: '#f7f2e8', stroke: '#111218', strokeThickness: 3,
      }));
      this.content.add(this.scene.add.text(x + 160, y + 68, `W ${boss.wins} • L ${boss.losses} • STREAK ${boss.currentWinStreak} / ${boss.bestWinStreak}`, {
        fontSize: '9px', color: '#aeb4c0', fontStyle: 'bold',
      }));
      this.content.add(this.scene.add.text(x + 160, y + 94,
        boss.fastestVictoryMs === null ? 'FASTEST • —' : `FASTEST • ${formatDuration(boss.fastestVictoryMs)}`,
        { fontSize: '9px', color: '#8ceeff', fontStyle: 'bold' },
      ));
      const recordStars = stars(boss.masteryTier);
      const counterStars = stars(counterplayStars);
      this.content.add(this.scene.add.text(x + 25, y + 147, `BOSS RECORD      ${recordStars}`, {
        fontSize: '10px', color: boss.masteryTier >= 3 ? '#d9b4ff' : '#b995d0', fontStyle: 'bold',
      }));
      this.content.add(this.scene.add.text(x + 25, y + 171, `COUNTERPLAY   ${counterStars}`, {
        fontSize: '12px', color: counterplayStars >= 3 ? '#ffd56e' : '#ffcf69', fontStyle: 'bold',
      }));
      const nextText = nextChallenge
        ? `NEXT ★${nextChallenge.star} ${nextChallenge.name.toUpperCase()} — ${nextChallenge.description}`
        : 'ALL 3 COUNTERPLAY CHALLENGES CLEARED';
      this.content.add(this.scene.add.text(x + 25, y + 198, nextText, {
        fontSize: '8px', color: nextChallenge ? '#aeb4c0' : '#ffd56e', fontStyle: 'bold', wordWrap: { width: 385 }, lineSpacing: 2,
      }));
      if (revenge) this.addRevengePulse(x + 335, y + 236);
    });
  }

  private addRevengePulse(x: number, y: number): void {
    const plate = this.scene.add.rectangle(x, y, 165, 28, 0x542630, 1).setStrokeStyle(2, 0xff6f61);
    const text = this.scene.add.text(x, y, 'REVENGE ACTIVE', { fontSize: '9px', color: '#ffd8d0', fontStyle: 'bold' }).setOrigin(0.5);
    this.content.add([plate, text]);
    if (!this.options.reducedMotion) this.scene.tweens.add({ targets: [plate, text], alpha: { from: 0.72, to: 1 }, yoyo: true, repeat: -1, duration: 620, ease: 'Sine.InOut' });
  }

  private addBar(x: number, y: number, width: number, ratio: number, color: number): void {
    const safe = Math.max(0, Math.min(1, ratio));
    this.content.add(this.scene.add.rectangle(x + width / 2, y, width, 8, 0x0c0e13, 1).setStrokeStyle(1, 0x343844));
    if (safe > 0) this.content.add(this.scene.add.rectangle(x, y, Math.max(3, width * safe), 6, color, 1).setOrigin(0, 0.5));
  }
}

function stars(count: number): string { return '★'.repeat(Math.max(0, Math.min(3, count))) + '☆'.repeat(Math.max(0, 3 - count)); }
function displayName(id: string): string { return id.split('-').map((part) => part[0]!.toUpperCase() + part.slice(1)).join(' '); }
function formatDuration(ms: number): string {
  const seconds = Math.max(0, ms) / 1000;
  return seconds < 60 ? `${seconds.toFixed(1)}s` : `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
}
