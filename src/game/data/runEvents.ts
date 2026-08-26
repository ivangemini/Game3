import type { RunEventDefinition } from '../domain/runEvents';
import { WAVE4_RUN_EVENTS } from './runEvents.wave4';
import { WAVE5_RUN_EVENTS } from './runEvents.wave5';

export const PROTOTYPE_RUN_EVENTS: readonly RunEventDefinition[] = [
  {
    id: 'cursed-vending-machine',
    title: 'CURSED VENDING MACHINE',
    body: 'A vending machine with human teeth whispers: “INSERT COINS FOR SOMETHING PROBABLY LEGAL.”',
    choices: [
      {
        id: 'buy-mystery-junk',
        label: 'INSERT 12 COINS',
        description: 'Receive one deterministic mystery junk item.',
        costCoins: 12,
        reward: { kind: 'item', definitionIds: ['angry-battery', 'cursed-toaster', 'poison-flask', 'scrap-magnet'] },
      },
      {
        id: 'kick-machine',
        label: 'KICK IT  •  4 COINS',
        description: '55% chance to shake loose 22 coins. Otherwise: embarrassment.',
        costCoins: 4,
        reward: { kind: 'gamble', winChancePct: 55, winCoins: 22, loseCoins: 0 },
      },
    ],
  },
  {
    id: 'cat-courier',
    title: 'CAT COURIER',
    body: 'A cat in a tiny delivery helmet demands a signature. The parcel is vibrating.',
    choices: [
      {
        id: 'accept-priority-cat',
        label: 'PAY 18 COINS',
        description: 'Priority delivery: Laser Cat.',
        costCoins: 18,
        reward: { kind: 'item', definitionIds: ['laser-cat'] },
      },
      {
        id: 'refuse-delivery',
        label: 'REFUSE DELIVERY',
        description: 'The courier pays 6 coins to stop arguing and marks the parcel “customer unstable.”',
        costCoins: 0,
        reward: { kind: 'coins', amount: 6 },
      },
    ],
  },
  {
    id: 'duck-tax-office',
    preferredWorlds: [5],
    title: 'DUCK TAX OFFICE',
    body: 'Three ducks behind a folding table claim you owe “interdimensional quack tax.” Their paperwork looks official enough.',
    choices: [
      {
        id: 'pay-duck-tax',
        label: 'SETTLE 10 COINS',
        description: 'They refund you with an extremely suspicious duck-related asset.',
        costCoins: 10,
        reward: { kind: 'item', definitionIds: ['mutant-duck'] },
      },
      {
        id: 'file-appeal',
        label: 'FILE APPEAL',
        description: '40% chance the bureaucracy accidentally awards 24 coins; otherwise 3.',
        costCoins: 0,
        reward: { kind: 'gamble', winChancePct: 40, winCoins: 24, loseCoins: 3 },
      },
    ],
  },
  {
    id: 'microwave-oracle',
    title: 'MICROWAVE ORACLE',
    body: 'An unplugged microwave predicts your future one beep at a time. It asks for “electrical tribute.”',
    choices: [
      {
        id: 'feed-oracle',
        label: 'FEED 11 COINS',
        description: 'The oracle spits out powered appliance junk.',
        costCoins: 11,
        reward: { kind: 'item', definitionIds: ['angry-battery', 'cursed-toaster'] },
      },
      {
        id: 'harvest-static',
        label: 'STEAL THE STATIC',
        description: 'Pocket 9 coins and pretend this was the plan.',
        costCoins: 0,
        reward: { kind: 'coins', amount: 9 },
      },
    ],
  },
  {
    id: 'slime-pawnshop',
    title: 'SLIME PAWNSHOP',
    body: 'A slime in sunglasses runs a pawnshop from inside another, larger slime. Prices are legally undefined.',
    choices: [
      {
        id: 'mystery-crate',
        label: 'MYSTERY CRATE  •  10',
        description: 'Receive one random base item.',
        costCoins: 10,
        reward: {
          kind: 'item',
          definitionIds: ['angry-battery', 'cursed-toaster', 'poison-flask', 'scrap-magnet', 'fish-blaster', 'toxic-fan'],
        },
      },
      {
        id: 'sell-advice',
        label: 'SELL BAD ADVICE',
        description: 'The slime pays 11 coins for information you invented.',
        costCoins: 0,
        reward: { kind: 'coins', amount: 11 },
      },
    ],
  },
  {
    id: 'fish-shrine',
    title: 'SHRINE OF THE ARMED FISH',
    body: 'A fish-shaped shrine hums with military-grade spiritual energy. There is absolutely no safety signage.',
    choices: [
      {
        id: 'make-offering',
        label: 'OFFER 16 COINS',
        description: 'Receive a Fish Blaster from somewhere behind the altar.',
        costCoins: 16,
        reward: { kind: 'item', definitionIds: ['fish-blaster'] },
      },
      {
        id: 'rob-donation-bowl',
        label: 'ROB DONATION BOWL',
        description: 'Take 8 coins. The stone fish looks disappointed but takes no legal action.',
        costCoins: 0,
        reward: { kind: 'coins', amount: 8 },
      },
    ],
  },
  ...WAVE4_RUN_EVENTS,
  ...WAVE5_RUN_EVENTS,
];

export const PROTOTYPE_RUN_EVENT_MAP = new Map(
  PROTOTYPE_RUN_EVENTS.map((event) => [event.id, event]),
);
