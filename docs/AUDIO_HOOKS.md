# Combat Audio Hooks

## Scope
P2 exposes an asset-agnostic audio contract. It does **not** ship final SFX, music, a browser audio unlock flow or a mixer yet; those remain part of the P6 presentation pass.

`src/game/audio/audioCues.ts` translates deterministic combat presentation events into stable cue IDs. `CombatPanel` forwards those cues through the optional `onAudioCue` callback.

Gameplay rules never depend on whether a sound is loaded, muted, throttled or played.

## Cue contract
Every cue carries:

- a stable semantic `id` such as `boss.magnet.telegraph` or `combat.victory`;
- combat timestamp `atMs`;
- priority from 1 (frequent/noisy) to 4 (must-read impact/outcome);
- a semantic group for future mixer voice budgets;
- a suggested cooldown for future repetition throttling;
- `sourceId` when an item/enemy source is meaningful.

The ID describes **meaning**, not a filename. Final assets can therefore be swapped, randomized or localized without changing combat code.

## Readability policy
Frequent item triggers sit at priority 1. Direct player hits and boss telegraphs are priority 3. Boss impacts and victory/defeat are priority 4. A future mixer should allow high-priority cues to survive dense autobattler traffic while low-priority cues may be throttled or voice-limited.

Boss telegraph and impact are separate cues for all three current interference systems:

- Channel Jam;
- Slime Signal;
- Magnet Scramble.

This mirrors visual anticipation → impact timing and makes boss mechanics readable without relying on screen effects alone.

## P6 implementation requirements
When real audio is added:

1. unlock/resume WebAudio only after a valid user interaction where browsers require it;
2. keep SFX/music volume separately configurable and persistent;
3. apply per-group voice budgets and the cue cooldown metadata;
4. pause/duck correctly for tab visibility and portal ad lifecycle;
5. use several controlled variants/pitch offsets for high-frequency item sounds;
6. preload only critical short SFX on mobile and load larger music assets deliberately.

No future mixer may feed timing or state back into the combat simulation.
