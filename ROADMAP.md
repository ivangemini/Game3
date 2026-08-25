# Game3 Roadmap

## P0 — Foundation [DONE]
- [x] Product concept and scope boundaries
- [x] Agent operating manual
- [x] Specialized design/gameplay/animation/economy/web/QA skills
- [x] Architecture + art direction sources of truth
- [x] Phaser/Vite/TypeScript scaffold
- [x] CI quality gates

## P1 — Backpack vertical slice [IN PROGRESS]
- [x] Deterministic grid/shape/rotation placement
- [x] Mouse + touch drag/drop foundation
- [x] Valid/invalid cell preview and snap-back
- [x] Selected-item rotation with placement validation
- [x] 8 prototype absurd-junk base items
- [x] 5 real side-contact gameplay synergies with deterministic derived bonuses
- [x] Live synergy links, active-link badges and activation feedback
- [x] Basic seeded shop/reward choice with run currency and deterministic rerolls
- [x] Purchased junk enters the real backpack through deterministic legal placement
- [x] Save/restore current run: backpack, rotations, loot sequence, seed, coins, shop step and sold offers
- [x] Versioned save v7 with legacy migrations, encounter claims, perk state, long-session progression and pending events
- [x] Progressive backpack: one lower pocket cell unlocks after Boss 1, Boss 2 and Boss 3
- [x] Shared backpack-layout domain for blocked pocket cells outside Phaser
- [ ] Final interaction polish against real runtime/assets

**Gate:** arranging items is satisfying before combat exists. Current prototype has drag lift, placement previews, elastic snap, invalid-action feedback, synergy activation feedback, fusion and mid-run backpack growth; final polish remains tied to runtime visual review.

## P2 — Combat vertical slice [DONE]
- [x] Deterministic combat clock/effect queue independent of render FPS
- [x] Player HP/shield, enemy HP and recurring enemy attacks in domain logic
- [x] Item trigger system consuming backpack-derived speed/poison/laser/chaos/armor bonuses
- [x] Poison tick clock, stable equal-time effect ordering and victory/defeat outcomes
- [x] Presentation-event stream for Phaser VFX/UI without putting rules in the scene
- [x] Rendered enemy with live HP/shield/poison HUD
- [x] Combat starts from immutable backpack/perk snapshot and locks inventory input until result
- [x] Lightweight hit/outcome feedback with reduced-motion behavior
- [x] TV Tyrant interference 1: deterministic Channel Jam with telegraph
- [x] TV Tyrant interference 2: Slime Signal targets an occupied backpack cell, telegraphs it, then suppresses touching item triggers
- [x] Slime Signal is visualized directly over the backpack grid
- [x] TV Tyrant interference 3: Magnet Scramble prioritizes metal-heavy rows, telegraphs the row and temporarily suppresses crossing item triggers
- [x] Magnet Scramble is introduced on Boss 2 rather than overloading the first boss, then escalates on Boss 3 / corrupted variants
- [x] Victory rewards feed the real run/shop economy
- [x] Encounter rewards are claim-once per run and persisted
- [x] Fused junk has distinct combat profiles and participates in the existing synergy/perk pipeline
- [x] Asset-agnostic combat audio cue hooks with priorities/cooldowns for the future mixer and final SFX

**Gate:** one full mini-run is understandable and fun. Final runtime/audio feel is polished during P6, but the combat feature contract is complete.

## P3 — Roguelite run [IN PROGRESS]
- [x] Seeded shops/rewards foundation
- [x] Deterministic 3-choice perk generation excluding already-owned perks
- [x] Boss-victory perk overlay with persisted pending choice
- [x] Six prototype perks that modify tagged combat items
- [x] Selected perks persist and affect subsequent combat snapshots
- [x] Four-world campaign: 3 encounters per world / 12 total
- [x] Unique encounter IDs, per-encounter rewards and score progression
- [x] Difficulty/reward escalation across the four worlds
- [x] Campaign clear decision: Escape/Cash Out or Go Deeper with the same build
- [x] Corrupted Loop foundation: another 4-world / 12-encounter cycle using the same build
- [x] Loop depth scales enemy HP/damage/speed and base payout
- [x] Loop worlds stack 2 mutations in Loop 2, 3 in Loop 3 and up to 4 deeper
- [x] Safe cash-out only at cycle boundaries; entering a loop commits the player to the full cycle
- [x] Deepest completed corrupted loop persisted in meta save
- [x] Seeded world mutation system with six prototype risk/reward rules that modify real encounter stats and payouts
- [x] Six deterministic surreal run events with two choices each
- [x] Events trigger after the first fight of each world, persist across reload and block progression until resolved
- [x] Event choices consume/award the real run currency and can grant real backpack items
- [x] Six prototype fusion recipes with deterministic ingredient/result handling
- [x] Fusion unlocks after Boss 1 and respects currently locked backpack cells
- [ ] Runtime pacing validation: first boss 3–5 min, base campaign 20–25 min, strong session 30–50 min, deep session 60+ min. Seeded target-model regression coverage is implemented; real play telemetry remains required.

## P4 — Content-efficient depth
- [ ] 35–45 launch base items
- [ ] 20–30 launch fusion recipes (6 prototype recipes implemented)
- [ ] tag/synergy families
- [ ] 4 heroes
- [ ] 6 boss families + modifiers
- [ ] 20–25 perks
- [ ] ~15 mutations/events pool (12 combined prototype rules/events currently)
- [ ] late-run secret transformations / second-stage evolutions

## P5 — Retention/meta
- [ ] Itemdex + Recipe Book UI
- [x] Discovery state for items and fusion recipes
- [ ] unlock milestones
- [ ] Daily seeded run
- [x] Corrupted Loop + score foundation
- [ ] achievements

## P6 — Presentation pass
- [ ] final art pipeline + atlases
- [ ] responsive game HUD
- [ ] animation/VFX pass
- [ ] audio/music implementation
- [ ] onboarding/tutorial polish
- [ ] loading/thumbnail/store art

## P7 — Monetization & platform adapters
- [ ] generic PlatformAdapter
- [ ] Yandex Games adapter
- [ ] CrazyGames adapter
- [ ] rewarded placements
- [ ] natural-break interstitial flow
- [ ] cloud/leaderboard hooks where justified

## P8 — QA, balance & performance
- [x] Automated deterministic tests for core run/fusion/event domains
- [x] Seeded pacing target simulation with percentile bands and target hit rates
- [ ] Seeded combat/build simulation balance reports
- [ ] mobile/browser matrix
- [ ] save migrations/recovery UX
- [ ] performance profiling and asset budgets
- [ ] portal-specific compliance checks

## P9 — Soft launch & iteration
- [ ] release candidate to first portals
- [ ] measure tutorial completion/first boss/base-campaign duration/event choice/fusion usage/loop-entry/loop-completion/return behavior
- [ ] tune difficulty/economy/ad pacing
- [ ] add content only after core retention signals justify it
