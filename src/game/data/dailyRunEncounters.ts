import {
  dailyRealityRuleForSeed,
  type DailyRealityRule,
} from '../domain/dailyRetention';
import type { RunProgressState } from '../domain/runProgression';
import {
  getRunEncounter,
  type RunEncounterDefinition,
  type RunWorldModifier,
} from './runEncounters';

export function getRuntimeRunEncounter(
  progress: RunProgressState,
  runSeed: string | number = 'prototype-run-001',
): RunEncounterDefinition | null {
  const encounter = getRunEncounter(progress, runSeed);
  if (!encounter) return null;
  const rule = dailyRealityRuleForSeed(runSeed);
  return rule ? applyDailyRealityRule(encounter, rule) : encounter;
}

export function applyDailyRealityRule(
  encounter: RunEncounterDefinition,
  rule: DailyRealityRule,
): RunEncounterDefinition {
  const modifier = dailyModifier(rule);
  const hpScale = Math.max(0.2, 1 + rule.enemyHpPct / 100);
  const damageScale = Math.max(0.2, 1 + rule.enemyDamagePct / 100);
  const speedScale = Math.max(0.2, 1 + rule.enemyAttackSpeedPct / 100);
  const rewardScale = Math.max(0, 1 + rule.rewardPct / 100);
  return {
    ...encounter,
    subtitle: `${encounter.subtitle} • DAILY: ${rule.name}.`,
    rewardCoins: Math.max(0, Math.round(encounter.rewardCoins * rewardScale)),
    scoreValue: Math.max(0, Math.round(encounter.scoreValue * rewardScale)),
    modifiers: [...encounter.modifiers, modifier],
    enemy: {
      ...encounter.enemy,
      maxHp: Math.max(1, Math.round(encounter.enemy.maxHp * hpScale)),
      attackDamage: Math.max(0, Math.round(encounter.enemy.attackDamage * damageScale)),
      attackIntervalMs: Math.max(500, Math.round(encounter.enemy.attackIntervalMs / speedScale)),
    },
  };
}

function dailyModifier(rule: DailyRealityRule): RunWorldModifier {
  return {
    id: `daily-${rule.id}`,
    name: `Daily • ${rule.name}`,
    description: rule.description,
    enemyHpPct: rule.enemyHpPct,
    enemyDamagePct: rule.enemyDamagePct,
    enemyAttackSpeedPct: rule.enemyAttackSpeedPct,
    rewardPct: rule.rewardPct,
  };
}
