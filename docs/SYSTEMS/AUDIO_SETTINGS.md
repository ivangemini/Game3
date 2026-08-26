# Audio, Music & Presentation Settings

## Runtime contract

`GameAudio` is the only browser-audio runtime. Gameplay and UI code emit semantic `AudioCue` records; the mixer may throttle or drop cues without changing gameplay state.

The WebAudio context is created/resumed only after a real pointer or keyboard interaction. Page visibility suspends audio and only resumes a context that was previously unlocked by the player.

## Volumes

Save schema v8 already owns:
- `settings.musicVolume`
- `settings.sfxVolume`
- `settings.reducedMotion`

The Settings overlay edits a normalized draft, applies music/SFX in 10% steps, persists on `APPLY`, and updates `GameAudio` immediately. Reduced Motion is persisted through the same setting and refreshes the presentation scene so all existing UI/VFX objects use one consistent motion policy. No save migration is required.

## SFX mix

Semantic cue families now cover combat plus run UI actions:
- purchase;
- reroll;
- fusion;
- reward;
- error/confirm;
- backpack pocket unlock.

The mixer keeps a 10-voice budget, honors cue cooldowns and can evict lower-priority voices for high-information events. Final recorded samples can replace procedural patches without changing cue producers.

### Boss sonic identities

The launch boss-pressure families no longer share one generic telegraph/impact patch with only a pitch offset. `audioSynthesis.ts` now gives each family a deterministic procedural identity while preserving the same semantic cue contract:

- TV/channel jam: brittle CRT square-wave glitch and bright static;
- slime: low sine bends and wet low-pass noise;
- magnet scramble: rising electromagnetic saw sweeps and high-frequency discharge;
- eclipse: long descending tonal shadow with restrained filtered noise;
- Deadline Snail/time tax: explicit clock-like triple ticks before a low impact;
- Closet Monster/clutter: heavy low-frequency rumble and slam;
- Copycat Auditor/duplicate debt: paired stamp motifs in both telegraph and impact;
- Border Shark/edge rent: accelerating edge-charge sweep into a sharp bite-like impact.

Source IDs still apply the existing small deterministic pitch variation, so repeated encounters remain stable while avoiding exact machine-gun repetition. Automated synthesis tests assert finite patches, impact/telegraph dynamics and distinct launch-family telegraph signatures.

## Procedural music foundation

`musicPattern.ts` provides deterministic menu/combat/boss steps. `GameAudio` schedules a lightweight music bed after audio unlock:
- menu: slowest and quietest;
- combat: shorter cadence and higher gain;
- boss: fastest cadence and strongest bed.

`combat.start` switches the music mode; victory/defeat returns to menu. The scheduler does not advance gameplay time and emits no notes while the AudioContext is suspended.

This remains a functional procedural music layer rather than the final authored composition. Final launch work still includes optional authored/recorded music assets or stems, speaker/headphone mix tuning and real portal/ad mix acceptance.

## Non-combat visual feedback

`RunFeedback` provides sparse presentation-only feedback for:
- bought-and-packed junk;
- coin rewards;
- event item drops;
- fusion completion;
- backpack pocket unlocks.

Reduced Motion keeps readable static feedback while removing bursts/travel animation. These effects never mutate run state.
