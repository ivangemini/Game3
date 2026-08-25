# Soft-launch analytics

## Purpose

Telemetry exists to answer retention, pacing, balance and monetization questions. It must not collect names, emails, advertising identifiers, fingerprints, IP-derived identifiers or persistent cross-site IDs.

The client uses an ephemeral session ID and a local boolean `returning` marker. Builds send nothing externally unless `VITE_ANALYTICS_ENDPOINT` is configured.

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
- `tutorial_opened`, `tutorial_completed`, `tutorial_skipped` — onboarding funnel.
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

## Primary soft-launch questions

1. What share of sessions reach hero choice, first combat and first boss?
2. Where does onboarding abandonment occur?
3. How long do real combats and full runs take versus the pacing model?
4. Which encounters produce anomalous defeat rates or duration spikes?
5. How often do players use events and fusion before entering Loop 2?
6. What share of completed campaigns choose another loop versus cash-out?
7. Is rewarded reroll completion healthy without becoming required for progression?
8. Do returning sessions improve after balance/content changes?

`src/analytics/TelemetrySummary.ts` provides a deterministic first-pass aggregator for session return rate, onboarding completion, hero distribution, shop/reroll activity, rewarded-ad completion, event/fusion usage, loop depth, cash-out score and encounter win-rate/duration.

## Guardrails

Do not optimize ad impressions in isolation. Any ad-frequency experiment must also inspect run continuation, session duration, return behavior and completion rates. Do not add raw pointer paths, free-form text, device fingerprints or persistent user identifiers merely because the receiver can store them.
