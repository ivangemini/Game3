# Release Acceptance Evidence

## Purpose

Repository CI already proves deterministic gameplay, browser compatibility, bundle/archive integrity and portal SDK contracts. It cannot honestly prove physical-device smoothness or real portal behavior. This evidence workflow makes that final manual gate reproducible instead of leaving results in ad-hoc notes.

The validator is **not** a replacement for physical iOS/Android testing or Yandex/CrazyGames Preview/Draft testing. It records those tests against one exact commit, CI run and verified portal artifact.

## Create an evidence file

```bash
npm run release:acceptance:template
```

This writes `reports/release-acceptance.json`. The `reports/` directory is gitignored because evidence can contain transient device/portal notes and belongs with the release record rather than source history.

Replace every placeholder and zero measurement with observations from the exact candidate being submitted.

## Physical-device evidence

At minimum record one landscape profile for:

- an older iPhone-class device using Safari/WebKit;
- a mid-range Android device using Chromium.

For both devices record:

- first interactive time;
- drag median/p95/worst frame time;
- dense boss-fight median/p95/worst frame time;
- canvas backing-store size and device pixel ratio;
- cold-cache request count/bytes;
- warm-cache request count/bytes;
- background → foreground recovery;
- portrait → landscape recovery;
- portal-ad overlay resume behavior;
- whether WebGL context loss/recovery was observed.

JS heap and approximate texture-memory measurements remain optional because mobile browser tooling does not expose them consistently.

The evaluator turns the existing P8 guidance into explicit release signals:

- median frame time above **33.4 ms** is a blocker because it indicates sustained performance below roughly 30 FPS;
- p95 frame time above **150 ms** is a blocker because long stalls are repeating rather than isolated;
- p95 above **50 ms** is a warning requiring human smoothness review;
- failed lifecycle or WebGL checks are blockers;
- unmeasured required fields keep the candidate `INCOMPLETE` rather than pretending they passed.

## Real portal evidence

The template contains separate required check sets for:

### Yandex Games

Draft/debug-panel initialization, loading/gameplay lifecycle, background and ad pause/resume, dismissed rewarded-ad behavior, fullscreen ads, context-menu suppression, save/reload, responsive presentation and metadata/crop review.

### CrazyGames

Developer Portal Preview initialization, loading/gameplay lifecycle, one-click first play, background and ad pause/resume, dismissed rewarded-ad behavior, midgame ads, outbound-link policy, responsive presentation and metadata/crop review.

Use `not-applicable` only when a check genuinely does not apply to the candidate/platform. A required check left `not-tested` keeps the candidate `INCOMPLETE`; a `fail` makes it `BLOCKED`.

## Validate and generate the report

```bash
npm run release:acceptance:check -- reports/release-acceptance.json --out reports/release-acceptance.md
```

Exit codes:

- `0` — `READY`;
- `1` — structurally valid evidence but `INCOMPLETE` or `BLOCKED`;
- `2` — malformed evidence/schema/CLI input.

The Markdown report includes candidate identity, blockers, missing evidence, warnings, device measurements and every required portal check.

## Status semantics

### READY

The evidence contains:

- a real commit SHA;
- a CI run ID;
- the SHA-256 digest of the verified portal artifact;
- a real test timestamp;
- one complete iOS profile;
- one complete Android profile;
- real Yandex Games Draft acceptance;
- real CrazyGames Preview acceptance;
- no recorded blockers.

`READY` means the technical release-acceptance evidence is complete. It does **not** claim that portal moderation will approve the game or that retention/KPI targets will be met.

### INCOMPLETE

No known failure is recorded, but one or more required physical/portal observations are missing.

### BLOCKED

At least one schema error, repeatable physical-device performance blocker or real portal check has failed.

## Candidate integrity rule

Do not combine evidence from different commits. The release ZIP, screenshots, device profiles and portal tests should all refer to the same `main` SHA/CI run wherever possible. If a code change lands after a physical/portal pass, create a new evidence record for the new candidate rather than silently carrying old acceptance forward.
