import { describe, expect, it } from 'vitest';
import { PROTOTYPE_ITEM_MAP } from '../src/game/data/items';
import { PROTOTYPE_COMBAT_PROFILE_MAP } from '../src/game/data/combatProfiles';
import {
  advanceCombat,
  createCombatBuildItem,
  createCombatState,
  type CombatSetup,
  type CombatState,
} from '../src/game/domain/combat';
import { createCombatBuild } from '../src/game/domain/combatBuild';
import type { ItemBonuses } from '../src/game/domain/synergies';

const noBonuses: ItemBonuses = {
  triggerSpeedPct: 0,
  poisonOnHit: 0,
  bonusLaserShots: 0,
  chaosPower: 0,
  scrapArmor: 0,
};

describe('deterministic combat engine', () => {
  it('converts backpack synergy bonuses into combat stats', () => {
    const item = createCombatBuildItem(
      'cat-1',
      {
        definitionId: 'laser-cat',
        triggerIntervalMs: 1000,
        damage: 10,
        poisonOnHit: 1,
        extraLaserDamage: 5,
      },
      {
        triggerSpeedPct: 25,
        poisonOnHit: 2,
        bonusLaserShots: 1,
        chaosPower: 1,
        scrapArmor: 2,
      },
    );

    expect(item.triggerIntervalMs).toBe(800);
    expect(item.poisonOnHit).toBe(3);
    expect(item.bonusLaserShots).toBe(1);
    expect(item.chaosPower).toBe(1);
    expect(item.scrapArmor).toBe(2);
  });

  it('builds combat items directly from the spatial backpack synergies', () => {
    const inventory = {
      width: 6,
      height: 5,
      blockedCells: [] as const,
      items: [
        { instanceId: 'battery', definitionId: 'angry-battery', origin: { x: 0, y: 0 }, rotation: 0 as const },
        { instanceId: 'toaster', definitionId: 'cursed-toaster', origin: { x: 1, y: 0 }, rotation: 0 as const },
      ],
    };

    const build = createCombatBuild(inventory, PROTOTYPE_ITEM_MAP, PROTOTYPE_COMBAT_PROFILE_MAP);
    expect(build.synergies.connections.map((connection) => connection.ruleId)).toContain('battery-device');
    expect(build.items.get('toaster')?.triggerIntervalMs).toBe(1760);
  });

  it('is invariant to render/update chunk size', () => {
    const item = createCombatBuildItem(
      'gun-1',
      { definitionId: 'gun', triggerIntervalMs: 1500, damage: 5 },
      noBonuses,
    );
    const setup: CombatSetup = {
      playerMaxHp: 100,
      items: new Map([[item.instanceId, item]]),
      enemy: {
        id: 'dummy',
        name: 'Dummy',
        maxHp: 200,
        attackIntervalMs: 2000,
        attackDamage: 4,
      },
    };

    const single = advanceCombat(createCombatState(setup), setup, 5000).state;
    let stepped: CombatState = createCombatState(setup);
    for (let index = 0; index < 50; index += 1) {
      stepped = advanceCombat(stepped, setup, 100).state;
    }

    expect(stepped).toEqual(single);
  });

  it('resolves equal-time effects by stable queue sequence', () => {
    const item = createCombatBuildItem(
      'finisher',
      { definitionId: 'finisher', triggerIntervalMs: 1000, damage: 10 },
      noBonuses,
    );
    const setup: CombatSetup = {
      playerMaxHp: 100,
      items: new Map([[item.instanceId, item]]),
      enemy: {
        id: 'glass-cannon',
        name: 'Glass Cannon',
        maxHp: 10,
        attackIntervalMs: 1000,
        attackDamage: 100,
      },
    };

    const result = advanceCombat(createCombatState(setup), setup, 5000);
    expect(result.state.outcome).toBe('victory');
    expect(result.state.timeMs).toBe(1000);
    expect(result.state.playerHp).toBe(100);
    expect(result.events.at(-1)).toEqual({ kind: 'outcome', atMs: 1000, outcome: 'victory' });
  });

  it('applies poison on the global poison clock and decays one stack per tick', () => {
    const item = createCombatBuildItem(
      'toxic-1',
      { definitionId: 'toxic', triggerIntervalMs: 500, damage: 0, poisonOnHit: 2 },
      noBonuses,
    );
    const setup: CombatSetup = {
      playerMaxHp: 100,
      items: new Map([[item.instanceId, item]]),
      enemy: {
        id: 'dummy',
        name: 'Dummy',
        maxHp: 100,
        attackIntervalMs: 10000,
        attackDamage: 0,
      },
    };

    const result = advanceCombat(createCombatState(setup), setup, 1000);
    expect(result.state.enemyHp).toBe(98);
    expect(result.state.enemyPoison).toBe(3);
    expect(result.events.filter((event) => event.kind === 'poison-applied')).toHaveLength(2);
  });

  it('uses scrap armor as deterministic opening shield', () => {
    const item = createCombatBuildItem(
      'magnet-1',
      { definitionId: 'scrap-magnet', triggerIntervalMs: 5000, damage: 0 },
      { ...noBonuses, scrapArmor: 3 },
    );
    const setup: CombatSetup = {
      playerMaxHp: 100,
      items: new Map([[item.instanceId, item]]),
      enemy: {
        id: 'dummy',
        name: 'Dummy',
        maxHp: 100,
        attackIntervalMs: 1000,
        attackDamage: 5,
      },
    };

    const initial = createCombatState(setup);
    expect(initial.playerShield).toBe(6);
    const afterHit = advanceCombat(initial, setup, 1000).state;
    expect(afterHit.playerHp).toBe(100);
    expect(afterHit.playerShield).toBe(1);
  });
});
