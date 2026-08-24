# Game3 / Junkpack: Boss Rush

A web-first roguelite inventory autobattler / boss-rush about packing absurd junk, discovering spatial synergies and fighting bosses that attack the backpack's rules.

## Status
Pre-production + first vertical-slice foundation. See `ROADMAP.md`.

## Stack
Phaser 4.2.1, TypeScript, Vite 8, Vitest.

## Run locally
```bash
npm install
npm run dev
```

## Quality checks
```bash
npm run typecheck
npm run test
npm run build
```

## Agent workflow
Read `AGENTS.md` first. It routes work to specialized files in `skills/` and the source-of-truth design documents in `docs/`.

## Current gameplay foundation
- deterministic seeded RNG;
- grid/shape/rotation placement validation;
- prototype absurd item catalog;
- versioned local-save skeleton;
- portal adapter boundary;
- Phaser visual concept scene;
- CI gates.
