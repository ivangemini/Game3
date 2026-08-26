from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old[:100]!r}')
    file.write_text(text.replace(old, new, 1), encoding='utf-8')


# TelemetrySummary — aggregate Weekly entry, completion, retry, score and tier distributions.
replace_once(
    'src/analytics/TelemetrySummary.ts',
    """export interface HeroMasteryMetric {\n""",
    """export interface WeeklyChallengeMetric {\n  readonly sessionsStartingWeekly: number;\n  readonly weeklyStartSessionRate: number;\n  readonly sessionsOpeningBoard: number;\n  readonly boardOpenRateAmongWeeklySessions: number;\n  readonly sessionsFinishingAttempt: number;\n  readonly finishSessionRateAmongWeeklySessions: number;\n  readonly attemptStarts: number;\n  readonly attemptFinishes: number;\n  readonly finishToStartVolumeRatio: number;\n  readonly attemptsBuckets: Readonly<Record<string, number>>;\n  readonly scoreBuckets: Readonly<Record<string, number>>;\n  readonly tierDistribution: Readonly<Record<string, number>>;\n}\n\nexport interface HeroMasteryMetric {\n""",
)
replace_once(
    'src/analytics/TelemetrySummary.ts',
    """  readonly standardRunsStarted: number;\n  readonly dailyRunsStarted: number;\n  readonly dailyRetention: DailyRetentionMetric;\n""",
    """  readonly standardRunsStarted: number;\n  readonly dailyRunsStarted: number;\n  readonly weeklyRunsStarted: number;\n  readonly dailyRetention: DailyRetentionMetric;\n  readonly weeklyChallenge: WeeklyChallengeMetric;\n""",
)
replace_once(
    'src/analytics/TelemetrySummary.ts',
    """  let standardRunsStarted = 0;\n  let dailyRunsStarted = 0;\n  let dailyContractCompletions = 0;\n""",
    """  let standardRunsStarted = 0;\n  let dailyRunsStarted = 0;\n  let weeklyRunsStarted = 0;\n  let weeklyAttemptStarts = 0;\n  let weeklyAttemptFinishes = 0;\n  let dailyContractCompletions = 0;\n""",
)
replace_once(
    'src/analytics/TelemetrySummary.ts',
    """  const dailyRunSessions = new Set<string>();\n  const dailyBoardSessions = new Set<string>();\n""",
    """  const dailyRunSessions = new Set<string>();\n  const weeklyRunSessions = new Set<string>();\n  const weeklyBoardSessions = new Set<string>();\n  const weeklyFinishedSessions = new Set<string>();\n  const weeklyAttemptsBuckets: Record<string, number> = {};\n  const weeklyScoreBuckets: Record<string, number> = {};\n  const weeklyTierDistribution: Record<string, number> = {};\n  const dailyBoardSessions = new Set<string>();\n""",
)
replace_once(
    'src/analytics/TelemetrySummary.ts',
    """      case 'run_started': {\n        const payload = event.payload as { mode: 'standard' | 'daily' };\n        if (payload.mode === 'daily') {\n          dailyRunsStarted += 1;\n          dailyRunSessions.add(event.sessionId);\n        } else standardRunsStarted += 1;\n        rememberEarliest(runStartedAt, event.sessionId, event.timestampMs);\n        break;\n      }\n""",
    """      case 'run_started': {\n        const payload = event.payload as { mode: 'standard' | 'daily' | 'weekly' };\n        if (payload.mode === 'daily') {\n          dailyRunsStarted += 1;\n          dailyRunSessions.add(event.sessionId);\n        } else if (payload.mode === 'weekly') {\n          weeklyRunsStarted += 1;\n          weeklyRunSessions.add(event.sessionId);\n        } else standardRunsStarted += 1;\n        rememberEarliest(runStartedAt, event.sessionId, event.timestampMs);\n        break;\n      }\n""",
)
replace_once(
    'src/analytics/TelemetrySummary.ts',
    """      case 'daily_track_claimed': {\n        dailyTrackRewardClaims += 1;\n        dailyTrackClaimedSessions.add(event.sessionId);\n        break;\n      }\n      case 'hero_mastery_level_up': {\n""",
    """      case 'daily_track_claimed': {\n        dailyTrackRewardClaims += 1;\n        dailyTrackClaimedSessions.add(event.sessionId);\n        break;\n      }\n      case 'weekly_board_opened': {\n        weeklyBoardSessions.add(event.sessionId);\n        break;\n      }\n      case 'weekly_attempt_started': {\n        const payload = event.payload as { attemptsBucket: string };\n        weeklyAttemptStarts += 1;\n        weeklyAttemptsBuckets[payload.attemptsBucket] = (weeklyAttemptsBuckets[payload.attemptsBucket] ?? 0) + 1;\n        break;\n      }\n      case 'weekly_attempt_finished': {\n        const payload = event.payload as { tier: string; scoreBucket: string };\n        weeklyAttemptFinishes += 1;\n        weeklyFinishedSessions.add(event.sessionId);\n        weeklyScoreBuckets[payload.scoreBucket] = (weeklyScoreBuckets[payload.scoreBucket] ?? 0) + 1;\n        weeklyTierDistribution[payload.tier] = (weeklyTierDistribution[payload.tier] ?? 0) + 1;\n        break;\n      }\n      case 'hero_mastery_level_up': {\n""",
)
replace_once(
    'src/analytics/TelemetrySummary.ts',
    """    standardRunsStarted,\n    dailyRunsStarted,\n    dailyRetention: {\n""",
    """    standardRunsStarted,\n    dailyRunsStarted,\n    weeklyRunsStarted,\n    dailyRetention: {\n""",
)
replace_once(
    'src/analytics/TelemetrySummary.ts',
    """      streakBuckets: sortRecord(dailyStreakBuckets),\n    },\n    heroMastery: {\n""",
    """      streakBuckets: sortRecord(dailyStreakBuckets),\n    },\n    weeklyChallenge: {\n      sessionsStartingWeekly: weeklyRunSessions.size,\n      weeklyStartSessionRate: ratio(weeklyRunSessions.size, sessions),\n      sessionsOpeningBoard: weeklyBoardSessions.size,\n      boardOpenRateAmongWeeklySessions: ratio(weeklyBoardSessions.size, weeklyRunSessions.size),\n      sessionsFinishingAttempt: weeklyFinishedSessions.size,\n      finishSessionRateAmongWeeklySessions: ratio(weeklyFinishedSessions.size, weeklyRunSessions.size),\n      attemptStarts: weeklyAttemptStarts,\n      attemptFinishes: weeklyAttemptFinishes,\n      finishToStartVolumeRatio: ratio(weeklyAttemptFinishes, weeklyAttemptStarts),\n      attemptsBuckets: sortRecord(weeklyAttemptsBuckets),\n      scoreBuckets: sortRecord(weeklyScoreBuckets),\n      tierDistribution: sortRecord(weeklyTierDistribution),\n    },\n    heroMastery: {\n""",
)

# Soft-launch markdown — report the full Weekly funnel and distributions.
replace_once(
    'scripts/soft-launch-report.mjs',
    """  const daily = summary.dailyRetention ?? emptyDailyRetention();\n  const mastery = summary.heroMastery ?? emptyHeroMastery();\n""",
    """  const daily = summary.dailyRetention ?? emptyDailyRetention();\n  const weekly = summary.weeklyChallenge ?? emptyWeeklyChallenge();\n  const mastery = summary.heroMastery ?? emptyHeroMastery();\n""",
)
replace_once(
    'scripts/soft-launch-report.mjs',
    """  const dailyStreakBuckets = Object.entries(daily.streakBuckets ?? {});\n  const masteryLevelUpsByHero = Object.entries(mastery.levelUpsByHero ?? {});\n""",
    """  const dailyStreakBuckets = Object.entries(daily.streakBuckets ?? {});\n  const weeklyAttemptsBuckets = Object.entries(weekly.attemptsBuckets ?? {});\n  const weeklyScoreBuckets = Object.entries(weekly.scoreBuckets ?? {});\n  const weeklyTierDistribution = Object.entries(weekly.tierDistribution ?? {});\n  const masteryLevelUpsByHero = Object.entries(mastery.levelUpsByHero ?? {});\n""",
)
replace_once(
    'scripts/soft-launch-report.mjs',
    """    `- Standard/Daily runs started: **${summary.standardRunsStarted}/${summary.dailyRunsStarted}**.`,\n""",
    """    `- Standard/Daily/Weekly runs started: **${summary.standardRunsStarted}/${summary.dailyRunsStarted}/${summary.weeklyRunsStarted ?? 0}**.`,\n""",
)
replace_once(
    'scripts/soft-launch-report.mjs',
    """    'Daily streak buckets are local progression-state samples from sessions that opened the board; they are not D1/D7 retention measurements.',\n    '',\n    '## Mastery & revenge retention',\n""",
    """    'Daily streak buckets are local progression-state samples from sessions that opened the board; they are not D1/D7 retention measurements.',\n    '',\n    '## Weekly challenge replay',\n    '',\n    `- Weekly start reach: **${percent(weekly.weeklyStartSessionRate)}** (${weekly.sessionsStartingWeekly}/${summary.sessions} sessions).`,\n    `- Weekly Board reach among Weekly sessions: **${percent(weekly.boardOpenRateAmongWeeklySessions)}** (${weekly.sessionsOpeningBoard}/${weekly.sessionsStartingWeekly}).`,\n    `- Sessions finishing a Weekly attempt: **${percent(weekly.finishSessionRateAmongWeeklySessions)}** (${weekly.sessionsFinishingAttempt}/${weekly.sessionsStartingWeekly}).`,\n    `- Attempt starts/finishes: **${weekly.attemptStarts}/${weekly.attemptFinishes}**; finish/start volume ratio **${percent(weekly.finishToStartVolumeRatio)}**.`,\n    weeklyAttemptsBuckets.length > 0\n      ? `- Retry-state buckets at attempt start: ${weeklyAttemptsBuckets.map(([bucket, count]) => `${bucket} **${count}**`).join(' · ')}.`\n      : '- Retry-state buckets: no Weekly attempt starts in this export.',\n    weeklyScoreBuckets.length > 0\n      ? `- Score buckets at attempt finish: ${weeklyScoreBuckets.map(([bucket, count]) => `${bucket} **${count}**`).join(' · ')}.`\n      : '- Score buckets: no Weekly attempt finishes in this export.',\n    weeklyTierDistribution.length > 0\n      ? `- Tier distribution at attempt finish: ${weeklyTierDistribution.map(([tier, count]) => `${tier} **${count}**`).join(' · ')}.`\n      : '- Tier distribution: no Weekly attempt finishes in this export.',\n    '',\n    'Weekly metrics use ephemeral session IDs and bounded score/retry buckets. They measure challenge participation and replay behavior without introducing a backend player identity or global leaderboard.',\n    '',\n    '## Mastery & revenge retention',\n""",
)
replace_once(
    'scripts/soft-launch-report.mjs',
    """function emptyHeroMastery() {\n""",
    """function emptyWeeklyChallenge() {\n  return {\n    sessionsStartingWeekly: 0, weeklyStartSessionRate: 0,\n    sessionsOpeningBoard: 0, boardOpenRateAmongWeeklySessions: 0,\n    sessionsFinishingAttempt: 0, finishSessionRateAmongWeeklySessions: 0,\n    attemptStarts: 0, attemptFinishes: 0, finishToStartVolumeRatio: 0,\n    attemptsBuckets: {}, scoreBuckets: {}, tierDistribution: {},\n  };\n}\n\nfunction emptyHeroMastery() {\n""",
)

print('weekly R3 reporting integration applied')
