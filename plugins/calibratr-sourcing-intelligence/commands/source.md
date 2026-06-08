---
description: Source candidates for a role across all proof-of-work platforms, with verbatim profile URLs and work samples.
argument-hint: <role, JD text, or job-posting URL>
---

Source candidates for: **$ARGUMENTS**

Use the `evidence-sourcing` skill. If the input is a JD or URL (not already-structured criteria),
run the `role-dna` skill first to extract search terms, target sources, seniority, and location,
then hand off to `evidence-sourcing`.

For a large or multi-source pass, dispatch the `sourcing-orchestrator` agent to fan out and dedupe.

Return ranked candidate cards: name, title/company, location, verbatim profile URLs (or "URL not
verified"), proof-of-work links with signals, top skills, and a one-line evidence-based fit.
Do not spend paid credits (Wrangle/Apollo/ContactOut) without confirming first.
