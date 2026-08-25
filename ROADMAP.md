# Game3 Roadmap

## P0 — Foundation [DONE]
- [x] Product concept and scope boundaries
- [x] Agent operating manual
- [x] Specialized design/gameplay/animation/economy/web/QA skills
- [x] Architecture + art direction sources of truth
- [x] Phaser/Vite/TypeScript scaffold
- [x] CI quality gates

## P1 — Backpack vertical slice [DONE]
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
- [x] Final interaction implementation (**lift/depth, validity-weight feedback, cell previews/flashes, elastic two-stage snap, invalid shake, reward arrival, rotation impact, pocket reveal and directional multi-trail synergy activation**)

**Gate:** arranging items has the complete intended interaction language in code. Real-browser/mobile feel acceptance is tracked under P8 rather than leaving the gameplay feature itself open.

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
- [x] Twenty-seven prototype perks that modify tagged combat items through the shared bonus vocabulary
- [x] Selected perks persist and affect subsequent combat snapshots
- [x] Six-world base campaign: **3 encounters per world / 18 total**, using all six authored boss families
- [x] World 5 sequence: Carbon Copy Clerks → Mirror Mule → Copycat Auditor
- [x] World 6 sequence: Edge Eel Syndicate → Rent Collector Crab → Border Shark
- [x] Unique encounter IDs, per-encounter rewards and score progression
- [x] Difficulty/reward escalation across all six campaign worlds
- [x] Campaign clear decision after encounter 18: Escape/Cash Out or Go Deeper with the same build
- [x] Corrupted Loops intentionally remain **4 worlds / 12 encounters** using the same build
- [x] Loop depth scales enemy HP/damage/speed and base payout
- [x] Loop worlds stack 2 mutations in Loop 2, 3 in Loop 3 and up to 4 deeper
- [x] Safe cash-out only at cycle boundaries; entering a loop commits the player to the full cycle
- [x] Deepest completed corrupted loop persisted in meta save
- [x] Six launch world mutations for campaign/Loop 2 plus six deep-loop anomaly modifiers from Loop 3 onward
- [x] Fifteen deterministic surreal run events with two choices each
- [x] Events trigger after the first fight of each world, persist across reload and block progression until resolved (**6 event opportunities in campaign, 4 per loop**)
- [x] Event choices consume/award the real run currency and can grant real backpack items
- [x] Eight alternate non-boss corrupted enemy families from Loop 3 onward without increasing loop encounter count
- [x] Twenty-four prototype fusion recipes with deterministic ingredient/result handling
- [x] Fusion unlocks after Boss 1 and respects currently locked backpack cells
- [ ] Runtime pacing validation: first boss **3–5 min**, six-world base campaign **32–42 min**, campaign + Loop 2 **55–75 min**, Loop 3 completion **80+ min**. Seeded target-model regression coverage plus run-start-anchored p50/p90 first-boss/base-campaign telemetry are implemented; real play traffic remains required.

## P4 — Content-efficient depth [DONE]
- [x] 35–45 launch base items (**36 prototype base items implemented**)
- [x] 20–30 launch fusion recipes (**24 prototype recipes implemented**)
- [x] Expanded tag/synergy-family foundation: 10 spatial contact rules across core + food/antenna/slime cross-links
- [x] 4 prototype heroes with persisted per-run choice and real economy/combat effects
- [x] 6 boss families + modifiers (TV Tyrant + Deadline Snail + Closet Monster + Baby Moon + Copycat Auditor + Border Shark)
- [x] 20–25 launch perks (**21 reached launch target; Wave 5 expands the pool to 27**)
- [x] ~15 launch mutation/event pool (**6 world mutations + 9 run events = 15 originally reached the target**)
- [x] Late-run second-stage evolution pool: **4 fusion-only transformations** with no extra save gating
- [x] User-directed Wave 5 deep-content expansion (**+6 perks, +6 run events, +6 Loop 3+ anomaly modifiers, +8 alternate non-boss corrupted enemy families; item/recipe atlas stays 60/24**)
- [x] Long-session campaign expansion (**4→6 worlds, 12→18 campaign encounters, all six boss families in base run; Corrupted Loops stay 12 encounters**)

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
- [x] Tactile core gameplay UI foundation (**leather/scrap backpack shell, explicit locked pockets, silhouette item glyphs, rarity frames, restyled junk shop/fusion lab/run panel and stronger logical typography**)
- [ ] Full in-game HUD reflow / small-text legibility on real mobile landscape (**logical hierarchy + automated 844×390 Chromium/WebKit browser acceptance pass; physical-device human legibility/touch review remains**)
- [x] Item art replacement pipeline foundation (**stable `junk-items` atlas + `item.<definitionId>` frame contract with automatic procedural fallback**)
- [x] Authored art wave 1 (**12 high-frequency item SVGs + all 4 hero portraits + TV Tyrant combat portrait; lazy TextureManager adoption with fallback and atlas-compatible keys**)
- [x] Authored boss art wave 2 (**all 6 boss-family SVG portraits + corrupted-ID mapping + family-specific idle/telegraph/impact motion with Reduced Motion fallback**)
- [x] Authored item art wave 2 (**20 additional item SVGs: remaining original shop/base set + 8 high-salience first-stage fusion results; total item-art coverage reached 32/60**)
- [x] Complete authored item catalog (**60/60 items: 36/36 shop/base + 24/24 fusion, including all 4 second-stage evolutions; exact catalog parity enforced by CI**)
- [x] Packed production item + portrait atlases (**deterministic build creates 60-frame 1280×1280 `junk-items` + 10-frame 1280×720 `junk-portraits`**)
- [x] Core UI atlas + authored HUD symbols (**10-frame 640×256 `junk-ui`; daily/archive/trophies/help/settings/reset + coin/fusion/pocket/logo sources; total authored runtime sources collapse from 80 standalone files to 3 atlas groups**)
- [ ] Final physical-device visual review refinements (**automated Chromium/Firefox/WebKit matrix is green; physical iOS/Android small-text/touch/crop review remains**)
- [x] Combat semantic feedback foundation (**30-object particle pool, item/status rings, hit bursts, boss-frame pulses, outcome flashes, restrained shake, reduced-motion fallback**)
- [x] Non-combat run feedback foundation (**shop purchase/reward/reroll/error SFX hooks, fusion reveal, event-drop toast, pocket-unlock feedback**)
- [x] Final animation/VFX implementation across backpack and rewards (**drag lift/drop/snap/invalid feedback, reward cards, coin staging, event drops, fusion anticipation/reveal/settle and directional synergy trails; runtime acceptance remains in P8**)
- [x] Autoplay-safe WebAudio SFX mixer foundation (**semantic cue fan-out, deterministic tonal patches, cooldowns, 10-voice priority budget, page visibility suspend/resume, persisted SFX volume**)
- [x] Procedural SFX texture pass (**one shared deterministic noise buffer, filtered transient sweeps for impacts/bosses/fusion/rewards and deterministic per-source offsets; no additional HTTP/audio-file payload**)
- [x] Procedural adaptive music implementation (**16-step deterministic menu/combat/boss phrases, intensity-specific cadence/gain, sparse sub accents, combat/boss swing and persisted Music volume**)
- [x] Priority-aware mix ducking (**boss telegraphs/player hits duck moderately; priority-4 boss impacts/outcomes duck strongly with deterministic attack/hold/release; user Music volume remains independent**)
- [ ] Final authored audio/music + physical mix pass (**optional authored samples/stems, speaker/headphone loudness/EQ tuning and real portal-ad mix acceptance remain; procedural runtime is complete**)
- [x] First-run onboarding flow (**hero choice + persistent Help entry point; full 5-step Field Manual is opt-in so first play reaches the run after one meaningful click**)
- [x] Final onboarding presentation implementation (**Field Manual layout, five step-specific visual diagrams, progress rail, step accents, transitions and Reduced Motion path**)
- [x] Branded runtime loading screen (**atlas progress, current-file status, asset-error fallback messaging and portal-ready signal gated until preload completes**)
- [x] Portal thumbnail/store art pipeline (**editable original compositions + generated/validated 512×512 icon, 800×470 cover and 1560×520 hero PNG; measured outputs 28.2/32.8/48.3 KiB**)

## P7 — Monetization & platform adapters [DONE]
- [x] Generic `PlatformAdapter` (**loading/gameplay lifecycle, interstitial/rewarded result contracts, destroy + pause/resume hooks and local fallback**)
- [x] Yandex Games adapter (**current SDK loader, `YaGames.init`, LoadingAPI, GameplayAPI, fullscreen/rewarded callbacks and safe failure fallback**)
- [x] CrazyGames adapter (**SDK v3 init, loading/gameplay markup, midgame/rewarded callbacks and safe failure fallback**)
- [x] Rewarded placement (**optional portal-only `FREE REROLL` in Junk Shop; no reward on dismiss/fail/unavailable, no duplicate in-flight requests**)
- [x] Natural-break interstitial flow (**cycle-boundary only, never during combat, first-ad delay + cooldown policy, transition continues on ad failure**)
- [x] Portal audio/pause lifecycle (**Phaser loop + custom WebAudio suspend for ads; visibility changes cannot prematurely resume ad-paused audio**)
- [x] Cloud/leaderboard launch decision (**deferred for soft launch; add only when retention/competitive behavior justifies backend/platform hooks**)

## P8 — QA, balance & performance
- [x] Automated deterministic tests for core run/fusion/event/hero/boss domains
- [x] Seeded pacing target simulation with percentile bands and target hit rates (**18-encounter campaign + 12-encounter loops modeled separately**)
- [x] Seeded combat/build simulation reports across weak/typical/strong power bands and boss checkpoints, including boss-rule wrappers
- [x] Campaign balance sampling excludes second-stage fusion results; loop checkpoints may sample them
- [x] Static asset + bundle budget gates (**runtime art + atlas texture + JS gzip ceilings remain CI-enforced**)
- [x] Portal adapter contract tests (**platform detection, strict host/referrer parsing, Yandex/CrazyGames initialization/rewarded lifecycle semantics, natural-break policy**)
- [x] Automated mobile/browser matrix (**Playwright production smoke across Chromium desktop/compact/mobile/portrait, WebKit mobile landscape and Firefox desktop; viewport/overflow/save recovery/console/network/atlas-first checks**)
- [x] Automated runtime performance regression smoke (**CI-safe RAF responsiveness ceiling, bounded render backing store, compact atlas-first network waterfall; intended to catch catastrophic regressions rather than claim device FPS**)
- [x] Browser-level portal bootstrap compliance harness (**forced Yandex/CrazyGames adapters with injected SDK doubles validate initialization/loading-ready lifecycle without external SDK fetches**)
- [x] Portal archive/compliance gates (**root index, required runtime atlases, path charset/whitespace, no source maps/source-art/store-art in runtime ZIP, Yandex/Crazy size/file-count ceilings, 20 MiB mobile target, context-menu suppression and one-click first launch are enforced by release/browser tests; measured candidate is 455.8 KiB ZIP / 1.66 MiB unpacked / 14 runtime files after stripping 86 non-runtime build files**)
- [x] Production dependency security gate (**Node 22 + exact direct tool versions; `npm audit --omit=dev --audit-level=high` is CI-required and current resolver reports 0 vulnerabilities**)
- [x] Save migrations/recovery UX (**v1–v7 → v8 migrations, previous-valid backup slot, corrupt-primary recovery, safe reset fallback and visible web-shell recovery/write warnings**)
- [ ] real-device performance profiling (**frame time, peak WebGL memory, portal network waterfall, low-memory lifecycle; automated regression baseline + capture protocol exist**)
- [ ] portal-specific compliance checks (**repository/unit/browser harness implemented; real Yandex debug panel / CrazyGames SDK tester acceptance still required**)

## P9 — Soft launch & iteration
- [x] Repository-built portal candidate pipeline (**production build → readiness/security checks → runtime-only ZIP + separate store art → v2 per-file SHA-256 manifest → integrity verification → CI artifact; strict `release:soft-launch` additionally requires HTTPS analytics endpoint**)
- [x] Privacy-minimal measurement pipeline (**strict versioned Node receiver → sanitized append-only NDJSON → deterministic JSON/Markdown report; receiver/report contracts and report CLI are CI-tested, raw exports are gitignored**)
- [x] Soft-launch pacing summary foundation (**session reach + average/median/p90 time-to-hero and first-combat latency; run-start-anchored first-boss and six-world campaign reach/duration; per-encounter win rate + average/median/p90 duration, without persistent identity**)
- [x] User-directed pre-traffic content expansion (**Wave 5 combinatorial depth + six-world/18-encounter base campaign; loops remain compact at 12 encounters**)
- [ ] release candidate to first portals
- [ ] measure tutorial/help usage/hero choice/first boss/six-world campaign duration/event choice/fusion usage/loop-entry/loop-completion/return behavior on real traffic
- [ ] tune difficulty/economy/ad pacing
- [ ] further content after the current expansion should be driven by core retention signals or another explicit product-direction change
