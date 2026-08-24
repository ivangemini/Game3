import * as Phaser from 'phaser';
import { generateShopOffers, type ShopOffer } from '../domain/shop';
import type { ItemDefinition, Rarity } from '../domain/types';

const RARITY_COLORS: Record<Rarity, number> = {
  common: 0xb9b5aa,
  uncommon: 0x94df68,
  rare: 0x63b9ff,
  epic: 0xd87bff,
};

export interface ShopPanelSnapshot {
  readonly coins: number;
  readonly shopIndex: number;
  readonly soldOfferIds: readonly string[];
}

export interface ShopPanelOptions {
  readonly runSeed?: string | number;
  readonly initialCoins?: number;
  readonly initialShopIndex?: number;
  readonly initialSoldOfferIds?: readonly string[];
  readonly onStateChanged?: (snapshot: ShopPanelSnapshot) => void;
}

export class ShopPanel {
  private readonly definitionsById: ReadonlyMap<string, ItemDefinition>;
  private readonly offerObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly soldOfferIds: Set<string>;
  private readonly coinText: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly runSeed: string | number;
  private readonly onStateChanged?: (snapshot: ShopPanelSnapshot) => void;
  private shopIndex: number;
  private coins: number;

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
    this.coins = Math.max(0, Math.floor(options.initialCoins ?? 110));
    this.shopIndex = Math.max(0, Math.floor(options.initialShopIndex ?? 0));
    this.soldOfferIds = new Set(options.initialSoldOfferIds ?? []);
    this.onStateChanged = options.onStateChanged;

    this.scene.add.rectangle(left + 705, top + 72, 1410, 144, 0x141720, 1)
      .setStrokeStyle(4, 0x66533d);
    this.scene.add.text(left + 22, top + 16, 'JUNK SHOP', {
      fontSize: '22px',
      color: '#ffd56e',
      fontStyle: 'bold',
    });
    this.coinText = this.scene.add.text(left + 22, top + 49, '', {
      fontSize: '17px',
      color: '#f7f2e8',
      fontStyle: 'bold',
    });
    this.statusText = this.scene.add.text(left + 22, top + 112, 'Buy junk. Rerolls are deterministic for this run seed.', {
      fontSize: '12px',
      color: '#aaa5b2',
      wordWrap: { width: 275 },
    });

    this.createRerollButton();
    this.renderOffers();
  }

  getSnapshot(): ShopPanelSnapshot {
    return {
      coins: this.coins,
      shopIndex: this.shopIndex,
      soldOfferIds: [...this.soldOfferIds].sort(),
    };
  }

  addCoins(amount: number, reason = 'Reward'): void {
    const safeAmount = Math.max(0, Math.floor(amount));
    if (safeAmount === 0) return;
    this.coins += safeAmount;
    this.setStatus(`${reason}  •  +${safeAmount} coins`, '#ffd56e');
    this.renderOffers();
    this.notifyStateChanged();
  }

  private createRerollButton(): void {
    const x = this.left + 142;
    const y = this.top + 88;
    const button = this.scene.add.rectangle(x, y, 238, 34, 0x2c2638, 1)
      .setStrokeStyle(2, 0xc36cff)
      .setInteractive({ useHandCursor: true });
    const label = this.scene.add.text(x, y, 'REROLL  •  7 COINS', {
      fontSize: '13px',
      color: '#e4c7ff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    button.on('pointerover', () => button.setFillStyle(0x443454));
    button.on('pointerout', () => button.setFillStyle(0x2c2638));
    button.on('pointerdown', () => {
      button.setScale(0.97);
      label.setScale(0.97);
    });
    button.on('pointerup', () => {
      button.setScale(1);
      label.setScale(1);
      if (this.coins < 7) {
        this.setStatus('Not enough coins to reroll.', '#ff8a9b');
        return;
      }
      this.coins -= 7;
      this.shopIndex += 1;
      this.soldOfferIds.clear();
      this.setStatus(`Shop rerolled • seed step ${this.shopIndex}.`, '#b8ff8e');
      this.renderOffers();
      this.notifyStateChanged();
    });
  }

  private renderOffers(): void {
    for (const object of this.offerObjects) object.destroy();
    this.offerObjects.length = 0;
    this.coinText.setText(`SCRAP COINS  ${this.coins}`);

    const offers = generateShopOffers(
      [...this.definitionsById.values()],
      this.runSeed,
      this.shopIndex,
      3,
    );

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
    const color = RARITY_COLORS[definition.rarity];
    const sold = this.soldOfferIds.has(offer.id);

    const card = this.scene.add.rectangle(x, y, 286, 112, sold ? 0x15161b : 0x20232d, 1)
      .setStrokeStyle(3, sold ? 0x55515b : color);
    const title = this.scene.add.text(x - 126, y - 44, definition.name.toUpperCase(), {
      fontSize: '15px',
      color: sold ? '#77727e' : '#fff8ec',
      fontStyle: 'bold',
    });
    const tags = this.scene.add.text(x - 126, y - 18, definition.tags.slice(0, 4).join(' • ').toUpperCase(), {
      fontSize: '10px',
      color: sold ? '#66616b' : `#${color.toString(16).padStart(6, '0')}`,
    });
    const price = this.scene.add.text(x - 126, y + 14, sold ? 'SOLD' : `${offer.price} COINS`, {
      fontSize: '14px',
      color: sold ? '#77727e' : '#ffd56e',
      fontStyle: 'bold',
    });
    const buyButton = this.scene.add.rectangle(x + 82, y + 29, 92, 34, sold ? 0x29282d : 0x314125, 1)
      .setStrokeStyle(2, sold ? 0x55515b : 0xa8ff55);
    const buyLabel = this.scene.add.text(x + 82, y + 29, sold ? 'SOLD' : 'BUY', {
      fontSize: '13px',
      color: sold ? '#77727e' : '#d9ffb5',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.offerObjects.push(card, title, tags, price, buyButton, buyLabel);

    if (sold) return;
    buyButton.setInteractive({ useHandCursor: true });
    buyButton.on('pointerover', () => buyButton.setFillStyle(0x435d31));
    buyButton.on('pointerout', () => buyButton.setFillStyle(0x314125));
    buyButton.on('pointerdown', () => {
      buyButton.setScale(0.96);
      buyLabel.setScale(0.96);
    });
    buyButton.on('pointerup', () => {
      buyButton.setScale(1);
      buyLabel.setScale(1);
      this.tryPurchase(offer, definition);
    });
  }

  private tryPurchase(offer: ShopOffer, definition: ItemDefinition): void {
    if (this.coins < offer.price) {
      this.setStatus(`Need ${offer.price - this.coins} more coins for ${definition.name}.`, '#ff8a9b');
      return;
    }
    if (!this.onPurchase(definition.id)) {
      this.setStatus('No legal backpack space. Rearrange junk before buying.', '#ffbd72');
      return;
    }

    this.coins -= offer.price;
    this.soldOfferIds.add(offer.id);
    this.setStatus(`${definition.name} bought and packed.`, '#b8ff8e');
    this.renderOffers();
    this.notifyStateChanged();
  }

  private notifyStateChanged(): void {
    this.onStateChanged?.(this.getSnapshot());
  }

  private setStatus(message: string, color: string): void {
    this.statusText.setText(message).setColor(color);
  }
}
