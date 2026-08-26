# Portal Submission Checklist

Requirements snapshot: 2026-08-25. Re-check the linked portal documentation before each real submission because moderation rules can change independently of this repository.

## Repository gates already automated

A `main` candidate is not considered technically ready unless CI proves all of the following:

- production TypeScript/tests/build and bundle/asset budgets pass;
- production dependencies pass `npm audit --omit=dev --audit-level=high`;
- the release archive contains exactly one root `index.html`;
- runtime archive paths contain no whitespace or non-ASCII characters;
- uncompressed runtime stays under the 100 MiB Yandex archive ceiling;
- runtime stays under the 250 MiB / 1500-file CrazyGames ceilings;
- Junkpack additionally enforces a 20 MiB mobile initial-download product target;
- `index.html` contains release title/description/mobile viewport metadata and no localhost URL;
- atlas-first loading avoids standalone authored-art requests;
- the game surface suppresses native context menus and touch callouts;
- save corruption/recovery, portrait gating and live orientation recovery pass browser smoke tests;
- Yandex and CrazyGames adapters pass unit callback/lifecycle tests;
- browser-level SDK doubles prove Yandex init → Game Ready and CrazyGames init → loadingStart → loadingStop;
- a clean first run persists hero selection after one meaningful click, with the full Field Manual remaining opt-in;
- the portal ZIP and store art receive a v2 manifest with SHA-256 for the archive and every packaged file;
- CI unpacks and verifies the portal candidate before publishing the Actions artifact;
- the browser job captures deterministic 1440×900 and 1024×576 post-hero gameplay screenshots for portal review/submission.

## CI artifacts

After a fully green `main` run use:

- `junkpack-portal-candidate` — verified runtime ZIP, v2 integrity manifest and generated store art;
- `junkpack-portal-screenshots` — `portal-screenshot-1440x900.png` and `portal-screenshot-1024x576.png` captured from the production build after first hero selection.

Do not take a ZIP from an older run and screenshots from a newer run. Portal submission assets should come from the same commit/run whenever possible.

## Yandex Games — real draft acceptance

Before moderation:

1. Upload the verified runtime ZIP from the CI `junkpack-portal-candidate` artifact. Keep `index.html` at archive root.
2. Select only platforms that were physically tested for this candidate.
3. Open Draft mode and the Yandex debug panel.
4. Verify `YaGames.init()` succeeds and Game Ready is emitted only when the runtime is interactive.
5. Start/finish encounters and verify gameplay markup reflects actual gameplay rather than menus/results.
6. Minimize/background the page and confirm all game sound stops, then resumes safely on return.
7. Exercise fullscreen and rewarded inventory. Confirm gameplay/audio pause while the overlay is active and that dismissed/failed rewarded ads grant nothing.
8. Right-click and long-press the game surface on supported devices; no browser/system context menu should interrupt the game.
9. Reload during a run and confirm local progress survives; also verify the intentional corrupt-save recovery path if practical.
10. Review generated screenshots plus icon/cover/hero crops, description, controls, supported platforms, age/category/content declarations and all moderation fields in the current console UI.

Current references:
- https://yandex.com/dev/games/doc/en/concepts/requirements
- https://yandex.com/dev/games/doc/en/console/add-new-game/draft
- https://yandex.com/dev/games/doc/en/requirements/1/19
- https://yandex.com/dev/games/doc/en/concepts/moderation
- https://yandex.com/dev/games/doc/en/console/test-game

## CrazyGames — Preview / launch acceptance

Before submission or Full Launch review:

1. Upload the verified runtime ZIP from the same CI artifact and open the Developer Portal Preview tool.
2. Confirm SDK v3 initialization completes before SDK modules are used.
3. Confirm `loadingStart()`/`loadingStop()` bracket actual loading and gameplay markup starts/stops only around real encounters.
4. Confirm a clean first-time player reaches the playable run after exactly one meaningful hero-selection click; the five-step Field Manual remains opt-in through Help.
5. Confirm there are no App Store/other-game outbound links inside the game surface.
6. Exercise midgame and rewarded ads with real tester inventory. No rewarded button may become a dead control when ads are disabled/unavailable.
7. Confirm ad overlays suspend game audio/simulation and resume once, without duplicate rewards or stuck pause state.
8. Validate legibility at devicePixelRatio 1, responsive 16:9 iframe sizes and supported mobile landscape sizes.
9. Re-check initial download/file-count measurements in the portal; the repository deliberately targets ≤20 MiB even though the general Basic limit is higher.
10. Review the CI gameplay screenshots, then fill current description, controls, covers and content/age metadata in Developer Portal.

Current references:
- https://docs.crazygames.com/sdk/intro/
- https://docs.crazygames.com/requirements/technical/
- https://docs.crazygames.com/requirements/gameplay/
- https://docs.crazygames.com/requirements/ads/
- https://docs.crazygames.com/requirements/intro/

## Release acceptance evidence record

Before calling a candidate technically accepted, generate one shared evidence file and fill it from the exact candidate/run used for physical and portal tests:

```bash
npm run release:acceptance:template
npm run release:acceptance:check -- reports/release-acceptance.json --out reports/release-acceptance.md
```

The validator requires a real commit SHA, CI run ID, verified portal-artifact SHA-256, physical iOS + Android profiles, and the required Yandex/CrazyGames check sets. A failed real check becomes `BLOCKED`; missing evidence remains `INCOMPLETE`; only complete evidence with no blocker becomes `READY`. Full field definitions live in `docs/RELEASE_ACCEPTANCE.md`.

Do not copy a previous candidate's acceptance forward after code changes. Re-run the relevant physical/portal pass against the new SHA.

## Deliberately not automated

Repository CI cannot prove real ad inventory behavior, portal iframe policies, moderation UI crops, low-memory behavior on physical devices, human small-text legibility, or the portals' current legal/content declarations. The evidence validator records those observations but cannot manufacture them. Those remain release acceptance tasks, not code-complete checkboxes.
