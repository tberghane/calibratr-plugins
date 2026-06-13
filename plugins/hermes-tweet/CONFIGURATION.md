# Configuration

Hermes Tweet reads credentials from the Hermes runtime environment, not from Calibratr config files.

## Required Runtime Variables

| Variable | Required | Notes |
|---|---:|---|
| `XQUIK_API_KEY` | Yes for live reads and actions | Store it in the Hermes runtime environment or `~/.hermes/.env`. |
| `HERMES_TWEET_ENABLE_ACTIONS=true` | Only for account actions | Leave unset or false for read-only research sessions. |

Never store secret values in `.calibratr/config.json`, repository files, prompts, logs, or issue text.

## Optional Project Defaults

You can keep non-secret GTM context in `.calibratr/config.json` so the skill has consistent defaults:

```jsonc
{
  "social": {
    "brand_terms": ["Acme AI", "Acme agents"],
    "competitors": ["ExampleCo"],
    "default_window": "last 7 days",
    "approval_required": true
  }
}
```

Use these values only as defaults. Explicit user instructions override them.

## Read-Only Mode

For unattended research, scheduled analysis, and gateway-driven workflows:

1. Configure `XQUIK_API_KEY`.
2. Keep `HERMES_TWEET_ENABLE_ACTIONS` unset or false.
3. Use `tweet_explore` and `tweet_read`.
4. Ask for approval before changing the account state.

## Action Mode

For posting, replies, likes, follows, DMs, monitors, webhooks, extraction jobs, media operations, or giveaway actions:

1. Set `HERMES_TWEET_ENABLE_ACTIONS=true`.
2. State the endpoint, method, payload, and reason before the action.
3. Call `tweet_action` only after explicit approval.
4. Do not retry failed writes through alternate routes.
