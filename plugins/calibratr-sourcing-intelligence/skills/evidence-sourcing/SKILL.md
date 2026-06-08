---
name: evidence-sourcing
description: Use when sourcing, finding, or building a list of candidates for a role — especially when you need real profile URLs and proof-of-work (GitHub repos, papers, models, answers, launches, writing), not just names. Triggers on "source candidates", "find engineers/researchers/founders for X", "who's built Y", "build a pipeline", "find people who".
---

# Evidence-First Candidate Sourcing

## Overview

Source candidates across many platforms at once, and return **evidence, not assertions**. Every
candidate ships with verbatim profile URLs and concrete proof-of-work artifacts (each with its own
URL and a quantified signal). A name with no links and no work samples is not a sourced candidate.

Core principle: **show the work**. Recruiters trust a repo, a paper, or a launch they can click far
more than a one-line claim.

## When to Use

- "Source 20 backend engineers who've built distributed systems"
- "Find ML researchers working on RAG / retrieval"
- "Who has shipped developer tools / launched on Product Hunt in dev infra?"
- Building a pipeline for a role, or expanding a thin pipeline with new sources

**Not for:** scoring/ranking against a rubric (use `proof-of-work-scoring`), deep single-candidate
verification (use `candidate-dossier`), or turning a JD into search criteria (use `role-dna` first).

## The Iron Rule: Verbatim URLs Only

**NEVER construct, infer, or guess a profile URL — especially LinkedIn.**

- Only include a URL if a tool returned it **verbatim** in its raw result.
- A name-based slug like `linkedin.com/in/jane-smith` is a guess. Guesses resolve to the wrong
  person or a 404 and destroy recruiter trust. A missing link is honest; a wrong link is not.
- If no verified URL exists for a field, leave it out and write **"URL not verified"** in output.
- This applies to you AND to every tool result you summarize. Do not "helpfully" complete a slug.

A broken link damages trust far more than a missing one.

## Source Selection Matrix

Pick sources by who you're hiring. Run several in one pass.

| Role archetype | Best sources |
|---|---|
| Backend / systems / infra engineer | `csi_search_sources` github, stackoverflow, hacker_news |
| ML / AI researcher or engineer | `csi_search_sources` arxiv, huggingface, github |
| Founder / product builder | `csi_search_sources` product_hunt; host Exa search |
| Generalist / broad net + LinkedIn | host **Wrangle** `people_search`, host **Exa** web_search |
| Need contact info (email/phone) | host **Apollo/growth**, **ContactOut** — AFTER discovery |

The bundled `csi-sources` MCP server covers the free proof-of-work platforms. For LinkedIn-shaped
search and contact enrichment, use the host's existing MCP tools — never re-implement them, and
never fabricate the URLs they would return.

## Configuration

Before searching, check for `.calibratr/config.json` in the working directory. If present, use
`sourcing.default_sources` and `sourcing.default_location` when the user didn't specify them, and
respect `sourcing.use_paid_providers` (if false, never spend Wrangle/Apollo/ContactOut credits
without explicit confirmation). Absent → use the matrix defaults below. See the plugin's
CONFIGURATION.md.

## Workflow

1. **Get criteria.** If you only have a JD/URL, run the `role-dna` skill first to get must-haves,
   skills, seniority, and location. If you have a plain ask, extract role + key skills + location.
2. **Fan out.** Call `csi_search_sources` with the matched `platforms[]` and a tight query. For
   GitHub you can use qualifiers (`language:go location:"new york" followers:>200`). In parallel,
   use host **Exa**/**Wrangle** for web + LinkedIn-shaped results when breadth or LinkedIn matters.
3. **Merge.** Pool everything and call `csi_normalize_candidates` to dedupe across sources (same
   person from GitHub + arXiv collapses into one, unioning their work samples) and rank by evidence.
4. **Enrich selectively.** For promising candidates, `csi_enrich_candidate` (github_deep,
   semantic_scholar). Pull contact info via host Apollo/ContactOut only when the user wants outreach.
5. **Present candidate cards** (below). Stop and ask before spending paid credits (Wrangle/Apollo).

## Candidate Card Format

```
### {Name} — {current_title} @ {current_company}
- **Location:** {location or "—"}
- **Profile:** {verbatim source_url}  ·  GitHub: {github_url or "URL not verified"}  ·  LinkedIn: {linkedin_url or "URL not verified"}
- **Proof of work:**
  - {work_sample.title} — {work_sample.url}  ({work_sample.signal})
  - …
- **Skills:** {top skills}
- **Why a fit:** 1–2 sentences grounded in the work samples above (no generic praise)
```

Rank cards by proof-of-work density first, then signal strength. Lead with the most evidence.

## Common Mistakes

- **Constructing a LinkedIn URL from a name.** Never. Output "URL not verified".
- **Returning names with no links or work samples.** That's a lead, not a sourced candidate — keep digging or drop it.
- **Burning paid credits silently.** Wrangle/Apollo cost money. Confirm scope first; default to free sources.
- **Generic fit blurbs.** "Strong engineer with great experience" cites nothing. Point at a specific repo/paper/launch.
- **Skipping dedupe.** The same person appears on GitHub + arXiv + HN. Always `csi_normalize_candidates` before presenting.

## Related Skills

- **REQUIRED FIRST when starting from a JD:** `role-dna` (turns the role into search criteria + weights)
- For deep verification of one candidate: `candidate-dossier`
- For ranking against the role: `proof-of-work-scoring`
