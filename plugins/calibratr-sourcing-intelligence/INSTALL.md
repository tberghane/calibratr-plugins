# Install — Calibratr Sourcing Intelligence

A 2-minute setup in the **Claude Code CLI**.

> [!IMPORTANT]
> **Run each command on its own line — one at a time, pressing Enter between them.**
> Pasting the whole block at once makes the CLI read everything as one repo name and fail with
> `URL rejected: Malformed input`. When in doubt, use the **menu** (Option A below) — no typing.

> `/plugin` is **CLI-only**. It does not exist in claude.ai web or the desktop chat box. If you see
> "`/plugin` isn't available in this environment," open a terminal and run `claude` first.
> (Requires Claude Code v2.1.143+.)

## Prerequisites

- **Claude Code CLI** v2.1.143+ , signed in (`claude --version`).
- **Node.js 18+** (`node --version`). That's the only runtime dependency — the plugin's MCP server
  ships pre-bundled as a single file, so there's **no `npm install` or build step**.

---

## Option A — Menu (easiest, no syntax to get wrong)

1. Run `/plugin`
2. **Browse / add marketplace** → enter `tberghane/calibratr-plugins`
3. Open the **Discover** tab → select **calibratr-sourcing-intelligence** → **Install**
4. Run `/reload-plugins`

Done — skip to [Verify](#verify).

---

## Option B — Commands (one line at a time)

**Step 1 — add the marketplace.** Paste this line alone, press Enter, wait for the success message:

```
/plugin marketplace add tberghane/calibratr-plugins
```

This registers a marketplace named **`calibratr-marketplace`** (you'll need that name next).

**Step 2 — install the plugin.** Then, as a separate line:

```
/plugin install calibratr-sourcing-intelligence@calibratr-marketplace
```

The `@calibratr-marketplace` suffix is **required** — it names the marketplace, not the repo. A bare
`/plugin install calibratr-sourcing-intelligence` only checks the official marketplace and appears to
do nothing.

**Step 3 — activate.** Finally:

```
/reload-plugins
```

---

## Verify

Run `/help`. You should see five commands: `/source`, `/dossier`, `/role-dna`, `/score`,
`/calibrate`. If they appear, you're set.

## First run

Try these one at a time:

```
/source staff backend engineer, Go/Rust, distributed systems, remote US
```
```
/role-dna <paste a job description or a job-posting URL>
```
```
/dossier <a candidate from the results>
```

## Make it yours (optional)

Drop a `.calibratr/config.json` in your working folder to set your company values, default sources,
rubric weights, and location — the plugin uses them as defaults, no code edits. See
[CONFIGURATION.md](CONFIGURATION.md) and [examples/config.example.json](../../examples/config.example.json).

## More reach with API tokens (all optional)

Core sources work with **no keys**. Set any of these in your shell, then restart Claude Code:

| Variable | What it adds |
|---|---|
| `GITHUB_TOKEN` | Recommended — raises GitHub limits 60→5000/hr. |
| `PRODUCTHUNT_TOKEN` | Enables the Product Hunt (founders) source. Free dev token. |
| `SEMANTIC_SCHOLAR_API_KEY` | Higher Semantic Scholar limits. |
| `STACKEXCHANGE_KEY` | Higher Stack Overflow limits. |
| `REACHER_URL` or `ZEROBOUNCE_API_KEY` | Upgrades email checks from MX-only to deliverability grading. |

Example: add `export GITHUB_TOKEN=...` to `~/.zshrc`, then restart your terminal.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `URL rejected: Malformed input` on `marketplace add` | You pasted multiple lines at once. Run **only** `/plugin marketplace add tberghane/calibratr-plugins`, press Enter, then do the next command separately. |
| `/plugin isn't available in this environment` | You're not in the Claude Code CLI. Open a terminal, run `claude`, then use `/plugin`. It doesn't exist in claude.ai web or the desktop chat box. |
| Marketplace "added" but install does nothing | You dropped the `@calibratr-marketplace` suffix. Use the full `name@marketplace` form. |
| `plugin not found` | `/plugin marketplace list` to confirm `calibratr-marketplace`, then `/plugin marketplace update calibratr-marketplace` and retry. |
| A previous bad attempt left a broken marketplace | `/plugin marketplace remove calibratr-marketplace`, then re-add. |
| Commands don't appear after install | `/reload-plugins` (or restart Claude Code), then `/plugin` to confirm it's enabled. |
| `MCP server failed to start` | Confirm `node --version` is 18+ and on your PATH. |
| Few/no GitHub results or rate-limit errors | Set `GITHUB_TOKEN` and restart. |
| Product Hunt returns an error | Expected without `PRODUCTHUNT_TOKEN`; set it or omit `product_hunt`. |
| Update to latest | `/plugin marketplace update calibratr-marketplace`, then `/plugin update calibratr-sourcing-intelligence@calibratr-marketplace`. |

## Uninstall

```
/plugin uninstall calibratr-sourcing-intelligence
```
