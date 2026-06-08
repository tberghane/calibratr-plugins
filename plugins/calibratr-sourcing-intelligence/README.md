# Calibratr Sourcing Intelligence

**Evidence-first candidate sourcing for Claude.** Stop getting names with guessed LinkedIn URLs.
Get candidates with *verbatim* profile links and real proof-of-work — repos, papers, models,
answers, launches — then verify their claims, score them against a structured role, and let scoring
learn from your accept/reject decisions.

> The difference: a sourced candidate here is a person plus the artifacts that prove they can do the
> job. Every URL is real (returned verbatim by a source), never constructed.

## What it does

| Command | What it does |
|---|---|
| `/role-dna <JD or URL>` | Turn a job description into structured search + scoring criteria (must-haves, weights, dealbreakers). |
| `/source <role/JD/URL>` | Fan out across all proof-of-work sources, dedupe, and return evidence-ranked candidate cards. |
| `/dossier <candidate>` | Deep-research one candidate's full footprint and cross-verify every claim. |
| `/score <candidates + role>` | Dealbreaker-gated, evidence-cited, reproducible weighted scoring + recommendation. |
| `/calibrate <verdicts>` | Tune scoring weights from your real advance/reject decisions. |

Four skills (`evidence-sourcing`, `role-dna`, `candidate-dossier`, `proof-of-work-scoring`) drive the
behavior; two agents (`sourcing-orchestrator`, `dossier-researcher`) parallelize the heavy fan-out.

## Sources

**Bundled MCP server (`csi-sources`) — free, no LinkedIn guessing:**

| Source | Surfaces | Proof-of-work returned |
|---|---|---|
| GitHub | Engineers | Top repos (stars, languages) |
| arXiv | Researchers | Papers (authors, categories) |
| Hugging Face | ML builders | Models/datasets (downloads, tags) |
| Stack Overflow | Engineers | Top answers (votes, reputation) |
| Hacker News | Active seekers | "Who wants to be hired" posts (skills, contact) |
| Product Hunt | Founders | Launches (upvotes) |
| Semantic Scholar | Academics (enrichment) | Citations, h-index, top papers |

**Plus the host's existing MCP tools** for what they already do best — Exa (web search), Wrangle
(`people_search`), Apollo/growth and ContactOut (contact enrichment), and any `scrape_job_description`
recruiting tool. The plugin orchestrates these; it never re-implements or fakes their results.

## Install

In the **Claude Code CLI** (the `claude` terminal — `/plugin` is CLI-only, not available in
claude.ai web or the desktop chat box):

```
/plugin marketplace add tberghane/calibratr-plugins
/plugin marketplace update calibratr-marketplace
/plugin install calibratr-sourcing-intelligence@calibratr-marketplace
/reload-plugins
```

The `@calibratr-marketplace` suffix is **required** — it's the marketplace name (from the manifest),
not the repo name. A bare `/plugin install calibratr-sourcing-intelligence` only resolves against
the official marketplace and will appear to do nothing.

**No build or `npm install` required.** The bundled MCP server ships as a single self-contained
file (`mcp/csi-sources/dist/index.js`, all dependencies inlined), wired in
`.claude-plugin/plugin.json` via `${CLAUDE_PLUGIN_ROOT}`. The only runtime requirement is **Node 18+**.
Full walkthrough + troubleshooting: [INSTALL.md](INSTALL.md).

### Environment variables (all optional)

| Var | Effect |
|---|---|
| `GITHUB_TOKEN` | Raises GitHub rate limit 60→5000/hr. Recommended. |
| `PRODUCTHUNT_TOKEN` | Enables the Product Hunt source (free developer token). |
| `SEMANTIC_SCHOLAR_API_KEY` | Higher Semantic Scholar rate limits. |
| `STACKEXCHANGE_KEY` | Higher Stack Exchange rate limits. |
| `REACHER_URL` / `ZEROBOUNCE_API_KEY` | Upgrade email verification from MX-only to deliverability grading. |

No key is required for GitHub / arXiv / Hugging Face / Stack Overflow / Hacker News public reads.

### Make it yours

Drop a `.calibratr/config.json` in your working directory to set your company values ("Company DNA"),
default sources, rubric weights, location, and dealbreakers — the skills use these as defaults with
no code edits. See [CONFIGURATION.md](CONFIGURATION.md) and
[examples/config.example.json](../../examples/config.example.json).

## The one rule that matters

**Verbatim URLs only.** The plugin will never construct a LinkedIn (or any profile) URL from a name.
If a source didn't return a link, you'll see `URL not verified` — an honest gap instead of a broken
link. This is enforced in the source tools, the skills, and the agents.

## 60-second quickstart

```
/role-dna https://jobs.example.com/staff-backend-engineer
/source staff backend engineer, Go/Rust, distributed systems, remote US
/dossier <pick the top candidate>
/score the pipeline against the role
```

## Development

```bash
cd mcp/csi-sources
npm install     # contributors only
npm run dev     # watch mode (tsx)
npm run build   # typecheck + bundle to a single self-contained dist/index.js (commit it)
```

Hardening note: the load-bearing **verbatim-URL invariant** was pressure-tested with subagents
(time-pressure scenario, "fill in every LinkedIn URL") and held — the agent refused to fabricate
slugs and returned "URL not verified" instead. Pressure-testing the remaining skills the same way
(per `superpowers:writing-skills`) is the recommended next step before wide release.

MIT licensed.
