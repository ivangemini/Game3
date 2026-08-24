import * as Phaser from 'phaser';

const COLORS = {
  background: 0x0b0d13,
  panel: 0x171a24,
  panelAlt: 0x211d28,
  border: 0x4c4a58,
  grid: 0x292733,
  lime: 0xa8ff55,
  purple: 0xc36cff,
  orange: 0xff9838,
  danger: 0xff4f64,
  text: '#f7f2e8',
  muted: '#aaa5b2',
} as const;

export class PrototypeScene extends Phaser.Scene {
  constructor() {
    super('prototype');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.drawHeader();
    this.drawBackpack();
    this.drawBossPanel();
    this.drawFooter();
  }

  private drawHeader(): void {
    this.add.text(800, 38, 'JUNKPACK', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '64px',
      color: COLORS.text,
      stroke: '#090a0d',
      strokeThickness: 10,
    }).setOrigin(0.5, 0);

    this.add.text(800, 102, 'BOSS RUSH', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '34px',
      color: '#b5ff4d',
      stroke: '#15121a',
      strokeThickness: 8,
    }).setOrigin(0.5, 0);

    this.add.text(48, 38, 'SCRAPSTER', { fontSize: '25px', color: COLORS.text, fontStyle: 'bold' });
    this.add.text(48, 73, '♥ 96 / 100     ◈ 312', { fontSize: '22px', color: '#ff6578' });
    this.add.text(1390, 48, 'BOSS  •  ROUND 1', { fontSize: '25px', color: '#ff7083', fontStyle: 'bold' });
  }

  private drawBackpack(): void {
    this.add.rectangle(370, 460, 650, 620, COLORS.panel, 1).setStrokeStyle(5, 0x715d48);
    this.add.text(72, 166, 'BACKPACK 6×5', { fontSize: '24px', color: COLORS.text, fontStyle: 'bold' });

    const startX = 190;
    const startY = 248;
    const cell = 78;
    for (let row = 0; row < 5; row += 1) {
      for (let column = 0; column < 6; column += 1) {
        const locked = row === 4 && column >= 3;
        this.add.rectangle(startX + column * cell, startY + row * cell, 70, 70, locked ? 0x15151b : COLORS.grid, 1)
          .setStrokeStyle(2, locked ? 0x383640 : COLORS.border);
        if (locked) {
          this.add.text(startX + column * cell, startY + row * cell, '🔒', { fontSize: '24px' }).setOrigin(0.5);
        }
      }
    }

    const items: Array<[number, number, string, number]> = [
      [190, 248, '🐱⚡', COLORS.purple],
      [346, 248, '🌭', COLORS.orange],
      [502, 248, '▣', 0x8f7cff],
      [190, 404, '🦆', 0xffdf45],
      [346, 404, '🔋', COLORS.lime],
      [502, 404, '☣', 0x75df63],
      [190, 560, '🧲', 0x65b9ff],
      [346, 560, '🧪', COLORS.purple],
    ];

    for (const [x, y, label, color] of items) {
      this.add.rectangle(x, y, 62, 62, color, 0.14).setStrokeStyle(3, color);
      this.add.text(x, y, label, { fontSize: '30px' }).setOrigin(0.5);
    }

    this.add.text(70, 680, 'SYNERGIES', { fontSize: '22px', color: '#ffcf69', fontStyle: 'bold' });
    this.add.text(70, 715, 'CAT → LASER     BATTERY → DEVICE\nPOISON → WEAPON     DUCK → CHAOS', {
      fontSize: '18px',
      color: COLORS.muted,
      lineSpacing: 10,
    });
  }

  private drawBossPanel(): void {
    this.add.rectangle(1120, 460, 760, 620, COLORS.panelAlt, 1).setStrokeStyle(5, 0x55365e);
    this.add.text(800, 170, 'TV TYRANT — prototype boss', { fontSize: '27px', color: '#ff91e6', fontStyle: 'bold' });

    this.add.rectangle(1170, 420, 355, 290, 0x6b8e46, 1).setStrokeStyle(8, 0x282532);
    this.add.rectangle(1170, 410, 265, 175, 0x9bd267, 1).setStrokeStyle(10, 0x34323d);
    this.add.circle(1115, 385, 25, 0xf6f08a);
    this.add.circle(1220, 380, 31, 0xffd066);
    this.add.circle(1120, 385, 8, 0x191824);
    this.add.circle(1215, 380, 10, 0x191824);
    this.add.text(1170, 443, '▂▂▂', { fontSize: '38px', color: '#37233e' }).setOrigin(0.5);

    this.add.text(820, 250, 'BOSS RULES', { fontSize: '22px', color: '#d27aff', fontStyle: 'bold' });
    this.add.text(820, 292, '🧲 pulls METAL junk\n▦ slimes random cells\n↻ scrambles a row after telegraph', {
      fontSize: '20px',
      color: COLORS.text,
      lineSpacing: 18,
    });

    this.add.rectangle(1120, 652, 650, 30, 0x3a2028, 1).setStrokeStyle(2, 0x6c3442);
    this.add.rectangle(1000, 652, 400, 22, COLORS.danger, 1);
    this.add.text(800, 682, 'Goal for P1: make backpack manipulation feel excellent before combat depth.', {
      fontSize: '17px',
      color: COLORS.muted,
    });
  }

  private drawFooter(): void {
    const cards: Array<[number, string, string, number]> = [
      [470, 'BIG POCKETS', '+4 usable cells', COLORS.lime],
      [800, 'LASER PET', 'Cats fire twice', 0x56b9ff],
      [1130, 'CHAOS COOKER', 'Creates weird junk', COLORS.orange],
    ];

    for (const [x, title, detail, color] of cards) {
      this.add.rectangle(x, 825, 285, 110, COLORS.panel, 1).setStrokeStyle(4, color);
      this.add.text(x, 795, title, { fontSize: '20px', color: `#${color.toString(16).padStart(6, '0')}`, fontStyle: 'bold' }).setOrigin(0.5);
      this.add.text(x, 837, detail, { fontSize: '17px', color: COLORS.text }).setOrigin(0.5);
    }
  }
}
