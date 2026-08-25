import { describe, expect, it } from 'vitest';
import { PROTOTYPE_ITEM_MAP } from '../src/game/data/items';
import { validatePlacement } from '../src/game/domain/inventory';
import {
  BALANCE_CHECKPOINTS,
  createCombatBalanceReport,
  generateBalanceBuild,
} from '../src/game/simulation/combatBalance';

describe('seeded combat/build balance simulation', () => {
  it('generates deterministic legal backpack builds across progression checkpoints', () => {
    for (const checkpoint of BALANCE_CHECKPOINTS) {
      const first = generateBalanceBuild(checkpoint, 'typical', `legal:${checkpoint.id}`);
      const second = generateBalanceBuild(checkpoint, 'typical', `legal:${checkpoint.id}`);
      expect(first).toEqual(second);
      expect(first.inventory.items.length).toBeGreaterThan(0);

      for (const item of first.inventory.items) {
        expect(validatePlacement(first.inventory, PROTOTYPE_ITEM_MAP, item, item.instanceId).ok).toBe(true);
      }
    }
  });

  it('creates reproducible reports for weak, typical and strong power bands', () => {
    const first = createCombatBalanceReport(8, 'regression-combat', 120);
    const second = createCombatBalanceReport(8, 'regression-combat', 120);

    expect(first).toEqual(second);
    expect(first.bands).toHaveLength(BALANCE_CHECKPOINTS.length * 3);
    expect(new Set(first.bands.map((band) => band.powerBand))).toEqual(new Set(['weak', 'typical', 'strong']));
    for (const band of first.bands) {
      expect(band.sampleCount).toBe(8);
      expect(band.winRatePct + band.defeatRatePct + band.timeoutRatePct).toBeCloseTo(100, 2);
      expect(band.meanItemCount).toBeGreaterThan(0);
      expect(band.itemStats.length).toBeGreaterThan(0);
    }
  });

  it('gives stronger synthetic bands at least as much requested build capacity as weak bands', () => {
    for (const checkpoint of BALANCE_CHECKPOINTS) {
      const weak = generateBalanceBuild(checkpoint, 'weak', `power:${checkpoint.id}:weak`);
      const strong = generateBalanceBuild(checkpoint, 'strong', `power:${checkpoint.id}:strong`);
      expect(strong.requestedItemCount).toBeGreaterThan(weak.requestedItemCount);
      expect(strong.selectedPerkIds.length).toBeGreaterThanOrEqual(weak.selectedPerkIds.length);
    }
  });
});
