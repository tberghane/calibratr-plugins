---
name: hermes-tweet
description: Use when the user asks for X/Twitter market research, GTM social listening, public post or account analysis, launch monitoring, support triage, recruiting signals, or approved account actions through Hermes Tweet.
---

# Hermes Tweet

Use Hermes Tweet when a Calibratr project needs X/Twitter research or controlled account actions through Hermes Agent.

## When to Use

Use this skill for social listening, launch monitoring, support triage, creator research, competitor research, recruiting signals, community audits, public trend analysis, and approved publishing workflows.

Do not use this skill for generic web research with no X/Twitter angle. Do not use it to bypass approval for posting, replying, liking, following, DMs, monitors, webhooks, extraction jobs, media operations, or giveaway actions.

## Setup Checks

1. Confirm Hermes Tweet is installed and enabled in the Hermes runtime.
2. Confirm `XQUIK_API_KEY` is configured before live reads or actions.
3. Keep `HERMES_TWEET_ENABLE_ACTIONS` unset or false for read-only work.
4. Require `HERMES_TWEET_ENABLE_ACTIONS=true` and explicit approval for account-changing actions.

## Workflow

1. Classify the task as discovery, public read analysis, or account action.
2. Use `tweet_explore` first to find the endpoint, capability, or route.
3. Use `tweet_read` only for public read-only endpoints returned by the catalog.
4. Use `tweet_action` only when the user approved the exact endpoint, method, payload, and reason.
5. Cite returned public URLs and timestamps. Mark missing links as "URL not verified".
6. Present results as a concise market signal brief or action summary.

## Market Signal Brief

Use this format for research outputs:

```text
## Signal Brief
- Query:
- Window:
- Top signals:
- Notable posts or accounts:
- Risk or caveat:
- Suggested next step:
```

Ground every claim in returned data. Do not invent handles, URLs, metrics, account state, or trend strength.

## Decision Rules

- If the user asks what Hermes Tweet can do, call `tweet_explore`.
- If the endpoint is `GET` and the catalog does not mark it as an action, use `tweet_read`.
- If the endpoint is not `GET`, touches private account state, or changes account state, use `tweet_action` only after approval.
- If `tweet_action` is disabled, explain that actions require `HERMES_TWEET_ENABLE_ACTIONS=true`.
- If `XQUIK_API_KEY` is missing, ask the user to configure it in the Hermes runtime without sharing the key in chat.
- If Hermes reports the plugin is not enabled, ask the user to run `hermes plugins enable hermes-tweet` or reinstall with `--enable`.

## Safety

- Never ask for or reveal API keys, passwords, cookies, or TOTP secrets.
- Never pass credentials in tool arguments.
- Never place keys in `.calibratr/config.json`.
- Use only catalog-listed endpoints.
- Do not guess endpoint paths or build URLs from names.
- Do not retry writes through alternate routes after policy, auth, or account-state errors.
- Summarize the exact action before posting, replying, liking, following, sending DMs, creating monitors, running webhooks, starting extraction jobs, uploading media, or drawing giveaways.

## Install Reference

```bash
hermes plugins install Xquik-dev/hermes-tweet --enable
uv pip install --python ~/.hermes/hermes-agent/venv/bin/python hermes-tweet
```

After install, run `hermes tools list` and confirm `tweet_explore`, `tweet_read`, and the gated `tweet_action` behavior match the configured environment.
