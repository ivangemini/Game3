# Skill: Audio & Sound Design

Use for music, SFX, mixing, trigger rules and browser audio lifecycle.

## Principles
- Audio communicates cause and consequence; do not add noise merely because an animation exists.
- Give item families recognizable sonic identities: mechanical clicks/electricity, slime squish, pet chirps, poison fizz, chaos stingers.
- Important actions need layered but short sounds: pickup, snap/drop, synergy trigger, boss telegraph, boss impact, reward reveal.
- Avoid repeating one loud sample every attack; vary pitch/selection within controlled limits.
- Keep combat readable when many items trigger simultaneously by prioritizing high-information sounds.
- Music should leave frequency/dynamic space for effects and intensify around bosses without requiring many bespoke tracks.

## Web rules
Respect autoplay restrictions. Start/resume audio only after valid user interaction when required. Pause/duck correctly for visibility changes and ads. Expose music/SFX volume separately and persist settings.

## Performance
Prefer compressed web-friendly assets, preload only critical sounds, and avoid dozens of simultaneous long voices on mobile.