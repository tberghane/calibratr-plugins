# Calibratr Plugins

**Recruiting & GTM tooling, built by [Calibratr](https://calibratr.ai), packaged as Claude plugins
you can add to your own Claude instance — and adapt to your own needs.**

This is a [Claude Code plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces).
Add it once, then install any plugin in the catalog. Run each line **separately** (one at a time,
Enter between them) in the **Claude Code CLI**:

```
/plugin marketplace add tberghane/calibratr-plugins
```
```
/plugin install <plugin>@calibratr-marketplace
```
```
/reload-plugins
```

> **Run them one at a time.** Pasting all three together makes the CLI read them as one repo name
> and fail (`URL rejected: Malformed input`). Easiest path with zero syntax: run `/plugin`, add the
> marketplace, then install from the **Discover** tab.
>
> `/plugin` is **CLI-only** — not available in claude.ai web or the desktop chat box. See
> [other ways to use these](#using-these-outside-claude-code) and the per-plugin
> [INSTALL guide](plugins/calibratr-sourcing-intelligence/INSTALL.md).

## Catalog

| Plugin | What it does | Install |
|---|---|---|
| **[calibratr-sourcing-intelligence](plugins/calibratr-sourcing-intelligence)** | Evidence-first candidate sourcing — verbatim profile URLs + real proof-of-work across GitHub, arXiv, Hugging Face, Stack Overflow, Hacker News, Product Hunt; claim verification; Role-DNA scoring; verdict calibration. | `/plugin install calibratr-sourcing-intelligence@calibratr-marketplace` |
| **[hermes-tweet](plugins/hermes-tweet)** | Hermes Agent workflows for X/Twitter market research, GTM social listening, public read analysis, and gated posting actions through Hermes Tweet. | `/plugin install hermes-tweet@calibratr-marketplace` |

_More Calibratr plugins land here over time._

## Make it yours

Every plugin reads an optional project-level config so you can adapt it without editing any
skill files. Drop a `.calibratr/config.json` in your working directory:

```jsonc
{
  "company": { "name": "Acme", "values": ["bias to ship", "writes to think"] },
  "sourcing": { "default_sources": ["github", "stackoverflow"], "default_location": "Remote (US)" },
  "scoring":  { "default_weights": { "role_fit": 55, "dna_fit": 30, "impact": 15 }, "threshold": 60 }
}
```

Plugins use these as defaults and fall back to sensible built-ins when the file is absent. See
[examples/config.example.json](examples/config.example.json) and each plugin's `CONFIGURATION.md`.

## Trust & privacy

- **Verbatim URLs only.** Plugins never fabricate a profile URL (especially LinkedIn). A missing
  link shows as "URL not verified" — never a guess.
- **Your machine, your keys.** The bundled MCP servers run locally and call only the public APIs
  you opt into. No candidate data is sent to Calibratr.
- **Cost-aware.** Paid providers (where used) are gated behind explicit confirmation.

## Using these outside Claude Code

- **Claude Code (primary):** the marketplace flow above.
- **claude.ai / Cowork:** the `skills/` folders are portable — a plugin's skills can be uploaded as
  Skills; the bundled MCP server can be added as an MCP connector.
- **Any MCP client:** run a plugin's `mcp/<server>/dist/index.js` directly (Node 18+, no install).

## Contributing

Issues and PRs welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Report security concerns via
[SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © Calibratr
