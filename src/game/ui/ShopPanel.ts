import * as Phaser from 'phaser';
import { telemetry } from '../../analytics/Telemetry';
import type { PlatformAdapter } from '../../platform/PlatformAdapter';
import { generateShopOffers, type ShopOffer } from '../domain/shop';
import type { ItemDefinition } from '../domain/types';
import { createItemGlyph } from './ItemGlyph';
import { PANEL_VISUALS, rarityVisual } from './visualTokens';

const PLATFORM_REGISTRY_KEY = 'junkpack.platform-adapter';

export interface ShopPanelSnapshot {
  readonly coins: number;
  readonly shopIndex: number;
  readonly soldOfferIds: readonly string[];
}

export type ShopFeedbackEvent =
  | { readonly kind: 'purchase'; readonly definitionId: string }
  | { readonly kind: 'reroll' }
  | { readonly kind: 'reward'; readonly amount: number }
  | { readonly kind: 'error'; readonly source: 'coins' | 'space' };

export interface ShopPanelOptions {
  readonly runSeed?: string | number;
  readonly initialCoins?: number;
  readonly initialShopIndex?: number;
  readonly initialSoldOfferIds?: readonly string[];
  readonly rerollCost?: number;
  readonly onStateChanged?: (snapshot: ShopPanelSnapshot) => void;
  readonly onFeedback?: (event: ShopFeedbackEvent) => void;
}

export class ShopPanel {
  private readonly definitionsById: ReadonlyMap<string, ItemDefinition>;
  private readonly offerObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly soldOfferIds: Set<string>;
  private readonly coinText: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly runSeed: string | number;
  private readonly rerollCost: number;
  private readonly onStateChanged?: (snapshot: ShopPanelSnapshot) => void;
  private readonly onFeedback?: (event: ShopFeedbackEvent) => void;
  private shopIndex: number;
  private coins: number;
  private rewardedRerollInFlight = false;

  constructor(
    private readonly scene: Phaser.Scene,
    definitions: readonly ItemDefinition[],
    private readonly left: number,
    private readonly top: number,
    private readonly onPurchase: (definitionId: string) => boolean,
    options: ShopPanelOptions = {},
  ) {
    this.definitionsById = new Map(definitions.map((definition) => [definition.id, definition]));
    this.runSeed = options.runSeed ?? 'prototype-run-001';
    this.rerollCost = Math.max(1, Math.floor(options.rerollCost ?? 7));
    this.coins = Math.max(0, Math.floor(options.initialCoins ?? 110));
    this.shopIndex = Math.max(0, Math.floor(options.initialShopIndex ?? 0));
    this.soldOfferIds = new Set(options.initialSoldOfferIds ?? []);
    this.onStateChanged = options.onStateChanged;
    this.onFeedback = options.onFeedback;

    this.drawShopShell();
    this.coinText = this.scene.add.text(left + 22, top + 49, '', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '18px', color: '#fff4cf', fontStyle: 'bold', stroke: '#141218', strokeThickness: 4,
    });
    this.statusText = this.scene.add.text(left + 22, top + 113, 'BUY • PACK • REBUILD. REROLLS STAY FIXED TO THIS RUN.', {
      fontSize: '11px', color: '#bcb2a6', fontStyle: 'bold', wordWrap: { width: 288 },
    });

    this.createRerollButtons();
    this.renderOffers();
  }

  getSnapshot(): ShopPanelSnapshot {
    return { coins: this.coins, shopIndex: this.shopIndex, soldOfferIds: [...this.soldOfferIds].sort() };
  }

  getCoins(): number { return this.coins; }

  addCoins(amount: number, reason = 'Reward'): void {
    const safeAmount = Math.max(0, Math.floor(amount));
    if (safeAmount === 0) return;
    this.coins += safeAmount;
    this.setStatus(`${reason.toUpperCase()} • +${safeAmount} SCRAP`, '#ffd56e');
    this.onFeedback?.({ kind: 'reward', amount: safeAmount });
    this.renderOffers();
    this.notifyStateChanged();
  }

  spendCoins(amount: number, reason = 'Spent'): boolean {
    const safeAmount = Math.max(0, Math.floor(amount));
    if (safeAmount === 0) return true;
    if (this.coins < safeAmount) {
      this.setStatus(`SHORT ${safeAmount - this.coins} SCRAP.`, '#ff8a9b');
      this.onFeedback?.({ kind: 'error', source: 'coins' });
      return false;
    }
    this.coins -= safeAmount;
    this.setStatus(`${reason.toUpperCase()} • -${safeAmount} SCRAP`, '#ffcf69');
    this.renderOffers();
    this.notifyStateChanged();
    return true;
  }

  private drawShopShell(): void {
    const centerX = this.left + 705;
    const centerY = this.top + 72;
    this.scene.add.rectangle(centerX + 6, centerY + 7, 1410, 144, PANEL_VISUALS.ink, 0.55).setDepth(-3);
    this.scene.add.rectangle(centerX, centerY, 1410, 144, PANEL_VISUALS.leatherDark, 1)
      .setStrokeStyle(5, PANEL_VISUALS.leatherEdge).setDepth(-2);
    this.scene.add.rectangle(centerX, centerY, 1392, 128, 0x171820, 1)
      .setStrokeStyle(2, 0x342c2a).setDepth(-1);

    const titlePlate = this.scene.add.rectangle(this.left + 142, this.top + 26, 246, 35, 0x5a3b2e, 1)
      .setStrokeStyle(3, 0xc28c5e);
    titlePlate.setAngle(-1.3);
    this.scene.add.text(this.left + 142, this.top + 25, 'JUNK SHOP', {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '21px', color: '#ffd56e',
      stroke: '#261611', strokeThickness: 5,
    }).setOrigin(0.5).setAngle(-1.3);

    for (const x of [this.left + 12, this.left + 304]) {
      this.scene.add.circle(x, this.top + 12, 5, PANEL_VISUALS.scrap, 1).setStrokeStyle(2, PANEL_VISUALS.scrapEdge);
      this.scene.add.circle(x, this.top + 132, 5, PANEL_VISUALS.scrap, 1).setStrokeStyle(2, PANEL_VISUALS.scrapEdge);
    }
  }

  private createRerollButtons(): void {
    this.createPaidRerollButton();
    const platform = this.platformAdapter();
    if (platform && platform.id !== 'local') this.createRewardedRerollButton(platform);
  }

  private createPaidRerollButton(): void {
    const x = this.left + 79;
    const y = this.top + 88;
    const shadow = this.scene.add.rectangle(x + 2, y + 3, 112, 35, 0x0b0c10, 0.65);
    const button = this.scene.add.rectangle(x, y, 112, 35, 0x33253c, 1)
      .setStrokeStyle(2, PANEL_VISUALS.neonPurple)
      .setInteractive({ useHandCursor: true });
    const label = this.scene.add.text(x, y, `↻ REROLL • ${this.rerollCost}`, {
      fontSize: '10px', color: '#f0d6ff', fontStyle: 'bold', stroke: '#17121b', strokeThickness: 3,
    }).setOrigin(0.5);

    button.on('pointerover', () => button.setFillStyle(0x4d3459));
    button.on('pointerout', () => button.setFillStyle(0x33253c));
    button.on('pointerdown', () => { button.setScale(0.97); label.setScale(0.97); shadow.setScale(0.97); });
    const restore = (): void => { button.setScale(1); label.setScale(1); shadow.setScale(1); };
    button.on('pointerupoutside', restore);
    button.on('pointerup', () => {
      restore();
      if (!this.spendCoins(this.rerollCost, 'Shop reroll')) return;
      this.advanceReroll('NEW CRATE OPENED', 'coins');
    });
  }

  private createRewardedRerollButton(platform: PlatformAdapter): void {
    const x = this.left + 205;
    const y = this.top + 88;
    const shadow = this.scene.add.rectangle(x + 2, y + 3, 124, 35, 0x0b0c10, 0.65);
    const button = this.scene.add.rectangle(x, y, 124, 35, 0x253c3f, 1)
      .setStrokeStyle(2, 0x7cf2ff)
      .setInteractive({ useHandCursor: true });
    const label = this.scene.add.text(x, y, '▶ FREE REROLL', {
      fontSize: '9px', color: '#d8fbff', fontStyle: 'bold', stroke: '#0f1719', strokeThickness: 3,
    }).setOrigin(0.5);

    const restore = (): void => { button.setScale(1).setAlpha(1); label.setScale(1).setAlpha(1); shadow.setScale(1); };
    button.on('pointerover', () => { if (!this.rewardedRerollInFlight) button.setFillStyle(0x315156); });
    button.on('pointerout', () => button.setFillStyle(0x253c3f));
    button.on('pointerdown', () => {
      if (this.rewardedRerollInFlight) return;
      button.setScale(0.97); label.setScale(0.97); shadow.setScale(0.97);
    });
    button.on('pointerupoutside', restore);
    button.on('pointerup', async () => {
      restore();
      if (this.rewardedRerollInFlight) return;
      this.rewardedRerollInFlight = true;
      button.setAlpha(0.58);
      label.setAlpha(0.72).setText('AD OPENING…');
      this.setStatus('OPTIONAL AD • FREE REROLL ONLY AFTER COMPLETION', '#9eeeff');
      try {
        const result = await platform.showRewarded();
        telemetry.track('ad_result', { placement: 'shop-free-reroll', format: 'rewarded', result });
        if (result === 'rewarded') {
          this.advanceReroll('REWARDED REROLL COMPLETE', 'rewarded');
          return;
        }
        const message = result === 'dismissed'
          ? 'AD CLOSED • CURRENT SHOP KEPT'
          : result === 'failed'
            ? 'AD FAILED • NOTHING SPENT'
            : 'NO REWARDED AD AVAILABLE • NOTHING SPENT';
        this.setStatus(message, result === 'failed' ? '#ff9c9c' : '#c8bdba');
      } catch {
        telemetry.track('ad_result', { placement: 'shop-free-reroll', format: 'rewarded', result: 'failed' });
        this.setStatus('AD FAILED • NOTHING SPENT', '#ff9c9c');
      } finally {
        this.rewardedRerollInFlight = false;
        label.setText('▶ FREE REROLL');
        restore();
      }
    });
  }

  private advanceReroll(statusPrefix: string, source: 'coins' | 'rewarded'): void {
    this.shopIndex += 1;
    this.soldOfferIds.clear();
    telemetry.track('shop_reroll', { source, shopIndex: this.shopIndex });
    this.onFeedback?.({ kind: 'reroll' });
    this.setStatus(`${statusPrefix} • SEED STEP ${this.shopIndex}`, '#b8ff8e');
    this.renderOffers();
    this.notifyStateChanged();
  }

  private platformAdapter(): PlatformAdapter | undefined {
    return this.scene.registry.get(PLATFORM_REGISTRY_KEY) as PlatformAdapter | undefined;
  }

  private renderOffers(): void {
    for (const object of this.offerObjects) object.destroy();
    this.offerObjects.length = 0;
    this.coinText.setText(`SCRAP  ◈ ${this.coins}`);

    const offers = generateShopOffers([...this.definitionsById.values()], this.runSeed, this.shopIndex, 3);
    const activeOfferIds = new Set(offers.map((offer) => offer.id));
    for (const soldId of [...this.soldOfferIds]) {
      if (!activeOfferIds.has(soldId)) this.soldOfferIds.delete(soldId);
    }
    offers.forEach((offer, index) => this.createOfferCard(offer, index));
  }

  private createOfferCard(offer: ShopOffer, index: number): void {
    const definition = this.definitionsById.get(offer.definitionId);
    if (!definition) throw new Error(`Unknown shop item: ${offer.definitionId}`);

    const x = this.left + 475 + index * 315;
    const y = this.top + 72;
    const rarity = rarityVisual(definition.rarity);
    const sold = this.soldOfferIds.has(offer.id);

    const shadow = this.scene.add.rectangle(x + 4, y + 5, 286, 112, PANEL_VISUALS.ink, 0.62);
    const card = this.scene.add.rectangle(x, y, 286, 112, sold ? 0x15161b : rarity.fill, 1)
      .setStrokeStyle(3, sold ? 0x55515b : rarity.stroke);
    const inner = this.scene.add.rectangle(x, y, 274, 100, sold ? 0x1a1a20 : 0x23242c, 0.8)
      .setStrokeStyle(1, sold ? 0x444149 : rarity.mid);
    const glyph = createItemGlyph(this.scene, definition, x - 103, y - 2, { size: 62, compact: true });
    glyph.setAlpha(sold ? 0.34 : 1);

    const title = this.scene.add.text(x - 61, y - 44, definition.name.toUpperCase(), {
      fontSize: '14px', color: sold ? '#77727e' : rarity.text, fontStyle: 'bold',
      stroke: '#141218', strokeThickness: 3, wordWrap: { width: 150 },
    });
    const rarityLabel = this.scene.add.text(x - 61, y - 19, rarity.label, {
      fontSize: '9px', color: sold ? '#66616b' : `#${rarity.stroke.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    });
    const tags = this.scene.add.text(x - 61, y - 2, definition.tags.slice(0, 3).join(' • ').toUpperCase(), {
      fontSize: '9px', color: sold ? '#66616b' : '#b9b5c1', wordWrap: { width: 142 },
    });
    const price = this.scene.add.text(x - 61, y + 27, sold ? 'SOLD' : `◈ ${offer.price}`, {
      fontFamily: 'Arial Black, Impact, sans-serif', fontSize: '15px', color: sold ? '#77727e' : '#ffd56e',
      fontStyle: 'bold', stroke: '#15131a', strokeThickness: 3,
    });
    const buyButton = this.scene.add.rectangle(x + 95, y + 31, 76, 34, sold ? 0x29282d : 0x30452b, 1)
      .setStrokeStyle(2, sold ? 0x55515b : PANEL_VISUALS.neonLime);
    const buyLabel = this.scene.add.text(x + 95, y + 31, sold ? 'SOLD' : 'PACK IT', {
      fontSize: '11px', color: sold ? '#77727e' : '#e3ffc5', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.offerObjects.push(shadow, card, inner, glyph, title, rarityLabel, tags, price, buyButton, buyLabel);
    if (sold) return;
    buyButton.setInteractive({ useHandCursor: true });
    buyButton.on('pointerover', () => { buyButton.setFillStyle(0x47653c); card.setStrokeStyle(4, rarity.accent); });
    buyButton.on('pointerout', () => { buyButton.setFillStyle(0x30452b); card.setStrokeStyle(3, rarity.stroke); });
    buyButton.on('pointerdown', () => { buyButton.setScale(0.96); buyLabel.setScale(0.96); glyph.setScale(1.04); });
    buyButton.on('pointerup', () => {
      buyButton.setScale(1); buyLabel.setScale(1); glyph.setScale(1);
      this.tryPurchase(offer, definition);
    });
  }

  private tryPurchase(offer: ShopOffer, definition: ItemDefinition): void {
    if (this.coins < offer.price) {
      this.setStatus(`NEED ${offer.price - this.coins} MORE SCRAP FOR ${definition.name.toUpperCase()}.`, '#ff8a9b');
      this.onFeedback?.({ kind: 'error', source: 'coins' });
      return;
    }
    if (!this.onPurchase(definition.id)) {
      this.setStatus('BACKPACK JAMMED • MAKE SPACE BEFORE BUYING.', '#ffbd72');
      this.onFeedback?.({ kind: 'error', source: 'space' });
      return;
    }

    this.coins -= offer.price;
    this.soldOfferIds.add(offer.id);
    telemetry.track('shop_purchase', { definitionId: definition.id, price: offer.price });
    this.onFeedback?.({ kind: 'purchase', definitionId: definition.id });
    this.setStatus(`${definition.name.toUpperCase()} • PACKED INTO THE BAG`, '#b8ff8e');
    this.renderOffers();
    this.notifyStateChanged();
  }

  private notifyStateChanged(): void { this.onStateChanged?.(this.getSnapshot()); }
  private setStatus(message: string, color: string): void { this.statusText.setText(message).setColor(color); }
}
