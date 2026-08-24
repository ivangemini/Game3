# Skill: Animation, VFX & Juice

Use for tweens, transitions, combat impact, item activation feedback, boss telegraphs, particles and screen motion.

## Motion language
- Snappy inventory interaction; weighty boss motion; elastic absurd-item reactions.
- Prefer 120–220 ms for tiny UI responses, 180–350 ms for placement/activation, longer only for major rewards or boss beats.
- Use anticipation → action → settle for important events.
- Avoid constant motion everywhere; motion must indicate state or create payoff.

## Required feedback examples
- Pick up: 3–6% scale lift + shadow/depth change.
- Valid hover: cell highlight + subtle pulse.
- Drop: snap + small squash/impact + short sound hook.
- Synergy activation: directional trail from source to target; do not just glow both items.
- Boss backpack attack: telegraph target cells before mutation, then impact, then changed-state hold.
- Rare reward: staged reveal, not an instant card swap.

## Camera/screen shake
Use sparingly. Inventory manipulation should remain stable. Strong shake is reserved for boss impacts, explosive builds and major milestones.

## Performance
Pool frequent particles and transient objects. Cap simultaneous effects. Test on mobile; never trade readability or frame stability for particle count.

## Accessibility
Offer reduced-motion behavior for large camera movement/flash sequences when practical.