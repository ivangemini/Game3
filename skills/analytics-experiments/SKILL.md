# Skill: Analytics & Experiments

Use when adding telemetry, evaluating retention, balancing from data or designing A/B tests.

## Instrument decisions, not vanity
Events must answer a product/design question. Keep event names stable and payloads compact. Prefer deriving new metrics from already-captured events when the existing event contract is sufficient.

## Core funnel
Track when platform support permits:
- game loaded / playable;
- tutorial step completion and abandonment;
- first item placement / first synergy;
- first battle start/win/loss;
- first boss reached/won/lost;
- campaign world-by-world boss-clear reach, continuation from the previous world and time from run start;
- full six-world campaign completion and campaign → Corrupted Loop continuation;
- run end reason and duration;
- restart/new-run action;
- rewarded ad offer/accept/complete/fail;
- return/session milestones.

## Balance telemetry
Record aggregated item offer/pick/win rates, synergy completion, boss defeat rate, run depth and build tags. For a long campaign, inspect adjacent-world continuation together with boss win rate and p90 duration before changing difficulty. Avoid collecting unnecessary personal data.

## Experiments
Change one meaningful hypothesis at a time. Define primary metric and guardrails before implementation. Never optimize ad impressions at the expense of retention without explicitly measuring the tradeoff.

## Privacy
Use portal-compliant analytics and data minimization. Do not invent fingerprinting, hidden identifiers or cross-site tracking.
