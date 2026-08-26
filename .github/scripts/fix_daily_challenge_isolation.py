from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old[:100]!r}')
    file.write_text(text.replace(old, new, 1), encoding='utf-8')

replace_once(
    'src/game/domain/dailyRetention.ts',
    "import { completedCampaignWorldCount, type RunProgressState } from './runProgression';",
    "import { completedCampaignWorldCount, createInitialRunProgress, type RunProgressState } from './runProgression';",
)
replace_once(
    'src/game/domain/dailyRetention.ts',
    """export function createDailyBoardSnapshot(
  state: DailyRetentionState,
  key: string,
  snapshot: DailyRunProgressSnapshot,
): DailyBoardSnapshot {
""",
    """export function dailyBoardProgressForRun(
  runSeed: string | number,
  key: string,
  progress: RunProgressState,
): RunProgressState {
  return typeof runSeed === 'string' && dailyKeyFromSeed(runSeed) === key
    ? progress
    : createInitialRunProgress();
}

export function createDailyBoardSnapshot(
  state: DailyRetentionState,
  key: string,
  snapshot: DailyRunProgressSnapshot,
): DailyBoardSnapshot {
""",
)
replace_once(
    'src/game/scenes/PrototypeScene.ts',
    "import { dailyRealityRuleForSeed, bonusPocketUnlocksForRun, claimDailyContract, claimDailyTrackReward, createDailyBoardSnapshot, ensureDailyRetentionDay, evaluateDailyContracts, incrementDailyCounter, perkChoiceCountForRun, rerollCostForRun, startingCoinsForRun, type DailyCounterKey } from '../domain/dailyRetention';",
    "import { dailyRealityRuleForSeed, bonusPocketUnlocksForRun, claimDailyContract, claimDailyTrackReward, createDailyBoardSnapshot, dailyBoardProgressForRun, ensureDailyRetentionDay, evaluateDailyContracts, incrementDailyCounter, perkChoiceCountForRun, rerollCostForRun, startingCoinsForRun, type DailyCounterKey } from '../domain/dailyRetention';",
)
replace_once(
    'src/game/scenes/PrototypeScene.ts',
    "getSnapshot: () => createDailyBoardSnapshot(save.dailyRetention, todayDaily.key, { progress: activeRun.progress }),",
    "getSnapshot: () => createDailyBoardSnapshot(save.dailyRetention, todayDaily.key, { progress: dailyBoardProgressForRun(activeRun.runSeed, todayDaily.key, activeRun.progress) }),",
)

print('Daily challenge progress isolation applied')
