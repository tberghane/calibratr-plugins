# Security Policy

## Reporting a vulnerability

Email **taylor@calibratr.ai** with details and reproduction steps. Please do not open a public issue
for security-sensitive reports. We aim to acknowledge within a few business days.

## What these plugins do (and don't) with your data

- **Local execution.** Bundled MCP servers run on your machine via Node. They are not hosted by
  Calibratr and send nothing to Calibratr.
- **Outbound calls.** Servers call only the public APIs a plugin documents (e.g. GitHub, arXiv,
  Hugging Face, Stack Overflow, Hacker News, Product Hunt) plus whatever host MCP tools you invoke.
- **Secrets.** API tokens are read from your environment (e.g. `GITHUB_TOKEN`) and never written to
  disk or logs by these plugins. Never commit tokens. `.calibratr/config.json` should reference token
  **names**, not values.
- **Candidate data.** Sourcing returns publicly available information. If you persist it, you are the
  data controller — apply your own retention/consent practices.

## Scope

This policy covers the plugins in this repository. Vulnerabilities in upstream dependencies (e.g. the
MCP SDK) should also be reported to their respective maintainers.
