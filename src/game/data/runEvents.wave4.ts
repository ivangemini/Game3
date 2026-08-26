import type { RunEventDefinition } from '../domain/runEvents';

export const WAVE4_RUN_EVENTS: readonly RunEventDefinition[] = [
  {
    id: 'roomba-adoption-center',
    title: 'FERAL ROOMBA ADOPTION CENTER',
    body: 'A cardboard shelter full of angry cleaning robots asks whether your backpack has a safe forever-home policy.',
    choices: [
      {
        id: 'adopt-roomba',
        label: 'ADOPT  •  14 COINS',
        description: 'Take home one Feral Roomba. No obedience guarantee is provided.',
        costCoins: 14,
        reward: { kind: 'item', definitionIds: ['feral-roomba'] },
      },
      {
        id: 'decline-adoption',
        label: 'DECLINE POLITELY',
        description: 'The shelter refunds your imaginary application deposit: 7 coins.',
        costCoins: 0,
        reward: { kind: 'coins', amount: 7 },
      },
    ],
  },
  {
    id: 'pigeon-signal-tower',
    preferredWorlds: [6],
    title: 'PIGEON SIGNAL TOWER',
    body: 'A rooftop telecom company staffed entirely by pigeons offers suspiciously competitive roaming plans.',
    choices: [
      {
        id: 'rent-signal-junk',
        label: 'RENT HARDWARE  •  13',
        description: 'Receive one deterministic signal-themed base item.',
        costCoins: 13,
        reward: { kind: 'item', definitionIds: ['battery-pigeon', 'slime-pager', 'pocket-radio'] },
      },
      {
        id: 'sell-location-data',
        label: 'SELL LOCATION DATA',
        description: '45% chance the pigeons overpay 20 coins; otherwise their accounting department finds 4.',
        costCoins: 0,
        reward: { kind: 'gamble', winChancePct: 45, winCoins: 20, loseCoins: 4 },
      },
    ],
  },
  {
    id: 'illegal-brunch-lab',
    title: 'ILLEGAL BRUNCH LAB',
    body: 'Scientists in aprons insist breakfast was never meant to obey food-safety law or electromagnetic theory.',
    choices: [
      {
        id: 'taste-prototype',
        label: 'TASTE PROTOTYPE  •  10',
        description: 'Receive one deterministic experimental food item.',
        costCoins: 10,
        reward: { kind: 'item', definitionIds: ['magnet-croissant', 'antenna-sausage', 'fermented-gamepad', 'slime-donut'] },
      },
      {
        id: 'report-lab',
        label: 'REPORT THEM',
        description: 'The lab pays 8 coins to make the complaint mysteriously disappear.',
        costCoins: 0,
        reward: { kind: 'coins', amount: 8 },
      },
    ],
  },
];
