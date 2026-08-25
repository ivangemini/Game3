import { describe, expect, it } from 'vitest';
import { SECOND_STAGE_FUSION_RESULT_IDS } from '../src/game/data/fusionRecipes';
import { PROTOTYPE_ITEM_MAP } from '../src/game/data/items';
import { validatePlacement } from '../src/game/domain/inventory';
import {
  BALANCE_CHECKPOINTS,
  balanceFusionPoolForCheckpoint,
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

  it('keeps second-stage evolution results out of campaign synthetic fusion pools', () => {
    const campaignCheckpoint = BALANCE_CHECKPOINTS.find((checkpoint) => checkpoint.id === 'campaign-boss-4');
    const loopCheckpoint = BALANCE_CHECKPOINTS.find((checkpoint) => checkpoint.id === 'loop-2-boss-4');
    expect(campaignCheckpoint).toBeDefined();
    expect(loopCheckpoint).toBeDefined();
    if (!campaignCheckpoint || !loopCheckpoint) return;

    const campaignIds = new Set(balanceFusionPoolForCheckpoint(campaignCheckpoint).map((item) => item.id));
    const loopIds = new Set(balanceFusionPoolForCheckpoint(loopCheckpoint).map((item) => item.id));
    for (const resultId of SECOND_STAGE_FUSION_RESULT_IDS) {
      expect(campaignIds.has(resultId), `${resultId} leaked into campaign QA`).toBe(false);
      expect(loopIds.has(resultId), `${resultId} missing from loop QA`).toBe(true);
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
