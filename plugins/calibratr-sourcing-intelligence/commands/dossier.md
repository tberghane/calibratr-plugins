---
description: Build a deep, claim-verified dossier on one candidate from their full public footprint.
argument-hint: <candidate name, profile URL, or pasted resume>
---

Build a candidate dossier for: **$ARGUMENTS**

Use the `candidate-dossier` skill. Resolve identity from the input (verbatim handles/URLs only —
never construct one), then aggregate the candidate's public footprint across every available
source, dispatching the `dossier-researcher` agent per source to run in parallel.

Cross-reference every claim against the real data and return: verified strengths (each with an
evidence URL), red flags with severity, key insights, 5–7 evidence-grounded interview questions, and
a short evidence-based fit summary. Mark anything the data can't confirm as unverifiable.
