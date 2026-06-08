# Contributing to Calibratr Plugins

Thanks for helping improve these tools. This repo is a Claude Code plugin marketplace; each plugin
lives under `plugins/<name>/`.

## Repo layout

```
.claude-plugin/marketplace.json   # the catalog (one entry per plugin)
plugins/<name>/
  .claude-plugin/plugin.json      # plugin manifest
  skills/  commands/  agents/     # plugin components
  mcp/<server>/                   # bundled MCP server (TypeScript)
  README.md  CONFIGURATION.md
examples/                         # sample configs, queries
```

## Working on a plugin's MCP server

```bash
cd plugins/<name>/mcp/<server>
npm install
npm run dev        # watch mode
npm run typecheck  # types only
npm run build      # typecheck + bundle to a single self-contained dist/index.js
```

**Always commit the rebuilt `dist/index.js`.** Plugins install without running `npm install`, so the
bundled single-file server is what ships. CI rebuilds and verifies the bundle on every push; if your
committed bundle is stale, CI fails.

## Adding a new plugin

1. Create `plugins/<your-plugin>/` with a `.claude-plugin/plugin.json` (minimum: `name`).
2. Add components (`skills/`, `commands/`, `agents/`, `mcp/`).
3. Register it in `.claude-plugin/marketplace.json` (`name` + `source: "./plugins/<your-plugin>"`).
4. Read an optional `.calibratr/config.json` for user customization (see existing plugins).
5. Update the catalog table in the root `README.md` and add a `CHANGELOG.md` entry.

## Conventions

- **Verbatim URLs only.** Never construct or infer a profile URL. Absent → "URL not verified".
- **Evidence required.** Claims cite a source artifact.
- Skills follow the `Use when…` description format; keep them concise and keyword-rich.
- TypeScript strict; no `any`; tools use Zod input schemas with `.strict()`.

## PRs

Keep PRs focused. Describe what changed, why, and how you verified it. CI must pass (build + manifest
validation). For anything user-facing, update the relevant README/CHANGELOG.
