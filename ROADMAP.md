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
- [x] 36 prototype absurd-junk base items
- [x] 10 real side-contact gameplay synergies with deterministic derived bonuses
- [x] Live synergy links, active-link badges and activation feedback
- [x] Basic seeded shop/reward choice with run currency and deterministic rerolls
- [x] Purchased junk enters the real backpack through deterministic legal placement
- [x] Save/restore current run: backpack, rotations, loot sequence, seed, coins, shop step and sold offers
- [x] Versioned save v8 with legacy migrations, hero choice, encounter claims, perk state, long-session progression and pending events
- [x] Progressive backpack: one lower pocket cell unlocks after Boss 1, Boss 2 and Boss 3 each unlock one
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
- [x] Combat starts from immutable backpack/hero/perk snapshot and locks inventory input until result
- [x] Lightweight hit/outcome feedback with reduced-motion behavior
- [x] TV Tyrant interference: Channel Jam, Slime Signal and Magnet Scramble with deterministic telegraphs
- [x] Baby Moon Tag Eclipse: dominant-tag telegraph + temporary family-wide trigger suppression
- [x] Deadline Snail Time Tax: fastest-item telegraph + one-shot delay of that item's next queued trigger
- [x] Closet Monster Clutter Crush: loose-item telegraph + shield-aware pressure from isolated junk
- [x] Copycat Auditor Duplicate Debt: exact-duplicate audit + shield-aware duplicate pressure
- [x] Border Shark Edge Rent: perimeter-item telegraph + shield-aware edge pressure
- [x] Boss-rule wrappers preserve render-chunk invariance and scale cadence in corrupted loops
- [x] Victory rewards feed the real run/shop economy
- [x] Encounter rewards are claim-once per run and persisted
- [x] Fused junk has distinct combat profiles and participates in the existing synergy/perk pipeline
- [x] Asset-agnostic combat audio cue hooks with priorities/cooldowns for the future mixer and final SFX

**Gate:** one full mini-run is understandable and fun. Final runtime/audio feel is polished during P6, but the combat feature contract is complete.

## P3 — Roguelite run [IN PROGRESS]
- [x] Seeded shops/rewards foundation
- [x] Deterministic 3-choice perk generation excluding already-owned perks
- [x] Boss-victory perk overlay with persisted pending choice
- [x] Twenty-one prototype perks that modify tagged combat items
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
- [x] Nine deterministic surreal run events with two choices each
- [x] Events trigger after the first fight of each world, persist across reload and block progression until resolved
- [x] Event choices consume/award the real run currency and can grant real backpack items
- [x] Twenty-four prototype fusion recipes with deterministic ingredient/result handling
- [x] Fusion unlocks after Boss 1 and respects currently locked backpack cells
- [ ] Runtime pacing validation: first boss 3–5 min, base campaign 20–25 min, strong session 30–50 min, deep session 60+ min. Seeded target-model regression coverage is implemented; real play telemetry remains required.

## P4 — Content-efficient depth [DONE]
- [x] 35–45 launch base items (**36 prototype base items implemented**)
- [x] 20–30 launch fusion recipes (**24 prototype recipes implemented**)
- [x] Expanded tag/synergy-family foundation: 10 spatial contact rules across core + food/antenna/slime cross-links
- [x] 4 prototype heroes with persisted per-run choice and real economy/combat effects
- [x] 6 boss families + modifiers (TV Tyrant + Deadline Snail + Closet Monster + Baby Moon + Copycat Auditor + Border Shark)
- [x] 20–25 perks (**21 prototype perks implemented**)
- [x] ~15 mutations/events pool (**6 world mutations + 9 run events = 15 combined entries**)
- [x] Late-run second-stage evolution pool: **4 fusion-only transformations** with no extra save gating

## P5 — Retention/meta [DONE]
- [x] Itemdex + Recipe Book UI (**Junk Archive: 60 item slots + 24 recipe slots, hidden unknown payloads, pagination and collection progress**)
- [x] Discovery state for items and fusion recipes
- [x] Unlock milestones (**5 derived Archive Ranks with cosmetic seals; final Void Archivist requires full current collection + Corrupted Loop 2**)
- [x] Daily seeded run (**UTC `daily:YYYY-MM-DD` identity reusing the full deterministic campaign pipeline**)
- [x] Corrupted Loop + score foundation
- [x] Achievements (**13 derived Trophy Shelf goals across items, recipes, secret evolutions and loop depth**)

## P6 — Presentation pass [IN PROGRESS]
- [x] Responsive web-shell foundation (**safe-area insets, portrait orientation gate, compact-landscape viewport profile and resize/orientation sync**)
- [x] Shared UI motion foundation (**120–180 ms overlay transitions, 3% press feedback, reduced-motion fallback, Archive/Trophy progress bars**)
- [x] Responsive top action chrome (**wide/compact layouts, collision-tested 6-action hit targets, resize switching, protected reset/daily/settings actions**)
- [x] Settings UI (**persisted Music/SFX 0–100% controls + Reduced Motion toggle; volume changes apply live, motion refreshes presentation consistently**)
- [ ] Full in-game HUD reflow / small-text legibility on real mobile landscape
- [ ] final art pipeline + atlases
- [x] Combat semantic feedback foundation (**30-object particle pool, item/status rings, hit bursts, boss-frame pulses, outcome flashes, restrained shake, reduced-motion fallback**)
- [x] Non-combat run feedback foundation (**shop purchase/reward/reroll/error SFX hooks, fusion reveal, event-drop toast, pocket-unlock feedback**)
- [ ] Final animation/VFX pass across backpack drag/drop, reward staging and final art assets
- [x] Autoplay-safe WebAudio SFX mixer foundation (**semantic cue fan-out, deterministic synth patches, cooldowns, 10-voice priority budget, page visibility suspend/resume, persisted SFX volume**)
- [x] Procedural adaptive music foundation (**deterministic menu/combat/boss patterns, persisted Music volume and semantic combat-mode switching**)
- [ ] Final audio/music asset pass (**authored samples/music, mix tuning, transitions/ducking and portal/ad lifecycle integration**)
- [x] First-run onboarding flow (**5-step hero → pack → synergy → fight → fusion tutorial, reduced-motion support and persistent Help entry point**)
- [ ] Final onboarding visual polish against real browser/art assets
- [ ] loading/thumbnail/store art

## P7 — Monetization & platform adapters
- [ ] generic PlatformAdapter
- [ ] Yandex Games adapter
- [ ] CrazyGames adapter
- [ ] rewarded placements
- [ ] natural-break interstitial flow
- [ ] cloud/leaderboard hooks where justified

## P8 — QA, balance & performance
- [x] Automated deterministic tests for core run/fusion/event/hero/boss domains
- [x] Seeded pacing target simulation with percentile bands and target hit rates
- [x] Seeded combat/build simulation reports across weak/typical/strong power bands and boss checkpoints, including boss-rule wrappers
- [x] Campaign balance sampling excludes second-stage fusion results; loop checkpoints may sample them
- [ ] mobile/browser matrix
- [ ] save migrations/recovery UX
- [ ] performance profiling and asset budgets
- [ ] portal-specific compliance checks

## P9 — Soft launch & iteration
- [ ] release candidate to first portals
- [ ] measure tutorial completion/hero choice/first boss/base-campaign duration/event choice/fusion usage/loop-entry/loop-completion/return behavior
- [ ] tune difficulty/economy/ad pacing
- [ ] add content only after core retention signals justify it
