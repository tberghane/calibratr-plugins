---
description: Tune scoring weights from recorded accept/reject verdicts so scoring learns the recruiter's real taste.
argument-hint: <role / pipeline with recorded verdicts>
---

Calibrate scoring weights for: **$ARGUMENTS**

Use the calibration section of the `proof-of-work-scoring` skill. Gather the recorded verdicts (the
per-dimension scores at decision time + whether each candidate was advanced) and the current Role
DNA weights, then call `csi_calibrate_weights`.

Requires ≥10 verdicts. Report before/after agreement and the rationale. If the tool returns no
change, respect that — do not force weight churn. If weights improved, persist the adjusted weights
back into the Role DNA and say so.
