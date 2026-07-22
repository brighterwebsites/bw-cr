# GSC setup — Phase A

Edge Functions: `gsc-oauth-start`, `gsc-oauth-callback`, `gsc-pull-site`

## Supabase secrets (Edge Functions)

Set in Supabase Dashboard → Project Settings → Edge Functions → Secrets:

| Secret | Example |
|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | From Google Cloud Console OAuth client |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Same client |
| `GSC_OAUTH_REDIRECT_URI` | `https://<project-ref>.supabase.co/functions/v1/gsc-oauth-callback` |
| `CRM_APP_URL` | `https://your-crm.pages.dev` or `http://localhost:5173` |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

## Google Cloud Console

1. APIs & Services → Enable **Google Search Console API**
2. OAuth consent screen (Internal or External)
3. Credentials → OAuth 2.0 Client ID → Web application
4. Authorized redirect URI = `GSC_OAUTH_REDIRECT_URI` above
5. Scope used: `webmasters.readonly`

## Deploy functions

```bash
cd supabase
supabase functions deploy gsc-oauth-start
supabase functions deploy gsc-oauth-callback --no-verify-jwt
supabase functions deploy gsc-pull-site
```

(`gsc-oauth-callback` is also configured with `verify_jwt = false` in `config.toml` for local dev.)

## CRM flow

1. **Assets → Integrations → Connect GSC** (per asset)
2. Google OAuth → redirect back to Assets with success notice
3. Confirm **GSC property URL** if auto-match failed
4. **Refresh metrics** (per asset or **SEO → Performance → Refresh GSC**)

## Duplicate setup from…

Copies `asset_connections.config` only. Operator must still **Connect GSC** for the new asset (separate OAuth grant).
