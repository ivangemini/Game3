import * as Phaser from 'phaser';
import { telemetry } from '../../analytics/Telemetry';
import { PROTOTYPE_HERO_MAP } from '../data/heroes';
import { PROTOTYPE_PERK_MAP } from '../data/perks';
import { weeklyAttemptsBucket, weeklyLateWorldFocusForConstraint, weeklyTierRank, type WeeklyBoardSnapshot, type WeeklyTier } from '../domain/weeklyChallenge';
import { resolveAuthoredTexture, uiArtKey } from './authoredArt';
import { dismissOverlay, pressPulse, revealOverlay } from './uiMotion';

const DEPTH = 1236;

export type WeeklyRunState = 'inactive' | 'active' | 'complete';

export interface WeeklyChallengeOverlayOptions {
  readonly getSnapshot: () => WeeklyBoardSnapshot;
  readonly getRunState: () => WeeklyRunState;
  readonly onStartOrResume: () => void;
  readonly reducedMotion: boolean;
}

export class WeeklyChallengeOverlay {
  private readonly root: Phaser.GameObjects.Container;
  private readonly content: Phaser.GameObjects.Container;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: WeeklyChallengeOverlayOptions,
  ) {
    this.root = scene.add.container(0, 0).setDepth(DEPTH).setVisible(false);
    this.content = scene.add.container(0, 0);
    this.root.add([
      scene.add.rectangle(800, 450, 1600, 900, 0x050609, 0.96).setInteractive(),
      scene.add.rectangle(806, 462, 1488, 810, 0x050609, 0.7),
      scene.add.rectangle(800, 454, 1480, 802, 0x11151b, 1).setStrokeStyle(4, 0x7b5b2d),
      scene.add.rectangle(800, 454, 1458, 780, 0x17191f, 0.9).setStrokeStyle(2, 0x3d382e),
      this.content,
    ]);
    const escape = (): void => this.hide();
    scene.input.keyboard?.on('keydown-ESC', escape);
    scene.events.once('shutdown', () => scene.input.keyboard?.off('keydown-ESC', escape));
  }

  show(): void {
    const snapshot = this.options.getSnapshot();
    telemetry.track('weekly_board_opened', {
      bestTier: snapshot.bestTier,
      attemptsBucket: weeklyAttemptsBucket(snapshot.attempts),
    });
    this.refresh();
    revealOverlay(this.scene, this.root, this.content);
  }

  hide(): void {
    if (this.root.visible) dismissOverlay(this.scene, this.root, this.content);
  }

  isVisible(): boolean { return this.root.visible; }

  refresh(): void {
    this.content.removeAll(true);
    const snapshot = this.options.getSnapshot();
    this.drawHeader(snapshot);
    this.drawConstraint(snapshot);
    this.drawTiers(snapshot);
    this.drawHistory(snapshot);
    this.drawAction(snapshot);
  }

  private drawHeader(snapshot: WeeklyBoardSnapshot): void {
    this.addIcon('mastery', 112, 92, 58);
    this.content.add(this.scene.add.text(154, 62, 'WEEKLY CHALLENGE', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '36px', color: '#f7f2e8',
      stroke: '#090a0d', strokeThickness: 7,
    }));
    this.content.add(this.scene.add.text(157, 111, `${snapshot.key} • ONE SEED • ONE FIXED LOADOUT • UNLIMITED RETRIES`, {
      fontSize: '11px', color: '#c1b7a3', fontStyle: 'bold',
    }));
    this.content.add(this.scene.add.text(1045, 68, `BEST ${snapshot.bestScore.toLocaleString()}`, {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '19px', color: '#ffd56e',
      stroke: '#17120b', strokeThickness: 4,
    }));
    this.content.add(this.scene.add.text(1046, 101, `${tierLabel(snapshot.bestTier)} • ${snapshot.attempts} ATTEMPT${snapshot.attempts === 1 ? '' : 'S'}`, {
      fontSize: '11px', color: tierColor(snapshot.bestTier), fontStyle: 'bold',
    }));

    const close = this.scene.add.rectangle(1450, 95, 116, 40, 0x2b2e3a, 1)
      .setStrokeStyle(2, 0x7f8496).setInteractive({ useHandCursor: true });
    const label = this.scene.add.text(1450, 95, 'CLOSE  ×', { fontSize: '13px', color: '#f7f2e8', fontStyle: 'bold' }).setOrigin(0.5);
    close.on('pointerover', () => close.setFillStyle(0x414655));
    close.on('pointerout', () => close.setFillStyle(0x2b2e3a));
    close.on('pointerdown', () => pressPulse(this.scene, [close, label], this.options.reducedMotion));
    close.on('pointerup', () => this.hide());
    this.content.add([close, label]);
  }

  private drawConstraint(snapshot: WeeklyBoardSnapshot): void {
    const c = snapshot.constraint;
    const hero = PROTOTYPE_HERO_MAP.get(c.heroId);
    const perk = PROTOTYPE_PERK_MAP.get(c.startingPerkId);
    const focus = weeklyLateWorldFocusForConstraint(c);
    const y = 160;
    this.content.add(this.scene.add.rectangle(800, y + 92, 1424, 184, 0x251f19, 1).setStrokeStyle(3, 0xffc768));
    this.content.add(this.scene.add.rectangle(800, y + 92, 1404, 164, 0x17191f, 0.86).setStrokeStyle(1, 0x5c4a2d));
    this.addIcon('daily', 148, y + 76, 84);
    this.content.add(this.scene.add.text(206, y + 22, 'FIXED WEEKLY LOADOUT', { fontSize: '11px', color: '#ffc768', fontStyle: 'bold' }));
    this.content.add(this.scene.add.text(206, y + 46, c.name.toUpperCase(), {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '24px', color: '#f7f2e8', stroke: '#111218', strokeThickness: 4,
    }));
    this.content.add(this.scene.add.text(206, y + 80, c.kicker, { fontSize: '11px', color: '#b5ff4d', fontStyle: 'bold' }));
    this.content.add(this.scene.add.text(206, y + 106, c.description, { fontSize: '11px', color: '#c9c4cf', wordWrap: { width: 670 } }));

    this.badge(1030, y + 62, 'HERO', (hero?.name ?? c.heroId).toUpperCase());
    this.badge(1266, y + 62, 'STARTING PERK', (perk?.name ?? c.startingPerkId).toUpperCase());
    this.content.add(this.scene.add.text(1010, y + 108, `WORLD ${focus.world} FOCUS • ${focus.name.toUpperCase()}`, {
      fontSize: '10px', color: focus.world === 5 ? '#ffb27a' : '#8ceeff', fontStyle: 'bold', wordWrap: { width: 430 },
    }));
    this.content.add(this.scene.add.text(1010, y + 130, focus.description, {
      fontSize: '9px', color: '#b5afaa', wordWrap: { width: 430 },
    }));
    this.content.add(this.scene.add.text(1010, y + 160, 'Same seed/loadout • no permanent combat bonus.', {
      fontSize: '9px', color: '#746f68',
    }));
  }

  private drawTiers(snapshot: WeeklyBoardSnapshot): void {
    const tiers: readonly { tier: Exclude<WeeklyTier, 'none'>; threshold: number; reward: string }[] = [
      { tier: 'bronze', threshold: snapshot.thresholds.bronze, reward: snapshot.rewards[0]?.name ?? 'Sticker' },
      { tier: 'silver', threshold: snapshot.thresholds.silver, reward: snapshot.rewards[1]?.name ?? 'Title' },
      { tier: 'gold', threshold: snapshot.thresholds.gold, reward: snapshot.rewards[2]?.name ?? 'Frame' },
      { tier: 'reality-broken', threshold: snapshot.thresholds.realityBroken, reward: snapshot.rewards[3]?.name ?? 'VFX' },
    ];
    this.content.add(this.scene.add.text(90, 376, 'PERSONAL SCORE TIERS', { fontSize: '13px', color: '#ffd56e', fontStyle: 'bold' }));
    this.content.add(this.scene.add.text(90, 398, 'Beat your own weekly best. No fake global leaderboard until real traffic justifies one.', { fontSize: '10px', color: '#8f949f' }));
    tiers.forEach((entry, index) => {
      const x = 88 + index * 356;
      const y = 430;
      const earned = weeklyTierRank(snapshot.bestTier) >= weeklyTierRank(entry.tier);
      const card = this.scene.add.rectangle(x + 168, y + 92, 336, 184, earned ? 0x272c20 : 0x1b1d24, 1)
        .setStrokeStyle(3, earned ? 0xb5ff4d : 0x565b68);
      this.content.add(card);
      this.content.add(this.scene.add.text(x + 20, y + 24, tierLabel(entry.tier), {
        fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '17px', color: earned ? '#efffd8' : '#b5bac5',
      }));
      this.content.add(this.scene.add.text(x + 20, y + 58, `${entry.threshold.toLocaleString()} SCORE`, {
        fontSize: '12px', color: earned ? '#ffd56e' : '#8f949f', fontStyle: 'bold',
      }));
      const current = Math.min(snapshot.bestScore, entry.threshold);
      const ratio = Math.max(0, Math.min(1, current / entry.threshold));
      const barX = x + 20;
      this.content.add(this.scene.add.rectangle(barX + 145, y + 92, 290, 8, 0x0e1015, 1).setStrokeStyle(1, 0x3b3f49));
      if (ratio > 0) this.content.add(this.scene.add.rectangle(barX, y + 92, Math.max(3, 290 * ratio), 6, earned ? 0xb5ff4d : 0xb884ee, 1).setOrigin(0, 0.5));
      this.content.add(this.scene.add.text(x + 20, y + 112, earned ? 'EARNED ✓' : `${current.toLocaleString()} / ${entry.threshold.toLocaleString()}`, {
        fontSize: '10px', color: earned ? '#b5ff4d' : '#9298a4', fontStyle: 'bold',
      }));
      this.content.add(this.scene.add.text(x + 20, y + 142, entry.reward.toUpperCase(), {
        fontSize: '9px', color: earned ? '#f4d78d' : '#707682', fontStyle: 'bold', wordWrap: { width: 290 },
      }));
    });
  }

  private drawHistory(snapshot: WeeklyBoardSnapshot): void {
    const y = 662;
    this.content.add(this.scene.add.text(90, y - 30, 'RECENT PERSONAL HISTORY', { fontSize: '12px', color: '#cfa8ff', fontStyle: 'bold' }));
    if (snapshot.recentHistory.length === 0) {
      this.content.add(this.scene.add.text(90, y, 'No previous weekly records yet. This week becomes the first line.', { fontSize: '10px', color: '#777d89' }));
      return;
    }
    snapshot.recentHistory.forEach((entry, index) => {
      const rowY = y + index * 28;
      this.content.add(this.scene.add.text(90, rowY, entry.key, { fontSize: '10px', color: '#aeb4c0', fontStyle: 'bold' }));
      this.content.add(this.scene.add.text(206, rowY, tierLabel(entry.bestTier), { fontSize: '10px', color: tierColor(entry.bestTier), fontStyle: 'bold' }));
      this.content.add(this.scene.add.text(368, rowY, `${entry.bestScore.toLocaleString()} SCORE`, { fontSize: '10px', color: '#d3ced8' }));
      this.content.add(this.scene.add.text(520, rowY, `${entry.attempts} TRY`, { fontSize: '10px', color: '#777d89' }));
    });
  }

  private drawAction(snapshot: WeeklyBoardSnapshot): void {
    const state = this.options.getRunState();
    const labelText = state === 'active' ? 'RESUME WEEKLY RUN' : state === 'complete' ? 'RETRY WEEKLY RUN' : 'START WEEKLY RUN';
    const sub = state === 'active'
      ? 'Your current weekly attempt is still alive.'
      : `Seed ${snapshot.seed} • fixed ${PROTOTYPE_HERO_MAP.get(snapshot.constraint.heroId)?.name ?? snapshot.constraint.heroId} loadout.`;
    const button = this.scene.add.rectangle(1248, 758, 360, 78, 0x4a3820, 1)
      .setStrokeStyle(3, 0xffc768).setInteractive({ useHandCursor: true });
    const label = this.scene.add.text(1248, 744, labelText, {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '16px', color: '#fff2d6',
    }).setOrigin(0.5);
    const detail = this.scene.add.text(1248, 773, sub, { fontSize: '9px', color: '#c8b898', align: 'center', wordWrap: { width: 320 } }).setOrigin(0.5);
    button.on('pointerover', () => button.setFillStyle(0x654a25));
    button.on('pointerout', () => button.setFillStyle(0x4a3820));
    button.on('pointerdown', () => pressPulse(this.scene, [button, label, detail], this.options.reducedMotion));
    button.on('pointerup', () => this.options.onStartOrResume());
    this.content.add([button, label, detail]);
  }

  private badge(x: number, y: number, kicker: string, value: string): void {
    this.content.add(this.scene.add.rectangle(x, y, 206, 72, 0x252832, 1).setStrokeStyle(2, 0x6a5b43));
    this.content.add(this.scene.add.text(x, y - 17, kicker, { fontSize: '8px', color: '#9d927d', fontStyle: 'bold' }).setOrigin(0.5));
    this.content.add(this.scene.add.text(x, y + 8, value, { fontSize: '10px', color: '#f0e5cf', fontStyle: 'bold', align: 'center', wordWrap: { width: 184 } }).setOrigin(0.5));
  }

  private addIcon(id: string, x: number, y: number, size: number): void {
    const texture = resolveAuthoredTexture(this.scene, uiArtKey(id));
    if (texture) this.content.add(this.scene.add.image(x, y, texture.textureKey, texture.frame).setDisplaySize(size, size));
    else this.content.add(this.scene.add.text(x, y, '★', { fontSize: `${Math.round(size * 0.5)}px`, color: '#ffd56e', fontStyle: 'bold' }).setOrigin(0.5));
  }
}

function tierLabel(tier: WeeklyTier): string {
  if (tier === 'reality-broken') return 'REALITY-BROKEN';
  return tier === 'none' ? 'UNRANKED' : tier.toUpperCase();
}

function tierColor(tier: WeeklyTier): string {
  if (tier === 'reality-broken') return '#ff91e6';
  if (tier === 'gold') return '#ffd56e';
  if (tier === 'silver') return '#d9e0ea';
  if (tier === 'bronze') return '#d8a064';
  return '#858b98';
}
