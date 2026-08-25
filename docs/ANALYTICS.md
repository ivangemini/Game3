# Soft-launch analytics

## Purpose

Telemetry exists to answer retention, pacing, balance and monetization questions. It must not collect names, emails, advertising identifiers, fingerprints, IP-derived identifiers or persistent cross-site IDs.

The client uses an ephemeral session ID and a local boolean `returning` marker. Builds send nothing externally unless `VITE_ANALYTICS_ENDPOINT` is configured. `npm run release:soft-launch` requires that endpoint to be an absolute HTTPS URL.

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

## Event vocabulary

- `session_start` — new/returning boolean, platform adapter and viewport mode.
- `run_started` — standard or Daily run.
- `tutorial_opened`, `tutorial_completed`, `tutorial_skipped` — opt-in Field Manual funnel.
- `hero_selected` — run hero choice.
- `shop_purchase` — successful item purchase and price.
- `shop_reroll` — successful paid or rewarded reroll.
- `combat_started`, `combat_finished` — encounter funnel, result and actual wall-clock combat duration.
- `run_event_choice` — successful surreal-event decision.
- `fusion_used` — successful fusion recipe/result.
- `loop_entered` — Corrupted Loop depth accepted by the player.
- `run_cashout` — safe exit depth and score.
- `ad_result` — result of the explicit shop rewarded placement or natural cycle-boundary interstitial.

Only successful game-state mutations are tracked for purchase, reroll, event and fusion events; blocked clicks are intentionally excluded.

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

For the first balance pass, treat median as the central pacing signal and p90 as the long-tail regression signal. Do not tune from a single encounter with only a handful of attempts; compare reach, attempt count, win rate and duration together. A high p90 with a healthy median usually indicates a long-tail problem rather than a globally slow encounter.

## Primary soft-launch questions

1. What share of sessions reach hero choice, first combat and first boss?
2. How quickly does a new session reach hero choice and first combat after the one-click onboarding change?
3. How often is the optional Field Manual opened and completed?
4. How long do real combats and full runs take versus the pacing model?
5. Which encounters produce anomalous defeat rates or duration spikes?
6. How often do players use events and fusion before entering Loop 2?
7. What share of completed campaigns choose another loop versus cash-out?
8. Is rewarded reroll completion healthy without becoming required for progression?
9. Do returning sessions improve after balance/content changes?

`src/analytics/TelemetrySummary.ts` provides a deterministic first-pass aggregator. In addition to rates/counts it reports average, median and p90 time-to-hero, time-to-first-combat and per-encounter combat duration. Median is the default central pacing signal; p90 is the long-tail regression signal; averages remain useful for continuity with earlier reports but should not be tuned in isolation.

## Guardrails

Do not optimize ad impressions in isolation. Any ad-frequency experiment must also inspect run continuation, session duration, return behavior and completion rates. Do not add raw pointer paths, free-form text, device fingerprints or persistent user identifiers merely because the receiver can store them.
