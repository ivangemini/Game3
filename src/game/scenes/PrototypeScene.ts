import * as Phaser from 'phaser';
import { PROTOTYPE_ITEM_MAP, PROTOTYPE_ITEMS } from '../data/items';
import { BackpackBoard } from '../ui/BackpackBoard';
import { ShopPanel } from '../ui/ShopPanel';

const COLORS = {
  background: 0x0b0d13,
  panelAlt: 0x211d28,
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
    const board = new BackpackBoard(this, PROTOTYPE_ITEM_MAP, 90, 225);
    this.drawBossPanel();
    this.drawSynergies();
    new ShopPanel(this, PROTOTYPE_ITEMS, 90, 735, (definitionId) => board.addRewardItem(definitionId));
  }

  private drawHeader(): void {
    this.add.text(800, 32, 'JUNKPACK', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '62px',
      color: COLORS.text,
      stroke: '#090a0d',
      strokeThickness: 10,
    }).setOrigin(0.5, 0);

    this.add.text(800, 94, 'BOSS RUSH', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '34px',
      color: '#b5ff4d',
      stroke: '#15121a',
      strokeThickness: 8,
    }).setOrigin(0.5, 0);

    this.add.text(48, 38, 'SCRAPSTER', { fontSize: '25px', color: COLORS.text, fontStyle: 'bold' });
    this.add.text(48, 73, '♥ 96 / 100', { fontSize: '22px', color: '#ff6578' });
    this.add.text(1370, 48, 'BOSS  •  ROUND 1', { fontSize: '25px', color: '#ff7083', fontStyle: 'bold' });
  }

  private drawSynergies(): void {
    this.add.text(90, 165, 'BACKPACK 6×5  •  DRAG + ROTATE  •  SIDE-CONTACT BUILDS', {
      fontSize: '21px',
      color: COLORS.text,
      fontStyle: 'bold',
    });
    this.add.text(90, 660, 'LIVE SYNERGIES — MOVE JUNK TO BREAK / REBUILD LINKS', {
      fontSize: '18px',
      color: '#ffcf69',
      fontStyle: 'bold',
    });
    this.add.text(90, 692, 'CAT → LASER    BATTERY → DEVICE    POISON → WEAPON    DUCK → CHAOS    MAGNET → METAL', {
      fontSize: '14px',
      color: COLORS.muted,
    });
  }

  private drawBossPanel(): void {
    this.add.rectangle(1140, 445, 720, 530, COLORS.panelAlt, 1).setStrokeStyle(5, 0x55365e);
    this.add.text(815, 170, 'TV TYRANT — FIRST BOSS TARGET', { fontSize: '25px', color: '#ff91e6', fontStyle: 'bold' });

    this.add.rectangle(1200, 410, 340, 270, 0x6b8e46, 1).setStrokeStyle(8, 0x282532);
    this.add.rectangle(1200, 400, 255, 165, 0x9bd267, 1).setStrokeStyle(10, 0x34323d);
    this.add.circle(1150, 378, 24, 0xf6f08a);
    this.add.circle(1248, 374, 29, 0xffd066);
    this.add.circle(1154, 378, 8, 0x191824);
    this.add.circle(1243, 374, 10, 0x191824);
    this.add.text(1200, 432, '▂▂▂', { fontSize: '36px', color: '#37233e' }).setOrigin(0.5);

    this.add.text(815, 245, 'BOSS RULES', { fontSize: '21px', color: '#d27aff', fontStyle: 'bold' });
    this.add.text(815, 284, '🧲 pulls METAL junk\n▦ slimes random cells\n↻ scrambles a row after telegraph', {
      fontSize: '19px',
      color: COLORS.text,
      lineSpacing: 17,
    });

    this.add.rectangle(1140, 627, 620, 28, 0x3a2028, 1).setStrokeStyle(2, 0x6c3442);
    this.add.rectangle(1015, 627, 370, 20, COLORS.danger, 1);
    this.add.text(830, 650, 'Boss combat lands after the backpack interaction gate.', {
      fontSize: '16px',
      color: COLORS.muted,
    });
  }
}
