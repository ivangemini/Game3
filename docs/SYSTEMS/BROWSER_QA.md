# Browser / Mobile QA Matrix

## Purpose
Make web compatibility an executable CI gate rather than a final manual checklist. The matrix boots the real production bundle behind `vite preview` and exercises Phaser/WebGL, responsive shell behavior, save recovery and atlas network behavior in multiple browser engines and viewport classes.

## Playwright projects
`playwright.config.ts` currently defines:
- Chromium desktop — 1440×900;
- Chromium compact landscape — 1024×576;
- Chromium mobile landscape — 844×390, touch/mobile emulation, DPR 2;
- WebKit mobile landscape — 844×390, touch/mobile emulation, DPR 2;
- Firefox desktop — 1366×768;
- Chromium portrait gate — 390×844, touch/mobile emulation, DPR 2.

The browser CI job installs Chromium, Firefox and WebKit and runs `npm run test:e2e` against the production build.

## Assertions
The matrix verifies:
- Phaser canvas boots and remains inside the viewport;
- document width/height do not overflow the browser viewport;
- the expected `standard-landscape`, `compact-landscape` or `portrait` profile is applied;
- portrait mode shows `ROTATE THE JUNK` and disables canvas pointer input;
- resizing landscape → portrait → landscape updates the profile and restores interaction;
- touch canvas uses `touch-action: none` and the page suppresses overscroll;
- normal production boot requests all three runtime atlases;
- normal boot does **not** request any of the 80 standalone authored item/hero/boss/UI SVG fallbacks;
- screenshots have non-trivial visual variance rather than a blank/black render;
- no HTTP >=400 responses, browser console errors or uncaught page errors occur during the matrix smoke;
- save-recovery shell remains available;
- malformed primary save safely resets when no backup exists;
- a valid backup restores after primary-save corruption.

Failure screenshots/traces/HTML report are retained/uploaded by Playwright/GitHub Actions for debugging.

## First green baseline — 2026-08-25
CI run #334 executed **42 Playwright cases** across the matrix:
- **37 passed**;
- **5 intentionally skipped** because the resize-transition scenario is executed only once in Chromium desktop rather than redundantly in every project;
- **0 failed**.

The browser stage completed against the same production build that passed asset/store/bundle gates.

## What this proves
This is genuine browser-engine execution, not a TypeScript/unit simulation. It materially covers Chromium, Firefox and WebKit behavior plus landscape/portrait/touch viewport classes and production network routing.

## What it does not prove
Headless CI is not equivalent to a physical-device or live portal certification pass. Still required before launch:
- Safari on a physical iPhone/iPad and representative Android Chrome device;
- frame-time observation during dense combat/VFX;
- real WebGL memory/low-memory tab behavior;
- safe-area behavior on actual notched devices;
- embedded portal iframe/SDK behavior;
- Yandex/CrazyGames moderation/compliance validation;
- human visual review for small text, touch ergonomics and store-art crop quality.
