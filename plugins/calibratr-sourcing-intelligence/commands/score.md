---
description: Score and rank candidate(s) against a Role DNA with dealbreaker gates and reproducible weighted scoring.
argument-hint: <candidate(s) + role, or "rank the pipeline">
---

Score candidates: **$ARGUMENTS**

Use the `proof-of-work-scoring` skill. You need a Role DNA (run `role-dna` first if absent) and
candidate evidence (run `evidence-sourcing` / `candidate-dossier` if the candidates are bare names).

Apply the dealbreaker gate first, then score each dimension 0–100 WITH evidence, then call
`csi_composite_score` for the reproducible composite and recommendation. Present score +
recommendation + top evidence + key gaps for each, ranked. Record dimension scores for later
calibration via `/calibrate`.
