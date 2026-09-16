# Deployment

## Public static app

Build with `npm ci && npm run build`; serve `build/client` at the domain root over HTTPS. SPA routes should fall back to `index.html`, but missing `/library/*` and `/assets/*` files must return 404. Serve `sw.js`, `offline-manifest.json` and HTML with `Cache-Control: no-cache`. The manifest assumes root hosting (not a GitHub Pages repository subdirectory). Secrets and learner databases are never part of the static build.

## Optional account and AI services

Run Node.js 24 LTS under an unprivileged service user. Set production `APP_ORIGIN` to the exact HTTPS origin and point `DATA_DIR` to a persistent directory writable only by the service. `NODE_ENV=production` rejects an insecure origin and uses Secure cookies. Keep `LOCAL_PREVIEW` disabled in production.

Configure a Google OAuth **Web application** client with the exact redirect URI `https://YOUR-DOMAIN/auth/callback`. Put `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the service's environment file, never frontend variables or Git. Google consent-screen publishing and account policy are operator actions. Start with `ACCESS_MODE=google`; set `ACCESS_MODE=mfu` and an explicitly reviewed comma-separated `ALLOWED_GOOGLE_DOMAINS` list to limit future account services. Do not guess lecturer domains.

Set a valid `DEEPSEEK_API_KEY` and provider-supported `DEEPSEEK_MODEL` to enable AI. Rotate any credential previously pasted into a conversation. Missing credentials leave public lessons usable and show the online-service setup state.

Run `node server/index.ts` behind Nginx on port 4173 (or `PORT`). Set forwarded host/protocol and proxy requests only from localhost. Use a dedicated access-log format that logs `$uri` without OAuth callback query parameters. Keep the app isolated from other hosted services. See `ops/` templates. These templates must be adapted to your domain and filesystem layout.

## Operations and recovery

Back up SQLite with its backup API or stop the service before copying the database and WAL files. Keep backups private. Test restores separately. Deploy into versioned release directories and switch a `current` symlink, preserving `DATA_DIR`. Validate `/api/health`, `/course.json`, an asset, a lesson route and HTTPS before handoff. Keep the prior release for rollback; never run a destructive migration against another service.

Public GitHub source contains no production secrets or user data. The GitHub release workflow packages prebuilt course resources and platform launch scripts. It does not publish to application stores or configure OAuth provider accounts.
