# Audio Runtime Contract

## Scope

Audio is implemented as a presentation-only WebAudio layer. Gameplay simulation, seeded RNG, combat outcomes and persistence never depend on whether audio is unlocked, muted, suspended, throttled or rendered.

`src/game/audio/audioCues.ts` translates presentation events into stable semantic cue IDs. `GameAudio` consumes those IDs through an autoplay-safe runtime mixer; the cue ID describes meaning rather than a filename, so future authored samples can replace or augment synthesis without changing gameplay code.

## Current runtime

The shipped foundation includes:

- browser-safe audio unlock on player input;
- independently persisted Music and SFX volumes;
- a 10-semantic-voice admission budget with priority eviction;
- per-cue cooldowns so dense autobattler item spam remains readable;
- deterministic source pitch variation for repeated item families;
- tonal synthesis plus filtered deterministic-noise transients for impacts, boss mechanics, fusion, rerolls and reward moments;
- 16-step deterministic menu/combat/boss phrases instead of the original short 8-step loop;
- light combat/boss swing and sparse sub accents through the existing music voice path;
- priority-aware music ducking: boss telegraphs/player hits duck moderately and priority-4 impacts/outcomes duck more strongly;
- page-visibility suspension and portal-ad suspend/resume hooks;
- no external audio-file request requirement for the current runtime.

## Cue contract

Every cue carries:

- a stable semantic `id` such as `boss.magnet.telegraph` or `combat.victory`;
- combat timestamp `atMs`;
- priority from 1 (frequent/noisy) to 4 (must-read impact/outcome);
- a semantic group for mixer policy;
- cooldown metadata;
- `sourceId` when an item/enemy source is meaningful.

High-frequency item triggers remain priority 1. Direct player hits and boss telegraphs are priority 3. Boss impacts and victory/defeat are priority 4. When the voice budget is full, stronger semantic cues may evict the oldest weaker voice; equal/lower-priority spam is rejected.

## Transient texture

`audioSynthesis.ts` defines both tonal and optional noise layers. Noise is not downloaded: `GameAudio` creates one deterministic one-second mono noise buffer per AudioContext and starts filtered slices from deterministic cue/source offsets. Each noise layer has a low/high/band-pass sweep, Q, envelope and gain.

The extra source/filter nodes remain part of the same semantic cue and therefore do not bypass the 10-voice budget. Tiny `item.trigger` feedback intentionally stays tone-only; high-salience impacts and staged UI receive transient texture.

## Adaptive music

`musicPattern.ts` exposes deterministic menu/combat/boss steps. The current phrases are 16 steps long, with stronger cadence/gain as intensity rises. Combat and boss modes use a small deterministic swing; selected accent steps drop an octave for a sparse sub pulse, while other accent steps provide higher harmonic punctuation.

Music runs through a dedicated user-volume gain and a separate duck gain. Ducking therefore never rewrites the stored Music volume.

## Lifecycle contract

1. AudioContext is created/unlocked only after valid player input.
2. `visibilitychange` suspends audio while the page is hidden.
3. Portal ad start suspends WebAudio and the Phaser loop.
4. Portal ad completion/failure resumes only when appropriate; a hidden page cannot prematurely resume audio.
5. `dispose()` stops semantic voices, clears timers/nodes and closes the context.

## Remaining P6 creative pass

The remaining open audio item is not missing infrastructure. It is a subjective authored-content/mix pass:

- decide whether selected high-salience cues benefit from short authored samples over the procedural layer;
- decide whether to keep procedural adaptive music or introduce compressed authored stems/loops;
- tune final loudness/EQ balance on physical phone speakers and headphones;
- confirm the final mix during real Yandex/CrazyGames ad overlays.

Any authored asset addition should preserve autoplay safety, portal suspend/resume behavior, the semantic cue API and the existing asset/download budgets. Audio must never feed timing or state back into combat simulation.
