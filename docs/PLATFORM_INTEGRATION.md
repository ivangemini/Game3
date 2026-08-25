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
4. Call `LoadingAPI.ready()` when the game can be interacted with.

### CrazyGames

1. Load CrazyGames SDK v3.
2. Await `CrazyGames.SDK.init()` before using SDK modules.
3. Call `game.loadingStart()` after initialization while the Phaser runtime is being created.
4. Call `game.loadingStop()` when the runtime is playable.

## Gameplay markup

`PlatformAdapter.gameplayStart()` and `gameplayStop()` are intentionally separate from bootstrap. They must be called only around real gameplay boundaries (fight/run resume vs menus/results/pause) because both portals require accurate markup. Do not emit fake start/stop pairs merely to satisfy an SDK checklist.

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

## Natural-break policy

`AdBreakPolicy` blocks interstitials during active gameplay and provides conservative launch defaults:

- no immediate opening interstitial;
- at least 120 seconds before the first eligible interstitial;
- at least 180 seconds between shown interstitials;
- only `boss-result`, `cycle-boundary` and `run-end` are valid break categories.

Portal-side frequency controls still apply. The local policy is an additional gameplay-quality guardrail, not a replacement for portal rules.

## Remaining portal acceptance work

These tasks require a real portal preview/build or product decision and are therefore not considered complete from repository-only work:

- wire explicit rewarded offers into chosen player-facing placements;
- wire interstitial requests into approved natural breaks using `AdBreakPolicy`;
- validate Yandex debug-panel Game Ready / gameplay markup;
- validate CrazyGames SDK tester and ad callbacks;
- verify ad overlay audio/pause behavior in real browsers;
- decide whether launch needs cloud save and leaderboards before adding those APIs;
- complete each portal's store metadata, screenshots/thumbnail and moderation checklist.
