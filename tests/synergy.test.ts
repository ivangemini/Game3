import { describe, expect, it } from 'vitest';
import { SYNERGY_RULES } from '../src/game/domain/synergy';

describe('synergy compatibility entry point', () => {
  it('exports the canonical spatial synergy rules', () => {
    expect(SYNERGY_RULES.map((rule) => rule.id)).toEqual([
      'cat-laser',
      'battery-device',
      'poison-weapon',
      'duck-chaos',
      'magnet-metal',
    ]);
  });
});
