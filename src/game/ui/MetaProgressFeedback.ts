import * as Phaser from 'phaser';
import { telemetry } from '../../analytics/Telemetry';
import { PROTOTYPE_HEROES } from '../data/heroes';
import { BOSS_MASTERY_CHALLENGES, type BossMasteryChallengeId, type BossMasteryStar } from '../domain/bossMasteryChallenges';
import { BOSS_FAMILY_IDS, type BossFamilyId } from '../domain/bossGrudges';
import { HERO_MASTERY_REWARDS } from '../domain/heroMastery';
import { resolveAuthoredTexture, uiArtKey } from './authoredArt';

const DEPTH = 946;

export class MetaProgressFeedback {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly reducedMotion: boolean,
  ) {}

  masteryLevel(heroName: string, level: number, rewardName?: string): void {
    const detail = rewardName
      ? `LV ${level} • ${rewardName.toUpperCase()}`
      : `${heroName.toUpperCase()} • MASTERY LV ${level}`;
    this.reveal('MASTERY UNLOCKED', detail, 0xd99cff, 'mastery');

    const hero = PROTOTYPE_HEROES.find((entry) => entry.name === heroName);
    if (hero && level >= 2 && level <= 20) {
      telemetry.track('hero_mastery_level_up', {
        heroId: hero.id,
        level,
        rewardCount: HERO_MASTERY_REWARDS.filter((reward) => reward.heroId === hero.id && reward.level <= level).length,
      });
    }
  }

  grudge(bossName: string, resolved: boolean): void {
    this.reveal(
      resolved ? 'REVENGE COMPLETE' : 'GRUDGE MARKED',
      bossName.toUpperCase(),
      resolved ? 0xffd56e : 0xff6f61,
      'grudge',
    );

    const bossId = BOSS_FAMILY_IDS.find((id) => displayBossName(id) === bossName);
    if (bossId) telemetry.track('boss_grudge_changed', { bossId, state: resolved ? 'resolved' : 'started' });
  }

  bossChallenge(bossName: string, bossId: BossFamilyId, challengeId: BossMasteryChallengeId, star: BossMasteryStar): void {
    const challenge = BOSS_MASTERY_CHALLENGES.find((entry) => entry.id === challengeId && entry.bossId === bossId && entry.star === star);
    if (!challenge) return;
    this.reveal(
      'COUNTERPLAY MASTERED',
      `${bossName.toUpperCase()} • ★${star} ${challenge.name.toUpperCase()}`,
      0xffd56e,
      'mastery',
    );
    telemetry.track('boss_mastery_challenge_completed', { bossId, challengeId, star });
  }

  private reveal(kicker: string, detail: string, color: number, iconId: 'mastery' | 'grudge'): void {
    const root = this.scene.add.container(800, 618).setDepth(DEPTH);
    const shadow = this.scene.add.rectangle(5, 6, 410, 82, 0x050609, 0.75);
    const plate = this.scene.add.rectangle(0, 0, 410, 82, 0x171820, 0.98).setStrokeStyle(3, color, 0.95);
    const iconPlate = this.scene.add.circle(-166, 0, 27, 0x24212b, 1).setStrokeStyle(2, color, 0.75);
    const kickerText = this.scene.add.text(-126, -19, kicker, {
      fontSize: '10px', color: this.toHex(color), fontStyle: 'bold', letterSpacing: 1,
      stroke: '#090a0d', strokeThickness: 3,
    }).setOrigin(0, 0.5);
    const detailText = this.scene.add.text(-126, 12, detail, {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '17px', color: '#fff8ef',
      stroke: '#090a0d', strokeThickness: 4,
    }).setOrigin(0, 0.5);
    root.add([shadow, plate, iconPlate, kickerText, detailText]);

    const texture = resolveAuthoredTexture(this.scene, uiArtKey(iconId));
    if (texture) {
      root.add(this.scene.add.image(-166, 0, texture.textureKey, texture.frame).setDisplaySize(48, 48));
    } else {
      root.add(this.scene.add.text(-166, 0, iconId === 'mastery' ? '★' : '!', {
        fontSize: '24px', color: this.toHex(color), fontStyle: 'bold',
      }).setOrigin(0.5));
    }

    if (!this.reducedMotion) {
      root.setScale(0.9).setAlpha(0).setY(636);
      this.scene.tweens.add({
        targets: root,
        y: 618,
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        duration: 180,
        ease: 'Back.Out',
      });
      this.scene.tweens.add({
        targets: root,
        y: 608,
        alpha: 0,
        delay: 760,
        duration: 210,
        ease: 'Quad.In',
      });
    }

    this.scene.time.delayedCall(this.reducedMotion ? 760 : 1040, () => root.destroy());
  }

  private toHex(color: number): string {
    return `#${color.toString(16).padStart(6, '0')}`;
  }
}

function displayBossName(id: string): string {
  return id.split('-').map((part) => part[0]!.toUpperCase() + part.slice(1)).join(' ');
}
