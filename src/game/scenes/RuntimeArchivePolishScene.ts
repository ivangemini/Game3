import * as Phaser from 'phaser';
import { createMaterialSurface } from '../ui/materialSurface';
import { PANEL_VISUALS } from '../ui/visualTokens';

type ArchiveSurfaceKind = 'archive' | 'mastery';

interface TargetDefinition {
  readonly title: string;
  readonly kind: ArchiveSurfaceKind;
}

const TARGETS: readonly TargetDefinition[] = [
  { title: 'JUNK ARCHIVE', kind: 'archive' },
  { title: 'MASTERY & GRUDGES', kind: 'mastery' },
] as const;

/** Presentation-only material skin for long-term collection/meta overlays. */
export class RuntimeArchivePolishScene extends Phaser.Scene {
  private target: Phaser.Scene | null = null;
  private marker: Phaser.GameObjects.Rectangle | null = null;
  private installed = new WeakSet<Phaser.GameObjects.Container>();
  private lastScanAt = -1000;

  constructor() {
    super('runtime-archive-polish');
  }

  update(): void {
    const target = this.scene.get('prototype');
    if (!target.sys.isActive()) return;
    if (this.target !== target || !this.marker?.active) this.install(target);

    if (this.time.now - this.lastScanAt < 180) return;
    this.lastScanAt = this.time.now;
    for (const definition of TARGETS) {
      const root = this.findOverlayRoot(target, definition.title);
      if (!root || this.installed.has(root)) continue;
      this.installed.add(root);
      if (definition.kind === 'archive') this.skinArchive(target, root);
      else this.skinMastery(target, root);
    }
  }

  private install(target: Phaser.Scene): void {
    this.target = target;
    this.marker = target.add.rectangle(-110, -110, 1, 1, 0x000000, 0)
      .setVisible(false)
      .setDepth(-1000);
    this.installed = new WeakSet<Phaser.GameObjects.Container>();
    this.lastScanAt = -1000;
    target.events.once('shutdown', () => {
      if (this.target !== target) return;
      this.marker = null;
      this.target = null;
    });
  }

  private skinArchive(scene: Phaser.Scene, root: Phaser.GameObjects.Container): void {
    const objects: Phaser.GameObjects.GameObject[] = [];

    objects.push(
      scene.add.rectangle(800, 459, 1494, 812, 0x050609, 0.3).setStrokeStyle(8, 0x281b19, 0.88),
      scene.add.rectangle(800, 454, 1474, 792, PANEL_VISUALS.leatherDark, 0.94)
        .setStrokeStyle(6, PANEL_VISUALS.leatherEdge, 0.92),
    );
    objects.push(createMaterialSurface(scene, {
      x: 800,
      y: 454,
      width: 1450,
      height: 768,
      kind: 'leather',
      seed: 'archive-polish:outer-case',
      alpha: 0.48,
    }));

    // The catalogue should read as a physical evidence case behind the dynamic item/recipe cards.
    const shelf = scene.add.graphics();
    shelf.fillStyle(0x0d1016, 0.72);
    shelf.fillRoundedRect(77, 207, 1446, 570, 12);
    shelf.lineStyle(3, 0x675548, 0.58);
    shelf.strokeRoundedRect(77, 207, 1446, 570, 12);
    shelf.lineStyle(5, 0x20242b, 0.96);
    shelf.lineBetween(87, 394, 1513, 394);
    shelf.lineBetween(87, 578, 1513, 578);
    shelf.lineStyle(2, 0xb37b52, 0.2);
    shelf.lineBetween(87, 398, 1513, 398);
    shelf.lineBetween(87, 582, 1513, 582);
    objects.push(shelf);

    // Five archival bays line up with Itemdex cards; recipe cards still inherit the same shelf silhouette.
    for (let col = 0; col < 5; col += 1) {
      const cx = 226 + col * 287;
      for (let row = 0; row < 3; row += 1) {
        const cy = 308 + row * 184;
        objects.push(
          scene.add.rectangle(cx + 4, cy + 5, 278, 176, 0x040507, 0.48),
          scene.add.rectangle(cx, cy, 276, 174, 0x14171d, 0.5).setStrokeStyle(2, 0x4f555f, 0.32),
        );
      }
    }

    const headerShadow = scene.add.rectangle(355, 103, 540, 92, 0x000000, 0.58);
    const headerPlate = scene.add.rectangle(350, 97, 536, 88, 0x523829, 1)
      .setStrokeStyle(5, 0xbd865c)
      .setAngle(-0.7);
    const headerWear = createMaterialSurface(scene, {
      x: 350,
      y: 97,
      width: 516,
      height: 68,
      kind: 'paper',
      seed: 'archive-polish:header',
      alpha: 0.65,
    }).setAngle(-0.7);
    objects.push(headerShadow, headerPlate, headerWear);

    const fileTab = scene.add.rectangle(795, 59, 278, 30, 0x72513b, 1)
      .setStrokeStyle(2, 0xd0a174, 0.68)
      .setAngle(1.1);
    const fileText = scene.add.text(795, 59, 'FIELD CATALOG // EVIDENCE LOCKER', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '10px', color: '#ffe4bd', stroke: '#1b100b', strokeThickness: 3,
      letterSpacing: 0.7,
    }).setOrigin(0.5).setAngle(1.1);
    objects.push(fileTab, fileText);

    const neonRail = scene.add.graphics();
    neonRail.lineStyle(5, PANEL_VISUALS.neonLime, 0.18);
    neonRail.lineBetween(86, 206, 518, 206);
    neonRail.lineStyle(5, PANEL_VISUALS.neonPurple, 0.16);
    neonRail.lineBetween(1082, 206, 1514, 206);
    objects.push(neonRail);

    this.addHardware(scene, objects, 0xb67d57);
    this.insertBehindContent(root, scene.add.container(0, 0, objects));
    this.fadeTechnicalSubtitle(root, 'COLLECTION • UNKNOWN JUNK');
  }

  private skinMastery(scene: Phaser.Scene, root: Phaser.GameObjects.Container): void {
    const objects: Phaser.GameObjects.GameObject[] = [];
    objects.push(
      scene.add.rectangle(800, 459, 1494, 812, 0x040507, 0.34).setStrokeStyle(8, 0x221722, 0.92),
      scene.add.rectangle(800, 454, 1474, 792, 0x201820, 0.96).setStrokeStyle(6, 0x8f5a82, 0.76),
    );
    objects.push(createMaterialSurface(scene, {
      x: 800,
      y: 454,
      width: 1450,
      height: 768,
      kind: 'scrap',
      seed: 'mastery-polish:wall',
      alpha: 0.42,
    }));

    // Split trophy wall: hero side and boss-grudge side share a heavy workshop chassis.
    const wall = scene.add.graphics();
    wall.fillStyle(0x0c0e13, 0.66);
    wall.fillRoundedRect(77, 184, 1446, 606, 12);
    wall.lineStyle(3, 0x5f4c61, 0.54);
    wall.strokeRoundedRect(77, 184, 1446, 606, 12);
    wall.lineStyle(7, 0x242830, 0.96);
    wall.lineBetween(800, 193, 800, 780);
    wall.lineStyle(2, PANEL_VISUALS.neonPurple, 0.2);
    wall.lineBetween(804, 193, 804, 780);
    objects.push(wall);

    for (const [cx, cy] of [[429, 350], [1147, 350], [429, 648], [1147, 648]] as const) {
      objects.push(
        scene.add.rectangle(cx + 5, cy + 7, 688, 274, 0x030407, 0.42),
        scene.add.rectangle(cx, cy, 684, 270, 0x16181f, 0.38).setStrokeStyle(2, 0x695270, 0.28),
      );
    }

    const tagShadow = scene.add.rectangle(365, 101, 570, 88, 0x000000, 0.55);
    const tag = scene.add.rectangle(360, 95, 566, 84, 0x432938, 1)
      .setStrokeStyle(5, 0xc86ca9)
      .setAngle(-0.8);
    const tagWear = createMaterialSurface(scene, {
      x: 360,
      y: 95,
      width: 546,
      height: 64,
      kind: 'scrap',
      seed: 'mastery-polish:header',
      alpha: 0.6,
    }).setAngle(-0.8);
    objects.push(tagShadow, tag, tagWear);

    const leftTab = scene.add.rectangle(600, 60, 206, 28, 0x64452f, 1)
      .setStrokeStyle(2, 0xbc8259, 0.7).setAngle(1.2);
    const leftText = scene.add.text(600, 60, 'PILOT RECORDS', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '10px', color: '#ffe0b5',
      stroke: '#1a0f0b', strokeThickness: 3,
    }).setOrigin(0.5).setAngle(1.2);
    const rightTab = scene.add.rectangle(1004, 60, 206, 28, 0x492a42, 1)
      .setStrokeStyle(2, PANEL_VISUALS.neonPurple, 0.65).setAngle(-1.1);
    const rightText = scene.add.text(1004, 60, 'BOSS GRUDGE FILES', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '10px', color: '#ffd9f5',
      stroke: '#140b13', strokeThickness: 3,
    }).setOrigin(0.5).setAngle(-1.1);
    objects.push(leftTab, leftText, rightTab, rightText);

    const warning = scene.add.graphics();
    warning.lineStyle(5, 0x14161b, 0.95);
    warning.lineBetween(95, 805, 1505, 805);
    warning.lineStyle(2, 0xff4f9d, 0.32);
    for (let x = 110; x < 1490; x += 54) warning.lineBetween(x, 801, x + 24, 809);
    objects.push(warning);

    this.addHardware(scene, objects, 0xb26c9e);
    this.insertBehindContent(root, scene.add.container(0, 0, objects));
    this.fadeTechnicalSubtitle(root, 'LONG-TERM GOALS');
  }

  private addHardware(scene: Phaser.Scene, objects: Phaser.GameObjects.GameObject[], accent: number): void {
    for (const [x, y] of [[82, 76], [1518, 76], [82, 830], [1518, 830]] as const) {
      objects.push(
        scene.add.circle(x, y, 8, 0x30343c, 1).setStrokeStyle(2, accent, 0.65),
        scene.add.circle(x - 2, y - 2, 2, 0xe1e5eb, 0.58),
      );
    }
  }

  private insertBehindContent(root: Phaser.GameObjects.Container, decor: Phaser.GameObjects.Container): void {
    const contentIndex = root.list.findIndex((object) => object instanceof Phaser.GameObjects.Container);
    root.addAt(decor, contentIndex >= 0 ? contentIndex : Math.max(0, root.list.length - 1));
  }

  private fadeTechnicalSubtitle(root: Phaser.GameObjects.Container, prefix: string): void {
    this.visit(root, (text) => {
      if (text.text.startsWith(prefix)) text.setAlpha(0.5);
    });
  }

  private findOverlayRoot(scene: Phaser.Scene, title: string): Phaser.GameObjects.Container | null {
    for (const object of scene.children.list) {
      if (!(object instanceof Phaser.GameObjects.Container)) continue;
      if (this.containerContainsText(object, title)) return object;
    }
    return null;
  }

  private containerContainsText(container: Phaser.GameObjects.Container, title: string): boolean {
    let found = false;
    this.visit(container, (text) => {
      if (text.text === title) found = true;
    });
    return found;
  }

  private visit(container: Phaser.GameObjects.Container, visitor: (text: Phaser.GameObjects.Text) => void): void {
    const walk = (object: Phaser.GameObjects.GameObject): void => {
      if (object instanceof Phaser.GameObjects.Text) {
        visitor(object);
        return;
      }
      if (object instanceof Phaser.GameObjects.Container) {
        for (const child of object.list) walk(child);
      }
    };
    for (const child of container.list) walk(child);
  }
}
