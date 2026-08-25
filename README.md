# Game3 / Junkpack: Boss Rush

A web-first roguelite inventory autobattler / boss-rush about packing absurd junk, discovering spatial synergies and fighting bosses that attack the backpack's rules.

## Status

Soft-launch candidate hardening. The complete deterministic campaign/Corrupted Loop gameplay stack, authored item/boss UI art pipeline, versioned recovery-safe saves, portal adapters/ads, telemetry foundation and automated quality gates are implemented. Remaining work is concentrated in browser/real-device acceptance, portal tester compliance, final audio/presentation tuning and data-driven iteration. See `ROADMAP.md`.

## Stack

Phaser 4.2.1, TypeScript, Vite 8, Vitest, Playwright and Sharp-based asset tooling.

## Run locally

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

`npm run build` regenerates and validates runtime atlases, portal store art and bundle budgets. The GitHub Actions browser matrix exercises Chromium, Firefox and WebKit across desktop, compact/mobile landscape and portrait-orientation profiles.

## Portal QA overrides

The platform layer normally auto-detects its host. For SDK/integration testing, use:

```text
?platform=local
?platform=yandex
?platform=crazygames
```

See `docs/PLATFORM_INTEGRATION.md` before changing SDK or ad behavior.

## Soft-launch analytics

Telemetry is disabled externally unless `VITE_ANALYTICS_ENDPOINT` is configured. The client records an ephemeral session funnel for onboarding, hero choice, economy, combat pacing, events, fusion, loop depth and ad outcomes without a persistent user identity. See `.env.example` and `docs/ANALYTICS.md`.

## Agent workflow

Read `AGENTS.md` first. It routes work to specialized files in `skills/` and the source-of-truth design documents in `docs/`.

## Current gameplay/release foundation

- 4-world / 12-encounter campaign plus repeatable Corrupted Loops;
- 36 base items, 24 fusion recipes, 10 spatial synergies, 4 heroes, 21 perks and 6 boss families;
- deterministic seeded shops, events, combat and progression;
- tactile 6×5 backpack with progressive pocket unlocks and authored 60/60 item art;
- versioned v8 local saves with legacy migrations and automatic valid-backup recovery;
- Junk Archive, achievements, Daily runs and collection/meta progression;
- Yandex Games, CrazyGames and standalone adapters with loading/gameplay markup;
- optional rewarded shop reroll and conservative natural-break interstitial policy;
- autoplay-safe adaptive audio foundation with portal/ad pause-resume lifecycle;
- branded loading/store-art pipelines and asset/bundle budgets;
- privacy-minimal soft-launch telemetry and deterministic summary tooling;
- unit/domain tests plus multi-browser Playwright release smoke coverage.
