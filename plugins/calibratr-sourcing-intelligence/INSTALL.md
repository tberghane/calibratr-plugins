# Install — Calibratr Sourcing Intelligence

A 2-minute setup.

> **Run these in the Claude Code CLI** (the `claude` terminal), at its interactive prompt.
> `/plugin` is CLI-only — it does **not** exist in claude.ai web or the desktop chat box. If you
> see "`/plugin` isn't available in this environment," you're not in the CLI; open a terminal and
> run `claude`. (Requires Claude Code v2.1.143+.)

## 1. Prerequisites

- **Claude Code CLI** v2.1.143+ installed and signed in (`claude --version`).
- **Node.js 18+** — check with `node --version`. That's the only runtime dependency; the plugin's
  MCP server ships pre-bundled as a single file, so there's **no `npm install` or build step**.

## 2. Add the marketplace

```
/plugin marketplace add tberghane/calibratr-plugins
```

This Git-clones the marketplace. It registers a marketplace whose **name is `calibratr-marketplace`**
(from its manifest) — note that name, you need it in the next step. Then refresh it:

```
/plugin marketplace update calibratr-marketplace
```

## 3. Install the plugin

**Use the `plugin@marketplace` form** — the marketplace name, not the repo name:

```
/plugin install calibratr-sourcing-intelligence@calibratr-marketplace
```

> ⚠️ The bare `/plugin install calibratr-sourcing-intelligence` (no `@calibratr-marketplace`) will
> NOT work — that form only resolves against the official marketplace. The `@marketplace` suffix is
> required for any custom marketplace.

Then activate it in the current session:

```
/reload-plugins
```

(Plugins are auto-enabled on install; `/reload-plugins` just picks it up without waiting.)

## 4. Verify

Run `/help` (or `/plugin` → Manage). You should see five commands: `/source`, `/dossier`,
`/role-dna`, `/score`, `/calibrate`. If they appear, you're done.

Prefer clicking? Run `/plugin`, open the **Discover** tab, find `calibratr-sourcing-intelligence`,
and install from there — the menu uses the right syntax for you.

## 5. (Optional) Add API tokens for more reach

All core sources work with **no keys**. Set any of these in your environment to unlock more:

| Variable | What it adds |
|---|---|
| `GITHUB_TOKEN` | Recommended. Raises GitHub rate limits 60→5000/hr. |
| `PRODUCTHUNT_TOKEN` | Enables the Product Hunt (founders) source. Free dev token. |
| `SEMANTIC_SCHOLAR_API_KEY` | Higher Semantic Scholar limits. |
| `STACKEXCHANGE_KEY` | Higher Stack Overflow limits. |
| `REACHER_URL` or `ZEROBOUNCE_API_KEY` | Upgrades email checks from MX-only to deliverability grading. |

Set them before launching Claude Code, e.g. add `export GITHUB_TOKEN=ghp_xxx` to your shell
profile (`~/.zshrc` / `~/.bashrc`), then restart Claude Code.

## 6. First run

```
/role-dna <paste a job description or a job-posting URL>
/source staff backend engineer, Go/Rust, distributed systems, remote US
/dossier <pick a candidate from the results>
/score the pipeline against the role
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `/plugin isn't available in this environment` | You're not in the Claude Code CLI. Open a terminal, run `claude`, then use `/plugin` there. It does not exist in claude.ai web or the desktop chat box. |
| Marketplace "added" but install does nothing | You almost certainly dropped the `@calibratr-marketplace` suffix. Use `/plugin install calibratr-sourcing-intelligence@calibratr-marketplace`. |
| "plugin not found" | Run `/plugin marketplace list` to confirm `calibratr-marketplace` is there, then `/plugin marketplace update calibratr-marketplace` and retry. |
| Commands don't appear after install | Run `/reload-plugins` (or restart Claude Code), then `/plugin` to confirm it's enabled. |
| "MCP server failed to start" | Confirm `node --version` is 18+ and on your PATH. |
| Few/no GitHub results, or rate-limit errors | Set `GITHUB_TOKEN` (step 5) and restart. |
| Product Hunt returns an error | Expected without `PRODUCTHUNT_TOKEN`; set it or omit `product_hunt`. |
| Update to the latest version | `/plugin marketplace update calibratr-marketplace`, then `/plugin update calibratr-sourcing-intelligence@calibratr-marketplace`. |

## Uninstall

```
/plugin uninstall calibratr-sourcing-intelligence
```
