# Presentation Chrome and Onboarding

## Scope
This P6 block improves presentation/readability without replacing the stable 1600×900 gameplay coordinate system or the existing `Phaser.Scale.FIT` portal behavior.

## Responsive top chrome
Top-level meta/run actions are owned by `TopHudActions` rather than scattered scene methods.

`src/game/domain/hudLayout.ts` maps the actual CSS display width to two presentation modes:
- **wide** for portal/desktop containers at 1050 CSS px or above;
- **compact** below that threshold for smaller embeds and mobile browser layouts.

Both modes use the same logical game canvas. The responsive change affects button arrangement, label density and hit-target placement, not gameplay coordinates or simulation.

The action set is:
- Daily Run;
- How To Play;
- Junk Archive;
- Trophy Shelf;
- New Run / Reset.

Layout tests require every action to remain inside the logical 1600 px width and prevent action hit-target overlap in both modes.

`TopHudActions` listens to Phaser scale-manager resize events and rebuilds the action chrome only when the responsive mode changes. This avoids per-frame layout allocation.

## Modal priority
Collection, Trophy Shelf and How To Play are between-decisions overlays. While any is visible, encounter start, fusion, cash-out and Corrupted Loop entry remain blocked.

Daily restart and New Run / Reset are also blocked during combat, pending event/perk state or open meta/tutorial overlays. A presentation control must never erase or advance gameplay through a modal-state race.

## First-run onboarding
`src/game/domain/onboarding.ts` owns five compact tutorial steps:
1. hero choice;
2. backpack placement/rotation;
3. orthogonal side-contact synergies;
4. automatic combat + boss counterplay;
5. fusion after Boss 1 + Corrupted Loop continuation.

The tutorial intentionally teaches the existing core loop instead of adding a separate training level.

Automatic presentation occurs only when:
- there was no resumable active run on load;
- discovered item count is zero;
- discovered recipe count is zero.

This uses existing state and therefore requires no save migration. Returning players can reopen the same overlay through `? HOW TO PLAY`.

## Motion and accessibility
`TutorialOverlay` uses a short 180 ms entrance and 140 ms exit fade. When reduced motion is enabled, those transitions are removed and visibility changes are immediate.

Tutorial navigation itself uses static, readable state changes rather than continuous animation.

## Remaining validation
The deterministic layout/onboarding contracts are covered by TypeScript/Vitest/build gates. Final browser visual validation across desktop and narrow mobile viewports remains required before the full P6 responsive-HUD/onboarding roadmap lines can be declared finished.
