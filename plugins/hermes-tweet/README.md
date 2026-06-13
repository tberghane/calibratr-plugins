# Hermes Tweet

Hermes Tweet is a native Hermes Agent plugin for X/Twitter research, GTM social listening, public read analysis, and gated account actions through Xquik.

This Claude plugin adds workflow guidance for using Hermes Tweet from a Calibratr project. Install Hermes Tweet in the Hermes runtime first, then use the included skill to choose `tweet_explore`, `tweet_read`, and `tweet_action` safely.

## Install

Install this Claude plugin from the Calibratr marketplace:

```text
/plugin marketplace add tberghane/calibratr-plugins
/plugin install hermes-tweet@calibratr-marketplace
/reload-plugins
```

Install and enable the native Hermes Agent plugin:

```bash
hermes plugins install Xquik-dev/hermes-tweet --enable
```

If the Hermes runtime does not install Python dependencies automatically, use the PyPI fallback:

```bash
uv pip install --python ~/.hermes/hermes-agent/venv/bin/python hermes-tweet
```

## Runtime Configuration

| Variable | Required | Purpose |
|---|---:|---|
| `XQUIK_API_KEY` | Yes for `tweet_read` and `tweet_action` | Enables configured Xquik API access in the Hermes runtime. |
| `HERMES_TWEET_ENABLE_ACTIONS=true` | Only for actions | Enables posting, replies, likes, follows, DMs, monitors, and other account-changing workflows. |

Keep keys in the Hermes runtime environment or `~/.hermes/.env`. Do not paste keys into chat, issue bodies, logs, prompts, or plugin files.

## What It Helps With

- Turn X/Twitter conversations into GTM market signal briefs.
- Research public posts, profiles, trends, and launch feedback through Hermes Tweet read tools.
- Prepare outreach, support, recruiting, or content plans with cited public URLs.
- Gate account-changing actions behind explicit user approval and `HERMES_TWEET_ENABLE_ACTIONS=true`.

## Safety Defaults

- Start with `tweet_explore` to find the route or capability.
- Use `tweet_read` for public read-only X/Twitter data after the endpoint is known.
- Use `tweet_action` only after the user approves the exact endpoint, method, and payload.
- Never invent handles, post URLs, account URLs, or metrics.
- Never ask for or reveal API keys, passwords, cookies, or TOTP secrets.

## Configuration

No Calibratr config is required. For repeat GTM workflows, see [CONFIGURATION.md](CONFIGURATION.md) for optional project defaults.

## License

[MIT](LICENSE) © Xquik
