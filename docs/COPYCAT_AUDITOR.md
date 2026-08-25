# Copycat Auditor Boss Family — Duplicate Debt

## Fantasy
Copycat Auditor is a corrupted-loop boss that treats repeated junk as accounting fraud. It does not care whether two items share a tag; it looks for the exact same item definition appearing multiple times and invoices the most repeated one.

## Core rule
`Duplicate Debt` groups the immutable combat-start build by `definitionId`, selects the definition with the most copies and resolves ties lexically for deterministic playback.

The boss then:
1. telegraphs every copy of the targeted definition;
2. shows how many copies are "extra" beyond the first safe copy;
3. after the telegraph, deals **4 damage per extra copy**;
4. lets shield absorb the fine before HP;
5. repeats on a deterministic cadence.

The base rule uses a 5.6s cadence with a 1.1s telegraph. A build with three Laser Cats therefore has two extra copies and takes 8 pre-shield damage per impact. A build with no exact duplicates still receives a readable zero-damage tell rather than a hidden no-op.

## Counterplay
Duplicate Debt changes item valuation without hard-locking any archetype.

Viable counters:
- diversify exact item definitions while keeping the same tag/synergy family;
- fuse repeated ingredients into a new definition before the corrupted boss;
- preserve shield generation and intentionally absorb the fine;
- keep a duplicate-heavy engine if its output is strong enough to justify the recurring cost.

The rule must never require one specific item or fusion.

## Corrupted Loop placement
The base campaign stays at 12 encounters and keeps its four teaching bosses. In **even Corrupted Loops**, the World 2 boss slot swaps Deadline Snail for Copycat Auditor. In odd corrupted loops, Deadline Snail returns.

This alternation increases long-session boss variety without adding more encounters or bespoke worlds.

## Scaling
Corrupted IDs encode loop depth (`loop-N-copycat-auditor`). Loop depth shortens cadence with a 3.6s floor while damage per extra copy stays at 4. Difficulty therefore rises through decision pressure, not an escalating unavoidable damage coefficient.

## Determinism and presentation
Target grouping, tie-breaking, telegraph timing, shield resolution and HP damage live in `src/game/domain/bossCombat.ts`. Phaser only renders the resulting presentation events.

Events:
- `boss-duplicate-telegraph`;
- `boss-duplicate-impact`.

Semantic audio cues:
- `boss.duplicate-debt.telegraph` — priority 3;
- `boss.duplicate-debt.impact` — priority 4.
