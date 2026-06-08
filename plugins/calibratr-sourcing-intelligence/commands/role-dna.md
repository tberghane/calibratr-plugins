---
description: Extract a structured Role DNA (must-haves, weights, dealbreakers, search terms) from a JD or URL.
argument-hint: <JD text or job-posting URL>
---

Extract Role DNA from: **$ARGUMENTS**

Use the `role-dna` skill. If given a URL, fetch the posting first (host `scrape_job_description` or
Exa). Produce the structured Role DNA object: must-have requirements with criticality, core
competencies with weight tiers, score weighting (must sum to 100), impact expectations, cultural
fit signals, dealbreakers (absolute vs soft), and derived search terms + target sources.

Ask at most 2 clarifying questions only if location or seniority is missing and not inferable.
Finish with a one-line search summary and offer to run `/source` next.
