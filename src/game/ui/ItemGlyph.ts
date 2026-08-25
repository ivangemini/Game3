import * as Phaser from 'phaser';
import type { ItemDefinition, ItemTag } from '../domain/types';
import { PANEL_VISUALS, primaryVisualTag, rarityVisual, stableItemAccent } from './visualTokens';

export interface ItemGlyphOptions {
  readonly size?: number;
  readonly selected?: boolean;
  readonly compact?: boolean;
}

/**
 * Gameplay-size procedural item mark used until reviewed atlas art replaces it.
 * The silhouette vocabulary is stable by primary tag, while rarity and item ID
 * provide controlled material/accent variation.
 */
export function createItemGlyph(
  scene: Phaser.Scene,
  definition: ItemDefinition,
  x: number,
  y: number,
  options: ItemGlyphOptions = {},
): Phaser.GameObjects.Container {
  const size = Math.max(24, options.size ?? 54);
  const selected = options.selected ?? false;
  const rarity = rarityVisual(definition.rarity);
  const accent = stableItemAccent(definition.id);
  const root = scene.add.container(x, y);
  const shadow = scene.add.rectangle(3, 5, size, size, PANEL_VISUALS.ink, 0.52).setOrigin(0.5);
  const plate = scene.add.rectangle(0, 0, size, size, rarity.fill, 1)
    .setStrokeStyle(selected ? 4 : 3, selected ? 0xffffff : rarity.stroke);
  const inset = scene.add.rectangle(0, 0, size - 10, size - 10, rarity.mid, 0.7)
    .setStrokeStyle(1, accent, 0.75);
  root.add([shadow, plate, inset]);

  const graphics = scene.add.graphics();
  drawTagGlyph(graphics, primaryVisualTag(definition), size * 0.31, rarity.accent, accent);
  root.add(graphics);

  if (!options.compact) {
    const tape = scene.add.rectangle(0, size * 0.34, size * 0.52, Math.max(5, size * 0.1), PANEL_VISUALS.paper, 0.9)
      .setAngle(-4);
    root.add(tape);
  }

  return root;
}

function drawTagGlyph(
  graphics: Phaser.GameObjects.Graphics,
  tag: ItemTag,
  radius: number,
  main: number,
  accent: number,
): void {
  graphics.lineStyle(Math.max(3, radius * 0.18), main, 1);
  graphics.fillStyle(main, 1);
  if (tag === 'battery') return battery(graphics, radius, accent);
  if (tag === 'poison') return droplet(graphics, radius, accent);
  if (tag === 'slime') return slime(graphics, radius, accent);
  if (tag === 'magnet') return magnet(graphics, radius, accent);
  if (tag === 'antenna') return antenna(graphics, radius, accent);
  if (tag === 'laser') return laser(graphics, radius, accent);
  if (tag === 'weapon') return blade(graphics, radius, accent);
  if (tag === 'food') return food(graphics, radius, accent);
  if (tag === 'cat' || tag === 'pet') return animal(graphics, radius, accent, false);
  if (tag === 'duck') return animal(graphics, radius, accent, true);
  if (tag === 'chaos') return chaos(graphics, radius, accent);
  if (tag === 'metal') return bolt(graphics, radius, accent);
  return device(graphics, radius, accent);
}

function battery(g: Phaser.GameObjects.Graphics, r: number, accent: number): void {
  g.strokeRoundedRect(-r * 0.65, -r * 0.8, r * 1.3, r * 1.6, r * 0.2);
  g.fillRect(-r * 0.22, -r * 1.02, r * 0.44, r * 0.22);
  g.fillStyle(accent, 1);
  g.fillTriangle(r * 0.08, -r * 0.58, -r * 0.34, r * 0.08, r * 0.02, r * 0.08);
  g.fillTriangle(-r * 0.02, r * 0.58, r * 0.36, -r * 0.08, r * 0.02, -r * 0.08);
}

function droplet(g: Phaser.GameObjects.Graphics, r: number, accent: number): void {
  g.fillTriangle(0, -r, -r * 0.64, r * 0.18, r * 0.64, r * 0.18);
  g.fillCircle(0, r * 0.18, r * 0.63);
  g.fillStyle(accent, 1);
  g.fillCircle(-r * 0.18, r * 0.04, r * 0.12);
}

function slime(g: Phaser.GameObjects.Graphics, r: number, accent: number): void {
  g.fillRoundedRect(-r * 0.78, -r * 0.42, r * 1.56, r * 1.05, r * 0.35);
  g.fillCircle(-r * 0.5, r * 0.45, r * 0.3);
  g.fillCircle(r * 0.48, r * 0.52, r * 0.22);
  g.fillStyle(accent, 1);
  g.fillCircle(-r * 0.28, -r * 0.08, r * 0.1);
  g.fillCircle(r * 0.28, -r * 0.08, r * 0.1);
}

function magnet(g: Phaser.GameObjects.Graphics, r: number, accent: number): void {
  g.lineStyle(r * 0.42, 0xffffff, 1);
  g.beginPath();
  g.arc(0, 0, r * 0.62, Math.PI, 0, false);
  g.strokePath();
  g.lineStyle(r * 0.3, accent, 1);
  g.lineBetween(-r * 0.62, 0, -r * 0.62, r * 0.72);
  g.lineBetween(r * 0.62, 0, r * 0.62, r * 0.72);
}

function antenna(g: Phaser.GameObjects.Graphics, r: number, accent: number): void {
  g.lineBetween(0, r * 0.72, 0, -r * 0.62);
  g.fillCircle(0, r * 0.75, r * 0.14);
  g.lineStyle(r * 0.12, accent, 1);
  g.strokeCircle(0, -r * 0.6, r * 0.32);
  g.strokeCircle(0, -r * 0.6, r * 0.64);
}

function laser(g: Phaser.GameObjects.Graphics, r: number, accent: number): void {
  g.fillRoundedRect(-r * 0.78, -r * 0.22, r * 1.05, r * 0.44, r * 0.14);
  g.fillTriangle(r * 0.08, -r * 0.44, r * 0.08, r * 0.44, r * 0.62, 0);
  g.lineStyle(r * 0.15, accent, 1);
  g.lineBetween(r * 0.56, 0, r * 1.03, 0);
}

function blade(g: Phaser.GameObjects.Graphics, r: number, accent: number): void {
  g.fillTriangle(-r * 0.72, r * 0.62, -r * 0.14, -r * 0.78, r * 0.34, -r * 0.28);
  g.fillStyle(accent, 1);
  g.fillRect(-r * 0.08, r * 0.34, r * 0.72, r * 0.18);
}

function food(g: Phaser.GameObjects.Graphics, r: number, accent: number): void {
  g.fillCircle(0, r * 0.12, r * 0.68);
  g.fillStyle(accent, 1);
  g.fillCircle(-r * 0.22, -r * 0.08, r * 0.12);
  g.fillCircle(r * 0.24, r * 0.08, r * 0.09);
  g.lineStyle(r * 0.12, accent, 1);
  g.lineBetween(0, -r * 0.55, r * 0.18, -r * 0.9);
}

function animal(g: Phaser.GameObjects.Graphics, r: number, accent: number, duck: boolean): void {
  g.fillCircle(0, r * 0.08, r * 0.62);
  if (duck) {
    g.fillStyle(accent, 1);
    g.fillTriangle(r * 0.32, r * 0.02, r * 0.92, r * 0.18, r * 0.32, r * 0.32);
  } else {
    g.fillTriangle(-r * 0.52, -r * 0.28, -r * 0.35, -r * 0.92, -r * 0.02, -r * 0.42);
    g.fillTriangle(r * 0.52, -r * 0.28, r * 0.35, -r * 0.92, r * 0.02, -r * 0.42);
  }
  g.fillStyle(0x16141a, 1);
  g.fillCircle(-r * 0.2, 0, r * 0.08);
  g.fillCircle(r * 0.2, 0, r * 0.08);
}

function chaos(g: Phaser.GameObjects.Graphics, r: number, accent: number): void {
  g.lineStyle(r * 0.18, accent, 1);
  for (let arm = 0; arm < 5; arm += 1) {
    const angle = arm * Math.PI * 0.4;
    g.lineBetween(Math.cos(angle) * r * 0.15, Math.sin(angle) * r * 0.15, Math.cos(angle + 0.7) * r * 0.88, Math.sin(angle + 0.7) * r * 0.88);
  }
  g.fillCircle(0, 0, r * 0.2);
}

function bolt(g: Phaser.GameObjects.Graphics, r: number, accent: number): void {
  g.fillStyle(accent, 1);
  g.fillCircle(0, 0, r * 0.72);
  g.fillStyle(0x20232a, 1);
  g.fillCircle(0, 0, r * 0.28);
  g.lineStyle(r * 0.14, 0xffffff, 0.75);
  g.lineBetween(-r * 0.5, -r * 0.5, r * 0.5, r * 0.5);
}

function device(g: Phaser.GameObjects.Graphics, r: number, accent: number): void {
  g.strokeRoundedRect(-r * 0.7, -r * 0.62, r * 1.4, r * 1.24, r * 0.18);
  g.fillStyle(accent, 1);
  g.fillRect(-r * 0.44, -r * 0.28, r * 0.88, r * 0.34);
  g.fillCircle(-r * 0.28, r * 0.34, r * 0.1);
  g.fillCircle(r * 0.05, r * 0.34, r * 0.1);
}
