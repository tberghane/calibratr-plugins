---
name: candidate-dossier
description: Use when deeply researching one candidate, building a profile/dossier, verifying claims, or preparing for an interview. Triggers on "tell me everything about X", "verify this candidate", "build a dossier on", "is this resume legit", "prep me to interview X", "what's their real background".
---

# Candidate Dossier (Claim Verification)

## Overview

Build a complete, **evidence-cross-referenced** profile of one candidate by aggregating their full
public footprint, then verifying each claim against real data. Output: verified strengths, red
flags, key insights, and tailored interview questions — every line backed by a clickable source.

Core principle: **a claim is only as good as the artifact that proves it.** Years, skills, and
impact get checked against GitHub history, papers, launches, and answers — not taken at face value.

## When to Use

- Vetting a candidate before reaching out or advancing them
- A resume makes strong claims and you want them substantiated
- Interview prep — you want sharp, evidence-driven questions
- A candidate from `evidence-sourcing` looks promising and warrants a deep dive

**Not for:** broad discovery (`evidence-sourcing`) or numeric scoring against a rubric (`proof-of-work-scoring`).

## Configuration

If `.calibratr/config.json` exists, use `company.values` / `target_signals` / `exclusion_signals`
as the Company DNA when judging fit, and `sourcing.use_paid_providers` to decide whether to spend
credits on paid contact lookups. See the plugin's CONFIGURATION.md.

## Workflow

1. **Resolve identity.** From a resume/name/URL, extract: full name, primary email, and any
   **verbatim** handles/URLs (github_username, linkedin_url, twitter, portfolio). Never construct
   a handle — if it's not stated, leave it null. (See the verbatim-URL rule in `evidence-sourcing`.)
2. **Aggregate the footprint.** Pull from every source you have a handle for, in parallel
   (dispatch the `dossier-researcher` agent per source for speed):
   - GitHub → `csi_get_github_profile` (repos, languages, stars, activity)
   - Research → `csi_enrich_candidate` with `semantic_scholar` (citations, h-index, top papers)
   - Web/news/portfolio/talks → host **Exa** web_search + web_fetch
   - LinkedIn/role history & contact → host **Wrangle** / **Apollo** / **ContactOut**
   - Stack Overflow / Hugging Face / Product Hunt → via `csi_search_sources` by name
3. **Verify claims.** For each resume/profile claim, classify against the data:
   `verified | contradicted | unverifiable`, with the specific evidence and a confidence level.
4. **Synthesize** the dossier (schema below).

## Verification Heuristics

| Claim type | Check against |
|---|---|
| "X years with Go/Rust/…" | GitHub repo languages + first-commit dates; LinkedIn tenure |
| "Led / scaled / owned" | Repo ownership, stars, paper authorship order, launch ownership |
| "Expert in ML/NLP/…" | arXiv categories, HF model tags, SO tags & top answers |
| "Active open-source contributor" | Recent commit cadence, non-fork repos, followers |
| Impact numbers | Stars, citations, upvotes, downloads — quantified, not asserted |

Default to **conservative**: if data neither confirms nor contradicts, mark `unverifiable` — do not
assume true. Flag claims that the public footprint actively **contradicts** as red flags.

## Dossier Schema

```json
{
  "identity": { "full_name": "", "verified_links": { "github": "", "linkedin": "URL not verified", "…": "" } },
  "claim_verifications": [
    { "claim": "8 yrs distributed systems", "status": "verified", "evidence": "github.com/…/raft-kv first commit 2017, 4.1k stars", "confidence": "high" }
  ],
  "strengths": [ { "point": "", "evidence_url": "" } ],
  "red_flags": [ { "concern": "", "severity": "low|medium|high", "evidence": "" } ],
  "key_insights": ["3–5 most decision-relevant findings"],
  "interview_questions": ["5–7 targeted, evidence-grounded questions"],
  "fit_summary": "2–3 sentences, evidence-based, no fluff"
}
```

## Common Mistakes

- **Trusting the resume.** The whole point is to check it. Every strength needs an `evidence_url`.
- **Fabricating a footprint.** No data for a source = say so. Don't infer a GitHub from a name.
- **Vague red flags.** "Seems junior" is useless. "Claims 8 yrs Rust but newest repo is a 3-week-old tutorial fork" is a finding.
- **Over-claiming verification.** MX-valid email ≠ reachable; a same-name GitHub ≠ the same person. Confirm identity before attributing work.
- **Generic interview questions.** Tie each question to a specific artifact or gap you found.

## Related Skills

- Discover candidates first: `evidence-sourcing`
- Score the verified candidate: `proof-of-work-scoring`
- Parallel per-source research: dispatch the `dossier-researcher` agent
