import * as Phaser from 'phaser';
import { telemetry } from '../../analytics/Telemetry';
import {
  streakBucket,
  type DailyBoardSnapshot,
  type DailyContractProgressSnapshot,
  type DailyTrackRewardSnapshot,
} from '../domain/dailyRetention';
import { resolveAuthoredTexture, uiArtKey } from './authoredArt';
import { dismissOverlay, pressPulse, revealOverlay } from './uiMotion';

const DEPTH = 1230;

export interface DailyBoardOverlayOptions {
  readonly getSnapshot: () => DailyBoardSnapshot;
  readonly onClaimContract: (contractId: string) => boolean;
  readonly onClaimTrackReward: (rewardId: string) => boolean;
  readonly reducedMotion: boolean;
}

export class DailyBoardOverlay {
  private readonly root: Phaser.GameObjects.Container;
  private readonly content: Phaser.GameObjects.Container;
  private readonly reportedCompletedIds = new Set<string>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: DailyBoardOverlayOptions,
  ) {
    this.root = scene.add.container(0, 0).setDepth(DEPTH).setVisible(false);
    this.content = scene.add.container(0, 0);
    const blocker = scene.add.rectangle(800, 450, 1600, 900, 0x050609, 0.96)
      .setInteractive({ useHandCursor: false });
    const shadow = scene.add.rectangle(806, 462, 1488, 810, 0x050609, 0.7);
    const panel = scene.add.rectangle(800, 454, 1480, 802, 0x11151b, 1)
      .setStrokeStyle(4, 0x6f4b78, 1);
    const inner = scene.add.rectangle(800, 454, 1458, 780, 0x17191f, 0.9)
      .setStrokeStyle(2, 0x34303b, 1);
    this.root.add([blocker, shadow, panel, inner, this.content]);

    const escape = (): void => this.hide();
    scene.input.keyboard?.on('keydown-ESC', escape);
    scene.events.once('shutdown', () => scene.input.keyboard?.off('keydown-ESC', escape));
  }

  show(): void {
    const snapshot = this.options.getSnapshot();
    telemetry.track('daily_board_opened', {
      ruleId: snapshot.rule.id,
      streakBucket: streakBucket(snapshot.streakCount),
    });
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

  refresh(): void {
    this.content.removeAll(true);
    const snapshot = this.options.getSnapshot();
    this.reportCompletions(snapshot);
    this.drawHeader(snapshot);
    this.drawRealityRule(snapshot);
    snapshot.contracts.forEach((contract, index) => this.drawContract(contract, index));
    this.drawTrack(snapshot);
    this.drawUnclaimedRewards(snapshot);
  }

  private reportCompletions(snapshot: DailyBoardSnapshot): void {
    for (const contract of snapshot.contracts) {
      if (!contract.completed || this.reportedCompletedIds.has(contract.id)) continue;
      this.reportedCompletedIds.add(contract.id);
      telemetry.track('daily_contract_completed', {
        archetype: contract.archetype,
        target: contract.target,
      });
    }
  }

  private drawHeader(snapshot: DailyBoardSnapshot): void {
    this.addArtIcon('contract', 112, 92, 58);
    this.content.add(this.scene.add.text(155, 66, 'DAILY BOARD', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '36px', color: '#f7f2e8',
      stroke: '#090a0d', strokeThickness: 7,
    }));
    this.content.add(this.scene.add.text(158, 112, `UTC ${snapshot.key} • ONE RUN, THREE BAD IDEAS`, {
      fontSize: '12px', color: '#b9b2c2', fontStyle: 'bold',
    }));

    this.addArtIcon('stamp', 1032, 93, 48);
    this.content.add(this.scene.add.text(1065, 72, `${snapshot.realityStamps} REALITY STAMPS`, {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '18px', color: '#ffd56e',
      stroke: '#181018', strokeThickness: 4,
    }));
    this.content.add(this.scene.add.text(1067, 101, `STREAK ${snapshot.streakCount} • TRACK DAY ${snapshot.rewardTrackDay}/7`, {
      fontSize: '12px', color: '#b5ff4d', fontStyle: 'bold',
    }));

    const close = this.scene.add.rectangle(1450, 95, 116, 40, 0x2b2e3a, 1)
      .setStrokeStyle(2, 0x7f8496)
      .setInteractive({ useHandCursor: true });
    const label = this.scene.add.text(1450, 95, 'CLOSE  ×', {
      fontSize: '13px', color: '#f7f2e8', fontStyle: 'bold',
    }).setOrigin(0.5);
    close.on('pointerover', () => close.setFillStyle(0x414655));
    close.on('pointerout', () => close.setFillStyle(0x2b2e3a));
    close.on('pointerdown', () => pressPulse(this.scene, [close, label], this.options.reducedMotion));
    close.on('pointerup', () => this.hide());
    this.content.add([close, label]);
  }

  private drawRealityRule(snapshot: DailyBoardSnapshot): void {
    const rule = snapshot.rule;
    const x = 88;
    const y = 160;
    const card = this.scene.add.rectangle(800, y + 92, 1424, 184, 0x24202b, 1)
      .setStrokeStyle(3, 0xff91e6);
    const seam = this.scene.add.rectangle(800, y + 92, 1404, 164, 0x16191f, 0.82)
      .setStrokeStyle(1, 0x56445e);
    this.content.add([card, seam]);

    this.addArtIcon('daily', x + 60, y + 66, 78);
    this.content.add(this.scene.add.text(x + 116, y + 22, 'REALITY RULE OF THE DAY', {
      fontSize: '11px', color: '#ff91e6', fontStyle: 'bold',
    }));
    this.content.add(this.scene.add.text(x + 116, y + 44, rule.name.toUpperCase(), {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '25px', color: '#f7f2e8',
      stroke: '#111218', strokeThickness: 4,
    }));
    this.content.add(this.scene.add.text(x + 116, y + 78, rule.kicker, {
      fontSize: '12px', color: '#b5ff4d', fontStyle: 'bold',
    }));
    this.content.add(this.scene.add.text(x + 116, y + 103, rule.description, {
      fontSize: '11px', color: '#c9c4cf', wordWrap: { width: 655 },
    }));

    const badges = ruleBadges(snapshot);
    badges.forEach((badge, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const bx = 930 + col * 170;
      const by = y + 55 + row * 54;
      const plate = this.scene.add.rectangle(bx, by, 154, 40, badge.fill, 1)
        .setStrokeStyle(2, badge.stroke);
      const text = this.scene.add.text(bx, by, badge.text, {
        fontSize: '10px', color: badge.color, fontStyle: 'bold', align: 'center',
      }).setOrigin(0.5);
      this.content.add([plate, text]);
    });
  }

  private drawContract(contract: DailyContractProgressSnapshot, index: number): void {
    const x = 88 + index * 474;
    const y = 382;
    const width = 448;
    const completed = contract.completed;
    const claimed = contract.claimed;
    const fill = claimed ? 0x203020 : completed ? 0x2b2630 : 0x1b1d24;
    const stroke = claimed ? 0x82c755 : completed ? 0xff91e6 : 0x4a4e5a;
    const card = this.scene.add.rectangle(x + width / 2, y + 118, width, 236, fill, 1)
      .setStrokeStyle(3, stroke);
    const topTape = this.scene.add.rectangle(x + width / 2, y + 7, 124, 16, 0x9d7a51, 0.45).setAngle(index === 1 ? 1.5 : -1.5);
    this.content.add([card, topTape]);

    this.addArtIcon('contract', x + 42, y + 48, 48);
    this.content.add(this.scene.add.text(x + 76, y + 25, `CONTRACT ${index + 1} • ${contract.archetype.toUpperCase()}`, {
      fontSize: '10px', color: '#a9afbb', fontStyle: 'bold',
    }));
    this.content.add(this.scene.add.text(x + 76, y + 48, contract.title, {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '16px', color: '#f7f2e8',
      stroke: '#101116', strokeThickness: 3,
    }).setOrigin(0, 0.5));
    this.content.add(this.scene.add.text(x + 22, y + 80, contract.description, {
      fontSize: '11px', color: '#bfc3cc', wordWrap: { width: width - 44 },
    }));

    const ratio = Math.max(0, Math.min(1, contract.current / Math.max(1, contract.target)));
    const barX = x + 22;
    const barY = y + 145;
    const barWidth = width - 44;
    const track = this.scene.add.rectangle(barX + barWidth / 2, barY, barWidth, 9, 0x0e1015, 1)
      .setStrokeStyle(1, 0x3b3f49);
    this.content.add(track);
    if (ratio > 0) {
      const fillBar = this.scene.add.rectangle(barX, barY, Math.max(3, barWidth * ratio), 7, completed ? 0xb5ff4d : 0xb884ee, 1)
        .setOrigin(0, 0.5);
      this.content.add(fillBar);
    }
    this.content.add(this.scene.add.text(barX, barY + 14, `${contract.current} / ${contract.target}`, {
      fontSize: '10px', color: completed ? '#dfffba' : '#9298a4', fontStyle: 'bold',
    }));

    if (claimed) {
      this.content.add(this.scene.add.text(x + width - 22, y + 198, 'CLAIMED  ✓', {
        fontSize: '12px', color: '#b5ff4d', fontStyle: 'bold',
      }).setOrigin(1, 0.5));
      return;
    }
    if (!completed) {
      this.content.add(this.scene.add.text(x + width - 22, y + 198, 'IN PROGRESS', {
        fontSize: '11px', color: '#858b98', fontStyle: 'bold',
      }).setOrigin(1, 0.5));
      return;
    }

    const button = this.scene.add.rectangle(x + width - 94, y + 198, 144, 42, 0x3c2b43, 1)
      .setStrokeStyle(2, 0xff91e6)
      .setInteractive({ useHandCursor: true });
    const label = this.scene.add.text(x + width - 94, y + 198, 'CLAIM  +1 ★', {
      fontSize: '11px', color: '#ffe7fb', fontStyle: 'bold',
    }).setOrigin(0.5);
    button.on('pointerover', () => button.setFillStyle(0x59365e));
    button.on('pointerout', () => button.setFillStyle(0x3c2b43));
    button.on('pointerdown', () => pressPulse(this.scene, [button, label], this.options.reducedMotion));
    button.on('pointerup', () => {
      if (!this.options.onClaimContract(contract.id)) return;
      const after = this.options.getSnapshot();
      telemetry.track('daily_contract_claimed', {
        archetype: contract.archetype,
        streakBucket: streakBucket(after.streakCount),
        rewardTrackDay: after.rewardTrackDay,
      });
      this.refresh();
      this.celebrate('CONTRACT STAMPED', '+1 REALITY STAMP');
    });
    this.content.add([button, label]);
  }

  private drawTrack(snapshot: DailyBoardSnapshot): void {
    const y = 690;
    this.content.add(this.scene.add.text(90, y - 44, '7-DAY MOMENTUM TRACK', {
      fontSize: '13px', color: '#ffd56e', fontStyle: 'bold',
    }));
    this.content.add(this.scene.add.text(90, y - 22,
      'Complete and claim at least one contract per UTC day. Missed days reduce momentum instead of deleting the whole streak.',
      { fontSize: '10px', color: '#9298a4' },
    ));

    for (let day = 1; day <= 7; day += 1) {
      const x = 138 + (day - 1) * 151;
      const reached = day <= snapshot.rewardTrackDay;
      const milestone = day === 3 || day === 5 || day === 7;
      const circle = this.scene.add.circle(x, y + 34, milestone ? 28 : 22, reached ? 0x41532a : 0x20232b, 1)
        .setStrokeStyle(milestone ? 4 : 2, reached ? 0xb5ff4d : 0x565b68);
      const number = this.scene.add.text(x, y + 34, String(day), {
        fontFamily: 'Arial Black, Impact, sans-serif', fontSize: milestone ? '17px' : '14px',
        color: reached ? '#efffd8' : '#858b97',
      }).setOrigin(0.5);
      this.content.add([circle, number]);
      if (day < 7) {
        const link = this.scene.add.rectangle(x + 75, y + 34, 95, 5, reached && day < snapshot.rewardTrackDay ? 0x86b84d : 0x3a3e48, 1);
        this.content.add(link);
      }
      if (milestone) {
        const reward = day === 3 ? '+2 ★' : day === 5 ? '+3 ★' : '+5 ★';
        this.content.add(this.scene.add.text(x, y + 69, reward, {
          fontSize: '10px', color: reached ? '#ffd56e' : '#6f7480', fontStyle: 'bold',
        }).setOrigin(0.5));
      }
    }
  }

  private drawUnclaimedRewards(snapshot: DailyBoardSnapshot): void {
    const pending = snapshot.trackRewards.filter((reward) => !reward.claimed).slice(0, 3);
    if (pending.length === 0) {
      this.content.add(this.scene.add.text(1120, 826, 'NEXT TRACK BONUSES • DAY 3 / 5 / 7', {
        fontSize: '10px', color: '#777d89', fontStyle: 'bold',
      }));
      return;
    }
    this.content.add(this.scene.add.text(1030, 798, 'UNCLAIMED TRACK BONUS', {
      fontSize: '10px', color: '#ff91e6', fontStyle: 'bold',
    }));
    pending.forEach((reward, index) => this.drawTrackClaim(reward, 1092 + index * 158, 836));
  }

  private drawTrackClaim(reward: DailyTrackRewardSnapshot, x: number, y: number): void {
    const button = this.scene.add.rectangle(x, y, 146, 42, 0x3c2b43, 1)
      .setStrokeStyle(2, 0xff91e6)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add.text(x, y, `DAY ${reward.milestone} • +${reward.stampReward} ★`, {
      fontSize: '10px', color: '#ffe7fb', fontStyle: 'bold',
    }).setOrigin(0.5);
    button.on('pointerover', () => button.setFillStyle(0x59365e));
    button.on('pointerout', () => button.setFillStyle(0x3c2b43));
    button.on('pointerdown', () => pressPulse(this.scene, [button, text], this.options.reducedMotion));
    button.on('pointerup', () => {
      if (!this.options.onClaimTrackReward(reward.id)) return;
      telemetry.track('daily_track_claimed', {
        milestone: reward.milestone,
        cycle: reward.cycle,
        stampReward: reward.stampReward,
      });
      this.refresh();
      this.celebrate('MOMENTUM BONUS', `+${reward.stampReward} REALITY STAMPS`);
    });
    this.content.add([button, text]);
  }

  private celebrate(title: string, subtitle: string): void {
    const burst = this.scene.add.container(800, 445).setDepth(DEPTH + 10);
    const halo = this.scene.add.circle(0, 0, 108, 0xff91e6, 0.18).setStrokeStyle(5, 0xb5ff4d, 0.9);
    const plate = this.scene.add.rectangle(0, 0, 420, 154, 0x17131c, 0.97).setStrokeStyle(4, 0xff91e6);
    const texture = resolveAuthoredTexture(this.scene, uiArtKey('stamp'));
    const icon = texture
      ? this.scene.add.image(-142, 0, texture.textureKey, texture.frame).setDisplaySize(82, 82)
      : this.scene.add.text(-142, 0, '★', { fontSize: '56px', color: '#ffd56e' }).setOrigin(0.5);
    const heading = this.scene.add.text(-82, -27, title, {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '22px', color: '#f7f2e8',
      stroke: '#0b0c10', strokeThickness: 5,
    });
    const detail = this.scene.add.text(-82, 13, subtitle, {
      fontSize: '13px', color: '#b5ff4d', fontStyle: 'bold',
    });
    burst.add([halo, plate, icon, heading, detail]);

    if (this.options.reducedMotion) {
      this.scene.time.delayedCall(420, () => burst.destroy(true));
      return;
    }
    burst.setScale(0.82).setAlpha(0);
    this.scene.tweens.add({
      targets: burst, scaleX: 1, scaleY: 1, alpha: 1, duration: 190, ease: 'Back.Out',
      onComplete: () => this.scene.time.delayedCall(430, () => {
        this.scene.tweens.add({
          targets: burst, scaleX: 1.06, scaleY: 1.06, alpha: 0, duration: 180, ease: 'Quad.In',
          onComplete: () => burst.destroy(true),
        });
      }),
    });
    this.scene.tweens.add({ targets: halo, scaleX: 1.35, scaleY: 1.35, alpha: 0, duration: 360, ease: 'Cubic.Out' });
  }

  private addArtIcon(id: string, x: number, y: number, size: number): void {
    const texture = resolveAuthoredTexture(this.scene, uiArtKey(id));
    if (!texture) {
      this.content.add(this.scene.add.circle(x, y, size / 2, 0x332a3c, 1).setStrokeStyle(2, 0x8e6b9d));
      return;
    }
    const image = this.scene.add.image(x, y, texture.textureKey, texture.frame).setDisplaySize(size, size);
    this.content.add(image);
  }
}

function ruleBadges(snapshot: DailyBoardSnapshot): readonly Readonly<{
  text: string;
  fill: number;
  stroke: number;
  color: string;
}>[] {
  const rule = snapshot.rule;
  const start = rule.startingCoinsDelta === 0 ? 'START • NORMAL' : `START ${signed(rule.startingCoinsDelta)} SCRAP`;
  const pocket = rule.bonusPocketUnlocks > 0 ? `POCKET +${rule.bonusPocketUnlocks}` : 'POCKET • NORMAL';
  return [
    badge(start, 0x2b2b32, 0x777d8b, '#e8e4ed'),
    badge(`REROLL • ${rule.rerollCost}`, 0x33253c, 0xb884ee, '#f1dcff'),
    badge(`PERK CHOICES • ${rule.perkChoiceCount}`, 0x2d3039, 0x7c8290, '#e8e4ed'),
    badge(pocket, 0x263224, 0x8fbd59, '#dcffc0'),
    badge(`ENEMY HP ${signed(rule.enemyHpPct)}%`, 0x352328, 0xa35f70, '#ffd7df'),
    badge(`REWARDS ${signed(rule.rewardPct)}%`, 0x3b3020, 0xd6a547, '#ffe4a6'),
  ];
}

function badge(text: string, fill: number, stroke: number, color: string) {
  return { text, fill, stroke, color } as const;
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
