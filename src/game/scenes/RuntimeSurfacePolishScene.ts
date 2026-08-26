import * as Phaser from 'phaser';
import { createMaterialSurface } from '../ui/materialSurface';
import { PANEL_VISUALS } from '../ui/visualTokens';

/**
 * Presentation-only cleanup layered onto the live prototype scene.
 *
 * This scene deliberately owns no gameplay state. It hides legacy developer-copy
 * that is still useful in source and replaces it with compact, game-facing chrome.
 * The layer is reinstalled after PrototypeScene restarts, so save/reset flows keep
 * the same presentation without coupling gameplay code to art polish.
 */
export class RuntimeSurfacePolishScene extends Phaser.Scene {
  private target: Phaser.Scene | null = null;
  private marker: Phaser.GameObjects.Rectangle | null = null;
  private readonly arenaObjects: Array<Phaser.GameObjects.Shape | Phaser.GameObjects.Graphics | Phaser.GameObjects.Text> = [];

  constructor() {
    super('runtime-surface-polish');
  }

  update(): void {
    const target = this.scene.get('prototype');
    if (!target.sys.isActive()) return;
    if (this.target !== target || !this.marker?.active) this.install(target);
    this.syncArenaStage(target);
  }

  private install(scene: Phaser.Scene): void {
    this.target = scene;
    this.marker = scene.add.rectangle(-80, -80, 1, 1, 0x000000, 0)
      .setVisible(false)
      .setDepth(-1000);

    this.hideLegacyDeveloperCopy(scene);
    this.drawBuildReadout(scene);
    this.drawShopCrateChrome(scene);
    this.drawArenaStage(scene);

    scene.events.once('shutdown', () => {
      if (this.target !== scene) return;
      this.arenaObjects.length = 0;
      this.marker = null;
      this.target = null;
    });
  }

  private hideLegacyDeveloperCopy(scene: Phaser.Scene): void {
    const hiddenPrefixes = [
      'BACKPACK 6×5',
      'LIVE SYNERGIES',
      'CORE: CAT',
    ];
    const legacyHeaderPrefixes = [
      'JUNKPACK',
      'BOSS RUSH',
      'JUNK PILOT',
      '♥ 96 / 100',
      '6 WORLDS',
    ];

    for (const object of scene.children.list) {
      if (!(object instanceof Phaser.GameObjects.Text)) continue;
      if (hiddenPrefixes.some((prefix) => object.text.startsWith(prefix))) {
        object.setVisible(false);
        continue;
      }
      // PrototypeScene still authors the old flat header at depth 0. The production
      // presentation layer redraws the same information at depth 6+, so only hide
      // the legacy copy rather than matching by text globally.
      if (object.depth < 2 && legacyHeaderPrefixes.some((prefix) => object.text.startsWith(prefix))) {
        object.setVisible(false);
      }
    }
  }

  private drawBuildReadout(scene: Phaser.Scene): void {
    const x = 320;
    const y = 674;

    scene.add.rectangle(x + 5, y + 5, 510, 64, 0x050609, 0.64).setDepth(5.6);
    scene.add.rectangle(x, y, 506, 62, 0x20191a, 0.97)
      .setStrokeStyle(4, 0x8d624a)
      .setDepth(5.8);
    scene.add.rectangle(x, y, 492, 48, 0x111319, 0.96)
      .setStrokeStyle(1, 0x4e4140, 0.8)
      .setDepth(6);
    createMaterialSurface(scene, {
      x,
      y,
      width: 482,
      height: 40,
      kind: 'scrap',
      seed: 'surface-polish:build-readout',
      depth: 6.1,
      alpha: 0.62,
    });

    const tape = scene.add.rectangle(160, y - 22, 160, 26, 0x6d4b34, 1)
      .setStrokeStyle(2, 0xb88258)
      .setAngle(-1.5)
      .setDepth(6.4);
    tape.setOrigin(0.5);
    scene.add.text(160, y - 22, 'LIVE LINKS', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '13px', color: '#ffe0a5', stroke: '#21130d', strokeThickness: 4,
    }).setOrigin(0.5).setAngle(-1.5).setDepth(6.6);

    const chips = [
      { x: 116, label: 'CAT', accent: 0xff88cf },
      { x: 190, label: 'BATTERY', accent: 0xffd55f },
      { x: 288, label: 'POISON', accent: 0xaaff5d },
      { x: 382, label: 'MAGNET', accent: 0x6de8ff },
      { x: 470, label: 'CHAOS', accent: 0xc287ff },
    ] as const;

    for (const chip of chips) {
      const width = Math.max(58, chip.label.length * 8 + 22);
      scene.add.rectangle(chip.x, y + 10, width, 25, 0x191b22, 1)
        .setStrokeStyle(2, chip.accent, 0.74)
        .setDepth(6.4);
      scene.add.circle(chip.x - width / 2 + 10, y + 10, 3.5, chip.accent, 1).setDepth(6.6);
      scene.add.text(chip.x + 5, y + 10, chip.label, {
        fontSize: '9px', color: '#ede6df', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(6.6);
    }

    scene.add.text(478, y - 19, 'EDGE CONTACT = POWER', {
      fontSize: '9px', color: '#b9b0b6', fontStyle: 'bold',
    }).setOrigin(1, 0.5).setDepth(6.6);
  }

  private drawShopCrateChrome(scene: Phaser.Scene): void {
    const labels = [
      { x: 565, text: 'CRATE PICK 01', angle: -1.4 },
      { x: 880, text: 'CRATE PICK 02', angle: 1.1 },
      { x: 1195, text: 'CRATE PICK 03', angle: -0.8 },
    ] as const;

    for (const label of labels) {
      scene.add.rectangle(label.x + 3, 754, 116, 24, 0x050609, 0.62).setDepth(2.8);
      scene.add.rectangle(label.x, 751, 114, 22, 0x604331, 1)
        .setStrokeStyle(2, 0xb17c55)
        .setAngle(label.angle)
        .setDepth(3);
      createMaterialSurface(scene, {
        x: label.x,
        y: 751,
        width: 104,
        height: 14,
        kind: 'paper',
        seed: `surface-polish:${label.text}`,
        depth: 3.1,
        alpha: 0.46,
      }).setAngle(label.angle);
      scene.add.text(label.x, 751, label.text, {
        fontFamily: 'Arial Black, Impact, sans-serif',
        fontSize: '9px', color: '#f2d6aa', stroke: '#1e120d', strokeThickness: 3,
      }).setOrigin(0.5).setAngle(label.angle).setDepth(3.3);
    }

    // Static hardware around the dynamic shop cards. The cards remain fully interactive.
    const hardware = scene.add.graphics().setDepth(2.7);
    hardware.lineStyle(3, 0x6d727e, 0.45);
    for (const x of [422, 708, 737, 1023, 1052, 1338]) {
      hardware.lineBetween(x, 762, x, 852);
    }
    hardware.lineStyle(1, PANEL_VISUALS.neonPurple, 0.28);
    hardware.lineBetween(416, 858, 1350, 858);

    for (const x of [420, 710, 735, 1025, 1050, 1340]) {
      scene.add.circle(x, 760, 4, 0x40454f, 1).setStrokeStyle(1, 0x9ba2ad, 0.7).setDepth(3.2);
      scene.add.circle(x, 854, 4, 0x40454f, 1).setStrokeStyle(1, 0x9ba2ad, 0.7).setDepth(3.2);
    }
  }

  private drawArenaStage(scene: Phaser.Scene): void {
    // A low floor plane makes authored bosses read as stage figures instead of cards.
    const outer = scene.add.ellipse(1225, 537, 360, 64, 0x020306, 0.64)
      .setStrokeStyle(3, PANEL_VISUALS.neonPurple, 0.22)
      .setDepth(20);
    const inner = scene.add.ellipse(1225, 531, 278, 42, PANEL_VISUALS.neonPurple, 0.07)
      .setStrokeStyle(2, PANEL_VISUALS.electricBlue, 0.16)
      .setDepth(20.1);

    const warning = scene.add.graphics().setDepth(19.8);
    warning.lineStyle(7, 0x181a20, 0.95);
    warning.lineBetween(1065, 558, 1385, 558);
    warning.lineStyle(3, 0xe9b83f, 0.7);
    for (let x = 1080; x < 1380; x += 36) warning.lineBetween(x, 554, x + 18, 562);

    const floorLabel = scene.add.text(1225, 568, 'BOSS FLOOR // KEEP THE BAG ALIVE', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '10px', color: '#ba9fc5', stroke: '#07070a', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20.3);

    this.arenaObjects.push(outer, inner, warning, floorLabel);
    const bolts = [
      [1065, 558], [1385, 558], [1078, 513], [1372, 513],
    ] as const;
    for (const [x, y] of bolts) {
      const bolt = scene.add.circle(x, y, 5, 0x4c515b, 1)
        .setStrokeStyle(1, 0xaab1bc, 0.55)
        .setDepth(20.2);
      this.arenaObjects.push(bolt);
    }

    for (const object of this.arenaObjects) object.setVisible(false);
  }

  private syncArenaStage(scene: Phaser.Scene): void {
    let bossLive = false;
    for (const object of scene.children.list) {
      if (!(object instanceof Phaser.GameObjects.Text)) continue;
      if (!object.text.startsWith('☠  BOSS //')) continue;
      bossLive = !object.text.includes('STANDBY');
      break;
    }
    for (const object of this.arenaObjects) object.setVisible(bossLive);
  }
}
