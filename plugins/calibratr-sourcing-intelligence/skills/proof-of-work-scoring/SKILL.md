---
name: proof-of-work-scoring
description: Use when scoring, ranking, or rating candidates against a role, applying a rubric, or tuning scoring from accept/reject feedback. Triggers on "score these candidates", "rank my pipeline", "rate this person against the role", "who's the best fit", "calibrate my scoring", "why did this score so low".
---

# Proof-of-Work Scoring

## Overview

Score candidates against a Role DNA using **evidence-gated, weighted, auditable** scoring. Hard
dealbreakers gate first; surviving candidates get per-dimension judgments that combine into a
reproducible composite via `csi_composite_score`. Feedback (accept/reject) calibrates the weights
over time via `csi_calibrate_weights`.

Core principle: **every dimension score must cite evidence**, and the arithmetic is deterministic so
two runs on the same inputs produce the same number.

## When to Use

- Ranking a sourced pipeline against a role
- Rating a single candidate and explaining why
- Tuning weights after you've recorded real advance/reject decisions

**Requires:** a Role DNA (`role-dna`) for weights, must-haves, and dealbreakers; and candidate
evidence (`evidence-sourcing` / `candidate-dossier`). Don't score on a bare name.

## Configuration

If no Role DNA is supplied, fall back to `.calibratr/config.json` (working directory) for
`scoring.default_weights`, `scoring.threshold`, `scoring.dealbreakers`, and `company.values` /
`target_signals` / `exclusion_signals` as the Company DNA for `dna_fit`. Absent → use the built-in
defaults (weights `{role_fit:55, dna_fit:30, impact:15}`, threshold 60). See CONFIGURATION.md.

## Workflow

0. **Pre-scoring hard gates (apply BEFORE anything else).** Drop any candidate who fails location,
   work-authorization, or the seniority ceiling — regardless of signal strength or score. A
   perfect-signal candidate in the wrong location or 2× the seniority band is a DROP, not a high
   score. Verify location on the actual candidate profile; do not trust the search tool's geo match
   (false positives like "Manhattan, KS" for "Manhattan" are common). Default experience ceiling is
   12 yrs total (5–12 yr band) for all Calibratr roles unless the Role DNA overrides it. If the
   candidate was passed to you from sourcing without a confirmed location, verify it before scoring.

1. **Dealbreaker gate.** Check the candidate against Role DNA `dealbreakers`. If any
   `severity: "absolute"` anti-pattern is clearly met by the evidence → call `csi_composite_score`
   with `dealbreaker_triggered: true` (forces score 0 / strong_no) and stop. Do not "average out" a
   dealbreaker.
2. **Score each dimension 0–100** from the Role DNA `core_competencies` / `score_weighting` keys.
   For each dimension, write the score AND the evidence (a work-sample URL or datum). Rules:
   - Missing a CRITICAL must-have → heavy penalty on the relevant dimension.
   - No evidence either way → score conservatively (≤ 50), not optimistically.
   - Soft dealbreakers → apply a penalty, don't auto-reject.
3. **Compute the composite.** Call `csi_composite_score` with `dimension_scores`, `weights`
   (from Role DNA `score_weighting`), and a `threshold` (default 60). It returns `overall_score`,
   `recommendation` (strong_yes…strong_no), `passed_threshold`, and the weighted breakdown.
4. **Present** score + recommendation + the 2–3 strongest evidence points + 2–3 gaps. Record the
   `dimension_scores` alongside the eventual human verdict for calibration.

## Recommendation Scale

`csi_composite_score` maps overall score → `strong_yes (≥85) · yes (≥70) · lean_yes (≥60) · lean_no (≥45) · no (≥30) · strong_no (<30)`.

## Calibration Loop

Once you have **≥10 recorded verdicts** (the `dimension_scores` at decision time + whether the
recruiter advanced the candidate), call `csi_calibrate_weights` with `verdicts`, `current_weights`,
and `threshold`. It shifts weight (±5% cap per cycle) toward the dimensions that best separate
advances from rejects, and only returns changed weights if agreement on the sample improves.
Persist the returned `adjusted_weights` back into the Role DNA. This is how scoring learns the
recruiter's actual taste instead of staying frozen at the initial guess.

## Worked Example

```
Role DNA weights: { role_fit: 55, dna_fit: 30, impact: 15 }, threshold 60
Candidate (verified via dossier):
  role_fit 82   — evidence: 4 production Go repos, raft-kv 4.1k stars
  dna_fit  64   — evidence: writes design docs publicly, ships weekly
  impact   78   — evidence: 3 launches, one 1.2k-upvote PH launch
Dealbreakers: none triggered.
→ csi_composite_score → overall 77, recommendation "yes", passed_threshold true
```

## Common Mistakes

- **Scoring an out-of-market or out-of-band candidate.** Location, work-auth, and seniority-ceiling failures are pre-scoring DROPs (step 0), not inputs to the scoring math. Run the hard gates before touching the dealbreaker check.
- **Trusting the search tool's geo match.** Always verify location on the actual profile. A high score for the wrong person wastes interview time and erodes recruiter trust.
- **Scoring before the dealbreaker gate.** An absolute dealbreaker is an auto-reject, full stop.
- **Doing the weighted math by hand.** Always use `csi_composite_score` — hand math is non-reproducible and drifts.
- **Optimism without evidence.** No proof for a dimension means a low-to-mid score, not the benefit of the doubt.
- **Scores with no citations.** "technical_depth: 85" with no URL is an opinion. Attach the artifact.
- **Calibrating on <10 verdicts or ignoring the "no change" result.** Respect the tool's guardrails; don't force weight churn.

## Related Skills

- Build the rubric first: `role-dna`
- Get the evidence to score on: `evidence-sourcing`, `candidate-dossier`
