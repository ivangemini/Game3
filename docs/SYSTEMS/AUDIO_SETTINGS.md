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

## Procedural music foundation

`musicPattern.ts` provides deterministic menu/combat/boss steps. `GameAudio` schedules a lightweight music bed after audio unlock:
- menu: slowest and quietest;
- combat: shorter cadence and higher gain;
- boss: fastest cadence and strongest bed.

`combat.start` switches the music mode; victory/defeat returns to menu. The scheduler does not advance gameplay time and emits no notes while the AudioContext is suspended.

This is a functional prototype music layer, not final composition. Final launch work still includes authored/recorded music assets, mix tuning, transitions/ducking and portal/ad lifecycle coordination.

## Non-combat visual feedback

`RunFeedback` provides sparse presentation-only feedback for:
- bought-and-packed junk;
- coin rewards;
- event item drops;
- fusion completion;
- backpack pocket unlocks.

Reduced Motion keeps readable static feedback while removing bursts/travel animation. These effects never mutate run state.
