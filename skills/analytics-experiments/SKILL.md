# Skill: Analytics & Experiments

Use when adding telemetry, evaluating retention, balancing from data or designing A/B tests.

## Instrument decisions, not vanity
Events must answer a product/design question. Keep event names stable and payloads compact.

## Core funnel
Track when platform support permits:
- game loaded / playable;
- tutorial step completion and abandonment;
- first item placement / first synergy;
- first battle start/win/loss;
- first boss reached/won/lost;
- run end reason and duration;
- restart/new-run action;
- rewarded ad offer/accept/complete/fail;
- return/session milestones.

## Balance telemetry
Record aggregated item offer/pick/win rates, synergy completion, boss defeat rate, run depth and build tags. Avoid collecting unnecessary personal data.

## Experiments
Change one meaningful hypothesis at a time. Define primary metric and guardrails before implementation. Never optimize ad impressions at the expense of retention without explicitly measuring the tradeoff.

## Privacy
Use portal-compliant analytics and data minimization. Do not invent fingerprinting, hidden identifiers or cross-site tracking.