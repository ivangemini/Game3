import type { RunEventDefinition } from '../domain/runEvents';

export const WAVE5_RUN_EVENTS: readonly RunEventDefinition[] = [
  {
    id: 'taxidermy-wifi-cafe',
    title: 'TAXIDERMY WI-FI CAFE',
    body: 'A cafe full of stuffed routers serves espresso through Ethernet cables. The password is screaming softly.',
    choices: [
      {
        id: 'buy-network-junk',
        label: 'ORDER HARDWARE  •  13',
        description: 'Receive one deterministic signal-heavy base item.',
        costCoins: 13,
        reward: { kind: 'item', definitionIds: ['feral-router', 'pocket-radio', 'slime-pager'] },
      },
      {
        id: 'sell-password',
        label: 'SELL THE PASSWORD',
        description: '65% chance a stranger pays 18 coins; otherwise the password is already obsolete and you recover 2.',
        costCoins: 0,
        reward: { kind: 'gamble', winChancePct: 65, winCoins: 18, loseCoins: 2 },
      },
    ],
  },
  {
    id: 'moon-laundromat',
    title: 'EMERGENCY MOON LAUNDROMAT',
    body: 'Every washing machine is labelled DELICATES / HAZMAT / LUNAR DUST. None of them contain water.',
    choices: [
      {
        id: 'rent-cleaning-junk',
        label: 'RENT EQUIPMENT  •  17',
        description: 'Receive one deterministic cleaning-adjacent base item.',
        costCoins: 17,
        reward: { kind: 'item', definitionIds: ['toxic-umbrella', 'laser-mop', 'feral-roomba'] },
      },
      {
        id: 'empty-coin-traps',
        label: 'EMPTY THE COIN TRAPS',
        description: 'Pocket 9 coins and leave before the spin cycle notices.',
        costCoins: 0,
        reward: { kind: 'coins', amount: 9 },
      },
    ],
  },
  {
    id: 'banana-compliance-desk',
    title: 'BANANA COMPLIANCE DESK',
    body: 'A government desk asks whether your fruit has passed tactical, magnetic and broadcast certification. It has not.',
    choices: [
      {
        id: 'buy-certified-snack',
        label: 'BUY CERTIFICATE  •  12',
        description: 'The certificate comes stapled to one deeply noncompliant food item.',
        costCoins: 12,
        reward: { kind: 'item', definitionIds: ['tactical-banana', 'magnet-croissant', 'antenna-sausage'] },
      },
      {
        id: 'audit-the-auditor',
        label: 'AUDIT THE AUDITOR',
        description: '50% chance bureaucracy collapses and pays 21 coins; otherwise you recover 4 from petty cash.',
        costCoins: 0,
        reward: { kind: 'gamble', winChancePct: 50, winCoins: 21, loseCoins: 4 },
      },
    ],
  },
  {
    id: 'hamster-power-exchange',
    title: 'HAMSTER POWER EXCHANGE',
    body: 'Tiny brokers in running wheels shout voltage prices while a bell labelled MARKET PANIC rings continuously.',
    choices: [
      {
        id: 'buy-energy-asset',
        label: 'BUY ENERGY ASSET  •  14',
        description: 'Receive one deterministic battery-oriented base item.',
        costCoins: 14,
        reward: { kind: 'item', definitionIds: ['alarm-hamster', 'angry-battery', 'battery-pigeon', 'cat-battery-pack'] },
      },
      {
        id: 'short-the-grid',
        label: 'SHORT THE GRID',
        description: 'The exchange pays 8 coins to make you stop touching the cables.',
        costCoins: 0,
        reward: { kind: 'coins', amount: 8 },
      },
    ],
  },
  {
    id: 'forbidden-printer-support',
    title: 'FORBIDDEN PRINTER SUPPORT',
    body: 'A support kiosk promises to fix any printer issue except the printer being alive, venomous or unionized.',
    choices: [
      {
        id: 'accept-office-upgrade',
        label: 'ACCEPT UPGRADE  •  16',
        description: 'Receive one deterministic office-grade weapon or device.',
        costCoins: 16,
        reward: { kind: 'item', definitionIds: ['poison-printer', 'chaos-stapler', 'satellite-fork'] },
      },
      {
        id: 'claim-service-credit',
        label: 'CLAIM SERVICE CREDIT',
        description: '42% chance support accidentally refunds 25 coins; otherwise the ticket closes with 5.',
        costCoins: 0,
        reward: { kind: 'gamble', winChancePct: 42, winCoins: 25, loseCoins: 5 },
      },
    ],
  },
  {
    id: 'slime-brunch-court',
    title: 'SLIME BRUNCH COURT',
    body: 'A judge made of syrup hears arguments about whether lunch can legally be both poisonous and sentient.',
    choices: [
      {
        id: 'settle-with-brunch',
        label: 'SETTLE CASE  •  13',
        description: 'Receive one deterministic slime-or-food base item as legally binding lunch.',
        costCoins: 13,
        reward: { kind: 'item', definitionIds: ['slime-donut', 'panic-noodles', 'slime-magnet', 'fermented-gamepad'] },
      },
      {
        id: 'collect-court-fees',
        label: 'COLLECT COURT FEES',
        description: 'Take 10 coins from a jar labelled DEFINITELY NOT BRIBES.',
        costCoins: 0,
        reward: { kind: 'coins', amount: 10 },
      },
    ],
  },
];
