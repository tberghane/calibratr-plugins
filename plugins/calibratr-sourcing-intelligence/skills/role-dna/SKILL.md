---
name: role-dna
description: Use when turning a job description, JD URL, or hiring ask into a structured search-and-scoring profile before sourcing. Triggers on "extract requirements from this JD", "what should I search for this role", "set up scoring for this role", pasted job postings, or Ashby/Greenhouse/Lever links with sourcing intent.
---

# Role DNA

## Overview

Convert a messy job description into a **structured Role DNA**: the must-haves, weighted
competencies, scoring weights, impact expectations, cultural signals, and dealbreakers that drive
both sourcing (`evidence-sourcing`) and scoring (`proof-of-work-scoring`). One extraction, reused
everywhere downstream.

## When to Use

- A user pastes a JD or a job-posting URL and wants to source against it
- Before scoring candidates — you need explicit weights and dealbreakers first
- When a search is returning noise and you need sharper, prioritized criteria

**Not for:** running the search itself (`evidence-sourcing`) or evaluating a candidate (`proof-of-work-scoring`).

## Input

- **JD text** → extract directly.
- **JD URL** → fetch first. Use the host `scrape_job_description` recruiting tool if present, else
  host **Exa** `web_fetch`/web_search. Never invent requirements that aren't in the source.

## Role DNA Schema

Produce this object:

```json
{
  "title": "Staff Backend Engineer",
  "seniority": "staff",
  "location": "Remote (US) | NYC | …",
  "must_have_requirements": [
    { "requirement": "7+ yrs building distributed systems", "criticality": "CRITICAL" },
    { "requirement": "Production Go or Rust", "criticality": "CRITICAL" },
    { "requirement": "Owned a system at scale (>10k rps)", "criticality": "IMPORTANT" }
  ],
  "core_competencies": [
    { "name": "Distributed systems depth", "weight": "CRITICAL" },
    { "name": "Code quality / OSS signal", "weight": "IMPORTANT" },
    { "name": "Written communication", "weight": "NICE_TO_HAVE" }
  ],
  "score_weighting": { "role_fit": 55, "dna_fit": 30, "impact": 15 },
  "impact_expectations": { "90_days": ["…"], "6_months": ["…"], "1_year": ["…"] },
  "cultural_fit_signals": ["bias to ship", "writes to think"],
  "dealbreakers": [
    { "anti_pattern": "No production backend experience", "severity": "absolute" },
    { "anti_pattern": "Only short (<1 yr) stints across the board", "severity": "soft" }
  ],
  "search_terms": ["distributed systems", "golang", "rust", "consensus", "kafka"],
  "target_sources": ["github", "stackoverflow", "hacker_news"]
}
```

Rules:
- Extract **3–7** must-haves. Mark each `CRITICAL | IMPORTANT | NICE_TO_HAVE`.
- `score_weighting` values **must sum to 100**.
- Derive `search_terms` and `target_sources` from the role (map to the `evidence-sourcing` matrix).
- Dealbreakers: `absolute` → auto-reject in scoring; `soft` → penalty only.

## Configuration

If `.calibratr/config.json` exists in the working directory, pre-fill defaults from it:
`scoring.default_weights` → `score_weighting`, `scoring.dealbreakers` → `dealbreakers`,
`company.values`/`target_signals`/`exclusion_signals` → `cultural_fit_signals` and DNA framing,
`sourcing.default_sources`/`default_location` → `target_sources`/`location`. A JD always overrides
config; config overrides built-in defaults. See the plugin's CONFIGURATION.md.

## Completeness Gate

Before finalizing, check for gaps. Ask **at most 2** targeted questions only if these are missing
and not inferable:

- **Location / remote policy** — if absent, ask.
- **Seniority** — if the JD is ambiguous (e.g. "engineer" with staff-level scope), confirm.

Then echo back one line: *"Searching for: {one-sentence summary}"* and hand off to `evidence-sourcing`.

## Common Mistakes

- **Inventing requirements not in the JD.** Extract only what's present; ask if unsure.
- **Weights that don't sum to 100.** Re-normalize before returning.
- **Soft-pedaling dealbreakers.** If the JD says "must have X", a missing X is a dealbreaker, not a minor gap.
- **Skipping the location question.** Location is the single most common silent mismatch.

## Related Skills

- Next step: `evidence-sourcing` (uses `search_terms` + `target_sources`)
- Later: `proof-of-work-scoring` (uses `score_weighting`, `must_have_requirements`, `dealbreakers`)
