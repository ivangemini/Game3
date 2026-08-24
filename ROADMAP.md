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
- [x] Versioned save v2 with v1 migration and corrupted-data fallback
- [ ] Full interaction/animation polish pass

**Gate:** arranging items is satisfying before combat exists.

## P2 — Combat vertical slice
- [ ] Deterministic combat clock/effect queue
- [ ] Player HP/defense and item trigger system
- [ ] One normal enemy
- [ ] One full boss: TV/Junk Magnet-style inventory interference
- [ ] Telegraphs, impacts, VFX/audio hooks
- [ ] Win/loss/result flow

**Gate:** one full mini-run is understandable and fun.

## P3 — Roguelite run
- [ ] Seeded shops/rewards
- [ ] 3-choice perk flow
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
