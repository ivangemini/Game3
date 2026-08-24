import { describe, expect, it } from 'vitest';
import { getActiveSynergies } from '../src/game/domain/synergy';

describe('synergy rules', () => {
  it('activates laser cat from animal and electronic tags', () => {
    const result = getActiveSynergies(['animal', 'electronic']);

    expect(result.map((item) => item.id)).toContain('laser-cat');
  });

  it('does not activate incomplete builds', () => {
    const result = getActiveSynergies(['animal']);

    expect(result).toHaveLength(0);
  });
});
