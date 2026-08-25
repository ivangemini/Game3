# Platform Integration

## Runtime boundary

Gameplay and UI code must not call a portal SDK directly. Portal capabilities live behind `PlatformAdapter` and are selected by `platformFactory` during bootstrap.

Implemented adapters:

- `LocalPlatformAdapter` — standalone/dev fallback; ads are unavailable.
- `YandexPlatformAdapter` — current Yandex Games SDK loader, Game Ready, Gameplay API and fullscreen/rewarded advertising callbacks.
- `CrazyGamesPlatformAdapter` — CrazyGames SDK v3 initialization, loading markup, gameplay markup and midgame/rewarded advertising callbacks.

The browser bootstrap stores the selected adapter in the Phaser registry under `junkpack.platform-adapter`.

## Portal selection

Normal builds auto-detect the embedding portal using injected SDK globals, hostname and referrer. QA can force an adapter with:

- `?platform=local`
- `?platform=yandex`
- `?platform=crazygames`

A portal initialization failure must not make the game unplayable. Bootstrap logs the failure and falls back to the local adapter.

## Loading contract

### Yandex Games

1. Load the current SDK loader (`/sdk.js` for Yandex-hosted archives, the documented absolute SDK URL for own-domain hosting).
2. Await `YaGames.init()`.
3. Construct the game and required launch assets.
4. Call `LoadingAPI.ready()` only after the runtime atlases finish preloading and the game can be interacted with.

### CrazyGames

1. Load CrazyGames SDK v3.
2. Await `CrazyGames.SDK.init()` before using SDK modules.
3. Call `game.loadingStart()` after initialization while the Phaser runtime is being created.
4. Call `game.loadingStop()` only after the runtime preload completes.

## Gameplay markup

`PlatformAdapter.gameplayStart()` and `gameplayStop()` are intentionally separate from bootstrap. They are wired to actual encounter start/result boundaries rather than menus or fake SDK-checklist events. Combat starts markup only after `CombatPanel.startEncounter()` succeeds; result/refresh transitions stop it.

## Advertising contract

`PlatformLifecycleHooks` are mandatory for real ads. When an ad starts:

1. custom WebAudio is suspended;
2. the Phaser loop sleeps;
3. no reward is granted yet.

When an ad closes, finishes, fails or is unavailable:

1. the Phaser loop wakes when appropriate;
2. WebAudio resumes only if the page is visible and audio had already been unlocked;
3. rewarded value is granted only when the platform's completion/reward callback confirms it.

### Result semantics

Interstitial: `shown | unavailable | failed`.

Rewarded: `rewarded | dismissed | unavailable | failed`.

A caller must never interpret `dismissed`, `unavailable` or `failed` as a completed reward.

## Implemented placements

### Rewarded shop reroll

The Junk Shop exposes an optional `FREE REROLL` only on non-local portal adapters. It locks against duplicate requests while the ad is open and advances the same deterministic `shopIndex` used by paid rerolls only after a confirmed `rewarded` result. Dismissed, unavailable and failed ads keep the current shop and spend nothing.

### Cycle-boundary interstitial

Interstitials are requested only from the safe decision after completing a full campaign/Corrupted Loop cycle, before choosing to continue deeper or cash out. Failure/unavailability never blocks progression.

`AdBreakPolicy` provides conservative launch guards:

- no immediate opening interstitial;
- at least 120 seconds before the first eligible interstitial;
- at least 180 seconds between shown interstitials;
- never during active gameplay;
- only `boss-result`, `cycle-boundary` and `run-end` are valid policy break categories.

Portal-side frequency controls still apply. The local policy is an additional gameplay-quality guardrail, not a replacement for portal rules.

## Automated repository coverage

Repository tests cover platform detection/QA overrides, Yandex and CrazyGames initialization/callback contracts, reward semantics, ad-break policy, asset-ready timing and browser-shell behavior. The Playwright release matrix is configured for Chromium, Firefox and WebKit across desktop, compact/mobile landscape and portrait/orientation transitions. Real portal SDK tester validation remains separate because repository CI does not run inside the portals' production/tester frames.

## Remaining portal acceptance work

These tasks require a real portal preview/build or explicit product decision and therefore cannot be closed by repository-only work:

- validate Yandex debug-panel Game Ready and gameplay markup timing in a submitted/preview build;
- exercise Yandex fullscreen/rewarded callbacks with the portal's real ad inventory;
- validate CrazyGames SDK tester loading/gameplay markup and both ad formats;
- verify overlay audio/pause/resume and visibility changes in real portal iframes;
- confirm generated icon/cover/hero art against each portal's current metadata crop/moderation UI and add any portal-specific screenshots required at submission time;
- complete store copy, age/category/content metadata and each portal's moderation checklist;
- decide after soft-launch evidence whether cloud save or leaderboards justify backend/API scope.
