# Soft-launch analytics

## Purpose

Telemetry exists to answer retention, pacing, balance and monetization questions. It must not collect names, emails, advertising identifiers, fingerprints, IP-derived identifiers or persistent cross-site IDs.

The client uses an ephemeral session ID plus local first-seen state only to emit a coarse return-age bucket. The local first-seen timestamp never leaves the browser and is not an analytics identity. Builds send nothing externally unless `VITE_ANALYTICS_ENDPOINT` is configured. `npm run release:soft-launch` requires that endpoint to be an absolute HTTPS URL.

## Delivery contract

`VITE_ANALYTICS_ENDPOINT` must accept `POST` requests with JSON:

```json
{
  "version": 1,
  "events": [
    {
      "name": "combat_finished",
      "payload": {
        "encounterId": "w1-tv-tyrant",
        "outcome": "victory",
        "durationMs": 42000
      },
      "sessionId": "ephemeral-session-id",
      "timestampMs": 1787670000000
    }
  ]
}
```

The browser prefers `navigator.sendBeacon()` and falls back to `fetch(..., { keepalive: true, credentials: 'omit' })`. Events are buffered in memory, flushed after a small batch threshold and again on page hide/page exit. A failed delivery remains buffered for the current page lifetime.

The receiver should return any 2xx response after accepting the batch. It should enforce a small request-size ceiling, reject unknown content types, rate-limit abuse and avoid enriching requests with fingerprinting data.

## Reference receiver

The repository includes a dependency-free Node 22 reference receiver in `services/telemetry-receiver.mjs`. It is **not** included in the portal ZIP and does not add a backend dependency to gameplay. Use it when a separate analytics service is not already available.

```bash
TELEMETRY_FILE=telemetry/telemetry.ndjson \
HOST=127.0.0.1 \
PORT=8787 \
npm run analytics:receiver
```

Endpoints:

- `GET /health` — readiness probe;
- `POST /v1/events` — versioned telemetry batches;
- `OPTIONS /v1/events` — CORS preflight.

The receiver enforces a 128 KiB request ceiling, at most 100 events per batch, the current event-name allowlist, bounded ephemeral session IDs and bounded payloads. It writes only event envelopes to append-only NDJSON. It does not persist IP addresses, user agents or cookies. `TELEMETRY_ALLOW_ORIGIN` defaults to `*`; for a known hosting setup it may be restricted to the required origin. Put TLS/reverse-proxy/rate limiting in front of the Node process for internet exposure.

For a production soft-launch build, point the client at the public HTTPS route, for example:

```bash
VITE_ANALYTICS_ENDPOINT=https://telemetry.example.com/v1/events npm run release:soft-launch
```

The `telemetry/` and `reports/` directories are gitignored so raw session exports and generated reports are not committed accidentally.

## Event vocabulary

- `session_start` — new/returning boolean, platform adapter and viewport mode.
- `session_age` — coarse local age bucket: `new`, `under-24h`, `1-2d`, `3-7d`, `8-30d`, `30d-plus` or `unknown`. No first-seen timestamp is transmitted.
- `run_started` — standard or Daily run.
- `tutorial_opened`, `tutorial_completed`, `tutorial_skipped` — opt-in Field Manual funnel.
- `hero_selected` — run hero choice.
- `hero_mastery_level_up` — low-volume mastery transition with one of the four hero IDs, emitted level 2–20 and count of cosmetic milestones crossed by that award. Raw XP ticks are intentionally not emitted.
- `boss_grudge_changed` — one of the six authored boss families with `started` or `resolved`; repeated losses while a grudge is already active do not emit duplicate start transitions.
- `shop_purchase` — successful item purchase and price.
- `shop_reroll` — successful paid or rewarded reroll.
- `combat_started`, `combat_finished` — encounter funnel, result and actual wall-clock combat duration.
- `run_event_choice` — successful surreal-event decision.
- `fusion_used` — successful fusion recipe/result.
- `loop_entered` — Corrupted Loop depth accepted by the player.
- `run_cashout` — safe exit depth and score.
- `ad_result` — result of the explicit shop rewarded placement or natural cycle-boundary interstitial.

Only successful game-state mutations are tracked for purchase, reroll, event and fusion events; blocked clicks are intentionally excluded. Mastery/grudge telemetry is intentionally transition-only so retention measurement does not become a high-volume action log.

## Generate a soft-launch report

Export accepted telemetry as either JSON or NDJSON. The report tool accepts individual envelopes, `{ "events": [...] }` batches, arrays of batches or line-delimited mixtures of those shapes.

```bash
npm run analytics:report -- telemetry.ndjson
```

By default it writes a compact Markdown report to stdout. To persist both machine-readable and review-friendly outputs:

```bash
npm run analytics:report -- telemetry.ndjson \
  --json reports/soft-launch.json \
  --markdown reports/soft-launch.md
```

The command uses the repository's actual `src/analytics/TelemetrySummary.ts` implementation rather than maintaining a second set of formulas. CI runs the command against `scripts/fixtures/telemetry-smoke.json`, so changes to the summary contract must remain executable through the reporting workflow.

## Return-age semantics and coverage

`session_age` is deliberately privacy-minimal. The aggregator accepts at most one age bucket per ephemeral session, so duplicate delivery cannot inflate the distribution. A partial export that contains `session_age` events but omits the matching `session_start` still preserves those deduplicated buckets for backward-compatible distribution analysis.

`sessionAgeCoverageRate` is stricter: it is the share of unique started sessions that have one accepted age bucket, so unmatched/orphan age events never increase coverage. The Markdown report uses **95%** as an operational instrumentation gate after at least **10 session starts**. This is a data-quality check, not a retention target.

The age-bucket mix is **not** D1/D7 cohort retention. There is intentionally no persistent analytics identity or cohort denominator, so a bucket such as `3-7d` means only that an observed session came from a browser whose local first-seen state is 3–7 days old. Use it as a coarse return-age distribution and trend signal, not as a substitute for identity-based cohort analysis.

## Pacing measurement anchors

Start-of-session UX and run pacing intentionally use different clocks:

- time-to-hero and time-to-first-combat start at `session_start`, because they measure launch friction;
- time-to-first-boss starts at `run_started` and reaches the first `w1-tv-tyrant` `combat_started` event;
- six-world base-campaign duration starts at `run_started` and ends at a victorious `w6-border-shark` `combat_finished` event;
- the World 4 `w4-baby-moon` victory is now an intermediate campaign milestone and does not count as campaign completion;
- legacy exports without `run_started` fall back to `session_start` for the boss/campaign metrics.

This avoids counting time spent on a portal page before a new run begins as campaign pacing. The report prints the current first-boss p50 target of **3–5 minutes** and six-world base-campaign p50 target of **32–42 minutes** beside the measured distributions.

For the first balance pass, treat median as the central pacing signal and p90 as the long-tail regression signal. Do not tune from a single encounter with only a handful of attempts; compare reach, attempt count, win rate and duration together. A high p90 with a healthy median usually indicates a long-tail problem rather than a globally slow encounter.

## Mastery and grudge measurement semantics

R2 deliberately keeps the same privacy boundary instead of introducing a persistent analytics identity solely to measure meta progression.

The summary/report therefore measures Hero Mastery through:

- sessions containing at least one mastery level-up;
- total level-up transition events;
- cosmetic milestone crossings carried by those events;
- maximum emitted mastery level overall and per hero;
- level-up event mix across the four heroes.

Boss Grudges are measured through:

- sessions containing a new grudge start;
- sessions containing a grudge resolution;
- total starts and resolutions;
- start/resolution counts per boss family;
- aggregate `resolutions / starts` volume ratio.

The aggregate grudge ratio is **not** a player-level revenge conversion rate. A grudge can start in one ephemeral session and resolve in a later one, and the system intentionally cannot link those sessions to the same person. Use the ratio as a directional trend signal together with boss-specific volumes, combat defeat rates and coarse return-age mix. Do not claim that a specific percentage of players returned for revenge from this metric.

Similarly, `maxObservedLevel` is the highest level carried by a level-up event in the export, not a complete distribution of every player's current mastery state. This avoids sending a persistent profile snapshot every session merely to improve analytics convenience.

## Sample-aware review signals

The Markdown report includes operational review signals so a small export does not trigger premature balance changes:

- return-age coverage gate: at least **10** session starts before evaluating the 95% instrumentation target;
- first-boss pacing gate: at least **20** sessions that reached the first boss before comparing p50 against the 3–5 minute target;
- base-campaign pacing gate: at least **15** completed six-world campaigns before comparing p50 against the 32–42 minute target.

Below a gate the report emits `[DATA]` and explicitly recommends holding tuning. Once the sample floor is met it emits `[ON TARGET]` or `[WATCH]` against the already-defined pacing targets. These floors are conservative operational review thresholds, not statistical-significance tests and not proof of causality. Balance changes still require looking at the full funnel, encounter attempts/win rates, p90 tails and the actual change made between samples.

R2 mastery/grudge metrics intentionally have no `[ON TARGET]` launch thresholds yet. Before real portal traffic there is no defensible baseline for what share of sessions should level up or resolve a grudge. Establish distributions first, then define review bands from observed behavior rather than inventing retention targets in advance.

## Primary soft-launch questions

1. What share of sessions reach hero choice, first combat and first boss?
2. How quickly does a new session reach hero choice and first combat after the one-click onboarding change?
3. How often is the optional Field Manual opened and completed?
4. How long do real combats and full six-world runs take versus the pacing model?
5. Which encounters produce anomalous defeat rates or duration spikes?
6. How often do players use events and fusion before entering Loop 2?
7. What share of completed campaigns choose another loop versus cash-out?
8. Is rewarded reroll completion healthy without becoming required for progression?
9. Does the coarse return-age mix improve after balance/content changes without degrading the core funnel?
10. How often do sessions cross Hero Mastery levels and cosmetic milestones, and is the activity spread across all four heroes?
11. Which bosses generate grudges, and do aggregate resolution volumes rise as players learn those boss rules?

`src/analytics/TelemetrySummary.ts` provides a deterministic first-pass aggregator. In addition to rates/counts it reports return-age instrumentation coverage, average/median/p90 time-to-hero, time-to-first-combat, time-to-first-boss, six-world base-campaign duration, per-encounter combat duration, Hero Mastery transition reach and privacy-safe Boss Grudge transition volumes. Median is the default central pacing signal; p90 is the long-tail regression signal; averages remain useful for continuity with earlier reports but should not be tuned in isolation.

## Guardrails

Do not optimize ad impressions in isolation. Any ad-frequency experiment must also inspect run continuation, session duration, return behavior and completion rates. Do not add raw pointer paths, free-form text, device fingerprints or persistent user identifiers merely because the receiver can store them.
