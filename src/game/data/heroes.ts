import type { HeroDefinition } from '../domain/heroes';

export const PROTOTYPE_HEROES: readonly HeroDefinition[] = [
  {
    id: 'scavenger',
    name: 'Scrapster',
    title: 'The Scavenger',
    description: 'Starts every run with +25 coins. Buys flexibility instead of locking into one tag family.',
    startingCoinsBonus: 25,
    bonuses: {},
  },
  {
    id: 'engineer',
    name: 'Socket',
    title: 'The Engineer',
    description: 'Device-tag junk triggers 12% faster. Strong early machinery, but any build can still pivot away.',
    startingCoinsBonus: 0,
    targetTag: 'device',
    bonuses: { triggerSpeedPct: 12 },
  },
  {
    id: 'alchemist',
    name: 'Moldwitch',
    title: 'The Alchemist',
    description: 'Poison-tag junk applies +1 poison when it triggers. Rewards toxic geometry without requiring it.',
    startingCoinsBonus: 0,
    targetTag: 'poison',
    bonuses: { poisonOnHit: 1 },
  },
  {
    id: 'beastfriend',
    name: 'Snacklord',
    title: 'The Beastfriend',
    description: 'Pet-tag junk triggers 15% faster. Cats, ducks and stranger animals become easier to build around.',
    startingCoinsBonus: 0,
    targetTag: 'pet',
    bonuses: { triggerSpeedPct: 15 },
  },
];

export const PROTOTYPE_HERO_MAP = new Map(PROTOTYPE_HEROES.map((hero) => [hero.id, hero]));
