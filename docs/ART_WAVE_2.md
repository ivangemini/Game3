# Authored Art Wave 2 — Boss Families

## Scope
Wave 2 completes authored gameplay portraits for all six boss families while keeping combat rules presentation-agnostic.

### Authored boss portraits
- TV Tyrant — broadcast/glitch silhouette, magenta signal accent.
- Deadline Snail — clock shell + overdue invoice; Time Tax reads before text.
- Closet Monster — wardrobe jaws + loose junk; Clutter Crush identity.
- Baby Moon — crescent/eclipsed face; Tag Eclipse identity.
- Copycat Auditor — twin eyes + duplicate paperwork/stamp motif.
- Border Shark — shark trapped in a glowing perimeter frame; Edge Rent identity.

Runtime paths:
- `/assets/art/bosses/tv-tyrant.svg`
- `/assets/art/bosses/deadline-snail.svg`
- `/assets/art/bosses/closet-monster.svg`
- `/assets/art/bosses/baby-moon.svg`
- `/assets/art/bosses/copycat-auditor.svg`
- `/assets/art/bosses/border-shark.svg`

Stable texture keys use `boss.<boss-id>`. Corrupted IDs such as `loop-4-border-shark` resolve to the same family key.

## Presentation contract
`BossPortraitLayer` owns portrait lifecycle and motion. `CombatFeedback` only forwards semantic combat phases:

1. `combat.start` selects the family portrait from enemy ID;
2. boss `*.telegraph` cues trigger the family telegraph motion;
3. boss impact cues trigger the family impact motion;
4. victory/defeat fades the portrait without touching simulation state.

### Motion identities
- TV Tyrant: signal sway → flicker telegraph → glitch impact.
- Deadline Snail: slow float → compressed deadline anticipation → forward snap.
- Closet Monster: breathing wardrobe → opening/lunge anticipation → heavy slam.
- Baby Moon: orbital tilt → eclipse lean/fade → flare.
- Copycat Auditor: stamp bob → double-stamp telegraph → hard stamp impact.
- Border Shark: horizontal patrol → edge charge → bite/lateral impact.

Reduced Motion disables perpetual idle movement and replaces telegraph/impact travel with a short alpha/scale accent so mechanical causality remains visible.

## QA contract
- authored-art manifest contains exactly six boss entries;
- campaign and corrupted IDs resolve to identical family keys;
- every boss family has a distinct telegraph, impact and accent spec;
- non-boss enemies do not resolve to authored boss art;
- VFX/audio/presentation remain unable to alter deterministic combat state.

## Remaining art work
Boss portrait coverage is complete, but P6 final art remains open until:
- remaining item catalog receives reviewed authored art;
- UI/boss assets are packed/compressed into production atlases where beneficial;
- real mobile/browser gameplay-size review passes;
- store/loading/thumbnail art is authored and validated.
