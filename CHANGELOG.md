# Changelog

All notable changes to this marketplace and its plugins are documented here. This project follows
[Semantic Versioning](https://semver.org).

## [Unreleased]

### Added
- **hermes-tweet v0.1.6**: Hermes Agent workflow guidance for X/Twitter market research, GTM social listening, public read analysis, and gated posting actions.

## [0.1.0] — 2026-06-07

Initial public release of the **Calibratr Plugins** marketplace.

### Added
- **calibratr-sourcing-intelligence v0.1.0** — evidence-first candidate sourcing.
  - 4 skills: `evidence-sourcing`, `role-dna`, `candidate-dossier`, `proof-of-work-scoring`
  - 5 commands: `/source`, `/dossier`, `/role-dna`, `/score`, `/calibrate`
  - 2 agents: `sourcing-orchestrator`, `dossier-researcher`
  - Bundled `csi-sources` MCP server (single self-contained `dist/index.js`, 6 tools) covering
    GitHub, Hacker News, arXiv, Hugging Face, Stack Overflow, Product Hunt + Semantic Scholar /
    email enrichment, cross-source dedupe, deterministic weighted scoring, verdict calibration.
  - Verbatim-URL guarantee; leans on host MCP tools (Exa, Wrangle, Apollo, ContactOut) for
    LinkedIn/contact rather than re-implementing them.
- Project-level `.calibratr/config.json` customization convention (company DNA, default sources,
  rubric weights, location).
- Marketplace scaffolding: CI (build + manifest validation), examples, contributor & security docs.
