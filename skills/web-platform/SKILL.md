# Skill: Web Platform & Performance

Use for builds, portal SDK integration, save/auth/ads, loading, browser compatibility and performance.

## Architecture
Gameplay talks to a `PlatformAdapter` interface. Yandex, CrazyGames, Poki/other integrations implement adapters without leaking SDK calls into game scenes/domain logic.

## Web constraints
- Fast first load matters. Split or compress large assets; defer nonessential content.
- Canvas/WebGL resolution must scale sensibly on mobile rather than rendering huge offscreen buffers.
- Pause/resume correctly on visibility changes and ad lifecycle events.
- Audio must respect browser autoplay policies.
- Avoid assumptions about cookies, cross-origin storage or fullscreen availability.

## Save
Use versioned local persistence from day one. Portal cloud saves can layer on later. Writes should be debounced and robust against abrupt tab close.

## Ads
Pause simulation and audio when required by portal lifecycle. Reward only after confirmed completion callback. Treat failed/cancelled ads as a normal state.

## Build target
Produce static deployable assets from `npm run build`. No backend is required for the launch core loop.

## Performance budgets
- Target smooth play on mainstream mobile browsers.
- Pool frequently spawned objects/particles.
- Avoid per-frame allocations in hot paths.
- Prefer atlases and compressed assets when art arrives.
- Profile before adding expensive post-processing.