# Configuration — make it yours

This plugin adapts to your hiring without any code or skill edits. Create a `.calibratr/config.json`
in your working directory (the repo/folder you run Claude Code from). Every field is optional; the
plugin uses documented defaults when the file — or any field — is missing.

Start from [`examples/config.example.json`](../../examples/config.example.json).

## Schema

```jsonc
{
  "company": {
    "name": "Acme",                              // used in framing/outreach context
    "values": ["bias to ship", "writes to think"],     // your "Company DNA" — feeds dna_fit scoring & dossier fit
    "target_signals": ["shipped at scale"],            // positive signals to weight up
    "exclusion_signals": ["agency-only background"]    // soft-negative signals
  },
  "sourcing": {
    "default_sources": ["github", "stackoverflow", "hacker_news"],  // used when you don't name sources
    "default_location": "Remote (US)",
    "use_paid_providers": false                  // if false, plugin won't spend Wrangle/Apollo credits without asking
  },
  "scoring": {
    "default_weights": { "role_fit": 55, "dna_fit": 30, "impact": 15 },  // must sum to 100
    "threshold": 60,                             // min composite to "pass"
    "dealbreakers": [
      { "anti_pattern": "No production backend experience", "severity": "absolute" }  // absolute → auto-reject
    ]
  },
  "tokens": { "github": "GITHUB_TOKEN", "product_hunt": "PRODUCTHUNT_TOKEN" }  // env var NAMES, never values
}
```

## How each part is used

| Config | Used by | Effect |
|---|---|---|
| `company.values` / `target_signals` / `exclusion_signals` | `role-dna`, `proof-of-work-scoring`, `candidate-dossier` | Seeds your Company DNA for `dna_fit` scoring and fit judgments. |
| `sourcing.default_sources` / `default_location` | `evidence-sourcing`, `role-dna` | Defaults when you don't specify them in the prompt. |
| `sourcing.use_paid_providers` | `evidence-sourcing` | Gates spending on paid contact providers. |
| `scoring.default_weights` / `threshold` / `dealbreakers` | `proof-of-work-scoring`, `role-dna` | Default rubric + gates; a `/role-dna` run can still override per role. |
| `tokens.*` | bundled MCP server | Documents which env vars to set for higher rate limits / extra sources. |

## Precedence

Explicit details in your prompt **override** config; config **overrides** built-in defaults. Tokens
are always read from the environment by their configured names — the config never holds secrets.
