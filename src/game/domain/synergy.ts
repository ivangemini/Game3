/**
 * Compatibility entry point for synergy-domain imports.
 *
 * The canonical implementation is `synergies.ts`. Keep this file as a thin
 * facade so agents do not create a second tag-only synergy engine.
 */
export {
  SYNERGY_RULES,
  SYNERGY_RULE_MAP,
  evaluateSynergies,
} from './synergies';

export type {
  ItemBonuses,
  SynergyBonusKey,
  SynergyConnection,
  SynergyId,
  SynergyRule,
  SynergySnapshot,
} from './synergies';
