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
- [x] 8 prototype absurd-junk items
- [x] 5 real side-contact gameplay synergies with deterministic derived bonuses
- [x] Live synergy links, active-link badges and activation feedback
- [x] Basic seeded shop/reward choice with run currency and deterministic rerolls
- [x] Purchased junk enters the real backpack through deterministic legal placement
- [x] Save/restore current run: backpack, rotations, loot sequence, seed, coins, shop step and sold offers
- [x] Versioned save v4 with v1/v2/v3 migrations, encounter claims and perk state
- [ ] Final interaction polish against real runtime/assets

**Gate:** arranging items is satisfying before combat exists. Current prototype has drag lift, placement previews, elastic snap, invalid-action feedback and synergy activation feedback; final polish remains tied to runtime visual review.

## P2 — Combat vertical slice [IN PROGRESS]
- [x] Deterministic combat clock/effect queue independent of render FPS
- [x] Player HP/shield, enemy HP and recurring enemy attacks in domain logic
- [x] Item trigger system consuming backpack-derived speed/poison/laser/chaos/armor bonuses
- [x] Poison tick clock, stable equal-time effect ordering and victory/defeat outcomes
- [x] Presentation-event stream for Phaser VFX/UI without putting rules in the scene
- [x] Rendered normal test enemy with live HP/shield/poison HUD
- [x] Start/restart combat from the current backpack snapshot
- [x] Lightweight hit/outcome feedback with reduced-motion behavior
- [x] First boss prototype: TV Tyrant with deterministic Channel Jam
- [x] Boss telegraph event before interference impact
- [x] Jammed items lose scheduled triggers in domain simulation, not just visually
- [x] Victory rewards feed the real run/shop economy
- [x] Encounter rewards are claim-once per run and persisted
- [ ] Second TV Tyrant interference: slime/block backpack cells
- [ ] Third TV Tyrant interference: telegraphed row scramble / magnet displacement
- [ ] Audio hooks

**Gate:** one full mini-run is understandable and fun.

## P3 — Roguelite run [IN PROGRESS]
- [x] Seeded shops/rewards foundation
- [x] Deterministic 3-choice perk generation excluding already-owned perks
- [x] Boss-victory perk overlay with persisted pending choice
- [x] Six prototype perks that modify tagged combat items
- [x] Selected perks persist and affect subsequent combat snapshots
- [ ] world modifier system
- [ ] events
- [ ] run end + restart
- [ ] first-boss target pacing 3–5 min

## P4 — Content-efficient depth
- [ ] 35–45 launch items
- [ ] 20–30 fusion recipes
- [ ] tag/synergy families
- [ ] 4 heroes
- [ ] 6 boss families + modifiers
- [ ] 20–25 perks
- [ ] ~15 mutations/events pool

## P5 — Retention/meta
- [ ] Itemdex + Recipe Book
- [ ] unlock milestones
- [ ] Daily seeded run
- [ ] Endless mode + score
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
- [ ] automated domain tests
- [ ] seeded simulation/balance reports
- [ ] mobile/browser matrix
- [ ] save migrations/recovery
- [ ] performance profiling and asset budgets
- [ ] portal-specific compliance checks

## P9 — Soft launch & iteration
- [ ] release candidate to first portals
- [ ] measure tutorial completion/first boss/run duration/return behavior
- [ ] tune difficulty/economy/ad pacing
- [ ] add content only after core retention signals justify it
