# BW-CRM App

Vite + React front end for Brighter Websites CRM (Supabase backend).

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Env vars:

- `VITE_SUPABASE_URL` — `https://uvgzchkejlrqrgiorvwf.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` — from Supabase dashboard or MCP `get_publishable_keys`

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build → `dist/` |
| `npm run lint` | oxlint |

## Structure

```
src/
  lib/           supabase client, auth, data provider, pipeline helpers
  pages/         Shell, Pipeline, Customers, Login
  features/      Project detail panel
  types/         database.types.ts (regen via Supabase MCP when schema changes)
```

Design tokens: `../docs/tokens/` imported in `src/index.css`.
