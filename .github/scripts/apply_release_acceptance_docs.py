from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding='utf-8')
    if old not in text:
        raise RuntimeError(f'marker not found in {path}: {old[:100]!r}')
    file.write_text(text.replace(old, new, 1), encoding='utf-8')


# A generated blank template must be structurally valid. Zero measurements mean
# "not recorded yet" and are converted to INCOMPLETE by evaluateAcceptance().
replace_once(
    'scripts/release-acceptance-report.mjs',
    "import { fileURLToPath } from 'node:url';\n",
    "import { pathToFileURL } from 'node:url';\n",
)
replace_once(
    'scripts/release-acceptance-report.mjs',
    "  validatePositive(device.canvas?.width, `${prefix}.canvas.width`, errors);\n  validatePositive(device.canvas?.height, `${prefix}.canvas.height`, errors);\n  validatePositive(device.canvas?.devicePixelRatio, `${prefix}.canvas.devicePixelRatio`, errors);\n",
    "  validateNonNegative(device.canvas?.width, `${prefix}.canvas.width`, errors);\n  validateNonNegative(device.canvas?.height, `${prefix}.canvas.height`, errors);\n  validateNonNegative(device.canvas?.devicePixelRatio, `${prefix}.canvas.devicePixelRatio`, errors);\n",
)
replace_once(
    'scripts/release-acceptance-report.mjs',
    "function validatePositive(value, prefix, errors) {\n  if (!Number.isFinite(value) || value <= 0) errors.push(`${prefix} must be a positive finite number`);\n}\n\n",
    "",
)
replace_once(
    'scripts/release-acceptance-report.mjs',
    "const invokedAsCli = process.argv[1] && import.meta.url === new URL(`file://${path.resolve(process.argv[1])}`).href;\n",
    "const invokedAsCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;\n",
)

replace_once(
    'docs/SYSTEMS/RUNTIME_PROFILING.md',
    "## Reporting\nAttach the device/browser/build SHA and scenario to each measurement. P8 `real-device performance profiling` remains open until the physical-device pass is completed; the automated browser baseline can be green independently.\n",
    "## Reporting\nAttach the device/browser/build SHA and scenario to each measurement. Use the shared release-acceptance evidence file so measurements are tied to the exact CI candidate rather than copied into free-form notes:\n\n```bash\nnpm run release:acceptance:template\nnpm run release:acceptance:check -- reports/release-acceptance.json --out reports/release-acceptance.md\n```\n\nThe validator converts sustained sub-30-FPS medians, repeated >150 ms p95 stalls and failed lifecycle/WebGL observations into explicit blockers while leaving tool-unavailable heap/texture estimates optional. See `docs/RELEASE_ACCEPTANCE.md` for the schema and status semantics.\n\nP8 `real-device performance profiling` remains open until the physical-device pass is actually recorded; a green automated browser baseline or an empty evidence template cannot close it.\n",
)

replace_once(
    'docs/PORTAL_SUBMISSION.md',
    "## Deliberately not automated\n\nRepository CI cannot prove real ad inventory behavior, portal iframe policies, moderation UI crops, low-memory behavior on physical devices, human small-text legibility, or the portals' current legal/content declarations. Those remain release acceptance tasks, not code-complete checkboxes.\n",
    "## Release acceptance evidence record\n\nBefore calling a candidate technically accepted, generate one shared evidence file and fill it from the exact candidate/run used for physical and portal tests:\n\n```bash\nnpm run release:acceptance:template\nnpm run release:acceptance:check -- reports/release-acceptance.json --out reports/release-acceptance.md\n```\n\nThe validator requires a real commit SHA, CI run ID, verified portal-artifact SHA-256, physical iOS + Android profiles, and the required Yandex/CrazyGames check sets. A failed real check becomes `BLOCKED`; missing evidence remains `INCOMPLETE`; only complete evidence with no blocker becomes `READY`. Full field definitions live in `docs/RELEASE_ACCEPTANCE.md`.\n\nDo not copy a previous candidate's acceptance forward after code changes. Re-run the relevant physical/portal pass against the new SHA.\n\n## Deliberately not automated\n\nRepository CI cannot prove real ad inventory behavior, portal iframe policies, moderation UI crops, low-memory behavior on physical devices, human small-text legibility, or the portals' current legal/content declarations. The evidence validator records those observations but cannot manufacture them. Those remain release acceptance tasks, not code-complete checkboxes.\n",
)

replace_once(
    'ROADMAP.md',
    "- [ ] real-device performance profiling (**frame time, peak WebGL memory, portal network waterfall, low-memory lifecycle; automated regression baseline + capture protocol exist**)\n",
    "- [ ] real-device performance profiling (**frame time, peak WebGL memory, portal network waterfall, low-memory lifecycle; automated regression baseline + capture protocol + structured `READY/INCOMPLETE/BLOCKED` evidence validator/report exist; physical iOS/Android pass is still required**)\n",
)
replace_once(
    'ROADMAP.md',
    "- [ ] portal-specific compliance checks (**repository/unit/browser harness implemented; real Yandex debug panel / CrazyGames SDK tester acceptance still required**)\n",
    "- [ ] portal-specific compliance checks (**repository/unit/browser harness + structured evidence validator/report implemented; real Yandex debug panel / CrazyGames SDK tester acceptance still required**)\n",
)

print('release acceptance tooling and docs integrated')
