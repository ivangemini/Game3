# Skill: Gameplay & Interaction

Use for inventory manipulation, combat feel, input, drag/drop, touch behavior and moment-to-moment feedback.

## Interaction principles
- Dragging an item must feel direct: pick-up lift, valid/invalid placement preview, snap, impact response.
- Desktop and touch are equal targets. Never require hover to understand a critical rule.
- Minimum touch targets should be comfortable; avoid tiny precision placement.
- Item rotation should be one deliberate action and never happen accidentally while dragging.
- Invalid actions explain themselves visually rather than silently failing.
- During combat, the player should understand which item triggered and what it affected.

## Inventory rules
- Grid logic belongs in deterministic domain code, not scene coordinates.
- Shapes are integer cell masks with explicit rotation.
- Placement previews show occupied cells before commit.
- Boss effects that move/block cells must preserve deterministic resolution order.
- Auto-arrange, if added later, must never be stronger than manual mastery by default.

## Combat
- Combat simulation must not depend on render FPS.
- Telegraph high-impact boss actions.
- Resolve simultaneous effects with a documented priority/order.
- Keep normal battles short. Extend excitement through build decisions, not sponge HP.

## Feel budget
For every major action implement at least two feedback channels where appropriate: motion, scale, particles, sound, flash, number pop, trail, shake, UI response.

## Failure states
A loss should teach the player why it happened and surface an immediate next action: retry, alter build, unlock discovery, or rewarded revive when platform policy allows.