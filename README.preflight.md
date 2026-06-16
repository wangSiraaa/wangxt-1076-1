# Trae Preflight

This folder is prepared for `wangxt-1076-1`.

Use `.env` for stable local ports and compose project identity:

- APP_PORT: 18376
- API_PORT: 19376
- WEB_PORT: 20376
- DB_PORT: 21376
- REDIS_PORT: 22376

Smoke entry:

```bash
bash scripts/smoke.sh
```

The preflight files are environment scaffolding only. The generated business
project can replace or extend them when needed.
