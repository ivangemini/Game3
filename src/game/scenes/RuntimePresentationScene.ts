import * as Phaser from 'phaser';
import { CAMPAIGN_ENCOUNTERS } from '../data/runEncounters';
import { BossPortraitLayer } from '../ui/BossPortraitLayer';
import { createMaterialSurface } from '../ui/materialSurface';
import { PANEL_VISUALS } from '../ui/visualTokens';

const BOSS_NAME_TO_ID = new Map<string, string>(
  CAMPAIGN_ENCOUNTERS
    .filter((encounter) => encounter.kind === 'boss')
    .map((encounter) => [encounter.enemy.name.toUpperCase(), encounter.enemy.id]),
);
BOSS_NAME_TO_ID.set('COPYCAT AUDITOR', 'copycat-auditor');
BOSS_NAME_TO_ID.set('BORDER SHARK', 'border-shark');

/**
 * Presentation-only scene that installs high-level composition chrome into the gameplay scene.
 * It never owns game state: it decorates known runtime regions and mirrors already-rendered boss copy.
 */
export class RuntimePresentationScene extends Phaser.Scene {
  private target: Phaser.Scene | null = null;
  private marker: Phaser.GameObjects.Rectangle | null = null;
  private bossPortrait: BossPortraitLayer | null = null;
  private bossLabel: Phaser.GameObjects.Text | null = null;
  private currentBossId: string | null = null;
  private lastBossSignal = '';

  constructor() {
    super('runtime-presentation');
  }

  update(): void {
    const target = this.scene.get('prototype');
    if (!target.sys.isActive()) return;

    if (this.target !== target || !this.marker?.active) this.install(target);
    this.syncBossPresentation(target);
  }

  private install(target: Phaser.Scene): void {
    this.target = target;
    this.currentBossId = null;
    this.lastBossSignal = '';
    this.marker = target.add.rectangle(-50, -50, 1, 1, 0x000000, 0).setVisible(false).setDepth(-1000);

    this.drawAtmosphere(target);
    this.drawTopChrome(target);
    this.drawBackpackChrome(target);
    this.drawCombatChrome(target);

    const reducedMotion = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    this.bossPortrait = new BossPortraitLayer(target, 1225, 403, reducedMotion);

    target.events.once('shutdown', () => {
      if (this.target !== target) return;
      this.bossPortrait?.clear();
      this.bossPortrait = null;
      this.bossLabel = null;
      this.marker = null;
      this.target = null;
      this.currentBossId = null;
      this.lastBossSignal = '';
    });
  }

  private drawAtmosphere(scene: Phaser.Scene): void {
    scene.add.rectangle(800, 450, 1600, 900, 0x080a10, 0.74).setDepth(-30);
    scene.add.circle(1450, 305, 360, 0xa124d4, 0.09).setDepth(-29);
    scene.add.circle(1275, 560, 310, 0x245de2, 0.065).setDepth(-29);
    scene.add.circle(280, 520, 330, 0x6a8f37, 0.052).setDepth(-29);
    scene.add.circle(650, 80, 220, 0xff2da7, 0.035).setDepth(-29);

    const mesh = scene.add.graphics().setDepth(-28);
    mesh.lineStyle(1, 0x723a87, 0.13);
    for (let x = 820; x <= 1560; x += 48) mesh.lineBetween(x, 165, x - 80, 735);
    mesh.lineStyle(1, 0x4a7d9b, 0.1);
    for (let y = 210; y <= 720; y += 46) mesh.lineBetween(790, y, 1570, y + 20);

    const cables = scene.add.graphics().setDepth(-7);
    cables.lineStyle(10, 0x11151b, 0.88);
    cables.beginPath();
    cables.moveTo(535, 262);
    cables.lineTo(650, 250);
    cables.lineTo(720, 315);
    cables.lineTo(785, 290);
    cables.strokePath();
    cables.lineStyle(3, PANEL_VISUALS.neonPurple, 0.55);
    cables.strokePath();

    cables.lineStyle(8, 0x0d1416, 0.9);
    cables.beginPath();
    cables.moveTo(535, 565);
    cables.lineTo(665, 610);
    cables.lineTo(775, 580);
    cables.strokePath();
    cables.lineStyle(2, PANEL_VISUALS.electricBlue, 0.48);
    cables.strokePath();

    for (const [x, y, color] of [
      [650, 250, PANEL_VISUALS.neonPurple],
      [720, 315, PANEL_VISUALS.neonLime],
      [665, 610, PANEL_VISUALS.electricBlue],
    ] as const) {
      scene.add.circle(x, y, 9, 0x11141a, 1).setStrokeStyle(3, color, 0.8).setDepth(-6);
      scene.add.circle(x, y, 3, color, 0.9).setDepth(-5);
    }
  }

  private drawTopChrome(scene: Phaser.Scene): void {
    scene.add.rectangle(798, 67, 790, 118, 0x030407, 0.72).setDepth(3);
    scene.add.rectangle(800, 62, 770, 112, PANEL_VISUALS.scrap, 0.98)
      .setStrokeStyle(5, PANEL_VISUALS.scrapEdge, 0.9)
      .setDepth(4);
    createMaterialSurface(scene, {
      x: 800,
      y: 62,
      width: 754,
      height: 96,
      kind: 'scrap',
      seed: 'runtime-header-scrap',
      depth: 4.2,
      alpha: 0.8,
    });

    const paint = scene.add.graphics().setDepth(5);
    paint.lineStyle(10, 0x8cff26, 0.75);
    paint.lineBetween(690, 99, 915, 90);
    paint.lineStyle(5, 0xff2daf, 0.6);
    paint.lineBetween(720, 109, 880, 104);

    scene.add.text(800, 5, 'JUNKPACK', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '58px',
      color: '#f3e2bf',
      stroke: '#090a0e',
      strokeThickness: 11,
      shadow: { offsetX: 4, offsetY: 5, color: '#000000', blur: 0, fill: true },
    }).setOrigin(0.5, 0).setDepth(6);
    scene.add.text(800, 72, 'BOSS RUSH', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '31px',
      color: '#b7ff2c',
      stroke: '#101015',
      strokeThickness: 7,
    }).setOrigin(0.5, 0).setAngle(-1.5).setDepth(6);

    scene.add.rectangle(152, 58, 248, 92, 0x08090d, 0.84).setDepth(3);
    scene.add.rectangle(148, 54, 242, 88, PANEL_VISUALS.leatherDark, 1)
      .setStrokeStyle(4, PANEL_VISUALS.leatherEdge)
      .setDepth(4);
    createMaterialSurface(scene, {
      x: 148,
      y: 54,
      width: 226,
      height: 72,
      kind: 'leather',
      seed: 'runtime-player-plate',
      depth: 4.2,
      alpha: 0.9,
    });
    scene.add.text(52, 26, 'JUNK PILOT', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '19px', color: '#f5e7cc',
      stroke: '#0d0b0b', strokeThickness: 4,
    }).setDepth(6);
    scene.add.text(52, 55, '♥  96 / 100', {
      fontSize: '18px', color: '#ff6178', fontStyle: 'bold', stroke: '#12090d', strokeThickness: 4,
    }).setDepth(6);
    scene.add.rectangle(151, 87, 188, 12, 0x190d12, 1).setStrokeStyle(2, 0x5f2836).setDepth(5);
    scene.add.rectangle(61, 87, 178, 7, 0xff4e68, 1).setOrigin(0, 0.5).setDepth(6);

    scene.add.rectangle(1444, 47, 238, 62, 0x09090e, 0.86).setDepth(3);
    scene.add.rectangle(1440, 43, 232, 58, 0x31222d, 1)
      .setStrokeStyle(4, 0xd45a9e)
      .setDepth(4);
    createMaterialSurface(scene, {
      x: 1440,
      y: 43,
      width: 216,
      height: 44,
      kind: 'scrap',
      seed: 'runtime-boss-route-plate',
      depth: 4.2,
      alpha: 0.72,
    });
    scene.add.text(1440, 42, '☠  BOSS ROUTE  ☠', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '19px', color: '#ff8fcb',
      stroke: '#100b10', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(6);

    for (const [x, y] of [[430, 20], [1168, 20], [430, 105], [1168, 105]] as const) {
      scene.add.circle(x, y, 5, 0x707782, 1).setStrokeStyle(1, 0xcbd1d9, 0.55).setDepth(6);
    }
  }

  private drawBackpackChrome(scene: Phaser.Scene): void {
    scene.add.rectangle(318, 417, 520, 448, 0x000000, 0.22)
      .setStrokeStyle(2, 0xc28c64, 0.18)
      .setDepth(-6);

    const glow = scene.add.graphics().setDepth(-5);
    glow.lineStyle(6, PANEL_VISUALS.neonLime, 0.08);
    glow.strokeRoundedRect(55, 194, 525, 438, 28);
    glow.lineStyle(3, PANEL_VISUALS.neonPurple, 0.12);
    glow.strokeRoundedRect(65, 204, 505, 418, 23);

    scene.add.rectangle(320, 194, 356, 36, 0x140f0f, 0.88)
      .setStrokeStyle(3, 0xa67855)
      .setDepth(1.2);
    scene.add.text(320, 194, 'FIELD BAG // BUILD THE MACHINE', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '15px', color: '#f3d6a9', stroke: '#140c09', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(1.4);
  }

  private drawCombatChrome(scene: Phaser.Scene): void {
    scene.add.rectangle(1146, 451, 748, 558, 0x000000, 0.45).setDepth(-4);
    scene.add.rectangle(1140, 445, 736, 546, 0x14131a, 0.28)
      .setStrokeStyle(3, 0xa05ec3, 0.38)
      .setDepth(-3);

    const stageGlow = scene.add.graphics().setDepth(-2);
    stageGlow.lineStyle(3, 0xb93fff, 0.28);
    stageGlow.lineBetween(796, 262, 812, 222);
    stageGlow.lineBetween(812, 222, 851, 250);
    stageGlow.lineBetween(851, 250, 885, 208);
    stageGlow.lineStyle(3, 0x5ee8ff, 0.22);
    stageGlow.lineBetween(1450, 280, 1485, 235);
    stageGlow.lineBetween(1485, 235, 1510, 266);

    scene.add.rectangle(1140, 204, 706, 60, 0x090a0f, 0.98)
      .setStrokeStyle(4, 0x6f3e83)
      .setDepth(7);
    createMaterialSurface(scene, {
      x: 1140,
      y: 204,
      width: 688,
      height: 44,
      kind: 'screen',
      seed: 'runtime-combat-header',
      depth: 7.2,
      alpha: 0.9,
    });
    scene.add.text(812, 188, 'BOSS ARENA', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '24px', color: '#ff84d5',
      stroke: '#0b0810', strokeThickness: 5,
    }).setDepth(8);
    scene.add.text(814, 218, 'BUILD LOCKS AT FIGHT START  •  BOSS ATTACKS THE BAG', {
      fontSize: '11px', color: '#bcb2c6', fontStyle: 'bold',
    }).setDepth(8);

    scene.add.rectangle(1384, 204, 198, 42, 0x321622, 1)
      .setStrokeStyle(3, 0xe95aa8)
      .setDepth(8);
    this.bossLabel = scene.add.text(1384, 204, '☠  BOSS // STANDBY', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '14px', color: '#ffd8ec',
      stroke: '#10070b', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(9);

    for (const [x, y] of [[796, 181], [1484, 181], [796, 228], [1484, 228]] as const) {
      scene.add.circle(x, y, 5, 0x59606c, 1).setStrokeStyle(1, 0xc2cad5, 0.6).setDepth(9);
    }
  }

  private syncBossPresentation(scene: Phaser.Scene): void {
    const enemyName = this.findText(scene, 1225, 525)?.text ?? '';
    const bossId = bossIdForDisplayedEnemy(enemyName);
    if (bossId !== this.currentBossId) {
      this.currentBossId = bossId;
      this.lastBossSignal = '';
      if (bossId) {
        this.bossPortrait?.show(bossId);
        const label = normalizedEnemyName(enemyName);
        this.bossLabel?.setText(`☠  BOSS // ${label || 'LIVE'}`);
      } else {
        this.bossPortrait?.clear();
        this.bossLabel?.setText('☠  BOSS // STANDBY');
      }
    }

    if (!bossId) return;
    const signal = this.findText(scene, 815, 555)?.text?.trim() ?? '';
    if (!signal || signal === this.lastBossSignal) return;

    const previous = this.lastBossSignal;
    this.lastBossSignal = signal;
    const upper = signal.toUpperCase();
    const isTelegraph = upper.includes('IMPACT IN')
      || upper.includes('JAM IN')
      || upper.includes('SIGNAL LOCK')
      || upper.includes('TARGETS ');
    if (isTelegraph) {
      this.bossPortrait?.telegraph();
      return;
    }
    if (previous) this.bossPortrait?.impact();
  }

  private findText(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Text | null {
    for (const object of scene.children.list) {
      if (!(object instanceof Phaser.GameObjects.Text)) continue;
      if (Math.abs(object.x - x) <= 2 && Math.abs(object.y - y) <= 2) return object;
    }
    return null;
  }
}

function normalizedEnemyName(value: string): string {
  return value.trim().toUpperCase().replace(/^CORRUPTED\s+/, '');
}

function bossIdForDisplayedEnemy(value: string): string | null {
  return BOSS_NAME_TO_ID.get(normalizedEnemyName(value)) ?? null;
}
