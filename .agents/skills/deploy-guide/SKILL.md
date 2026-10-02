---
name: "deploy-guide"
description: "Use when deploying, configuring deployment, or working with Vercel in this project. Triggers: deploying to Vercel, modifying vercel.json, setting up CI/CD pipelines, configuring custom domains, managing environment variables, or when the user mentions deployment, Vercel, CI/CD, or production builds."
---

# Deployment Guide Skill

## Target Platform: Vercel

Production deploys are driven by `vercel.json`, which is the single source of truth.

### vercel.json Configuration

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "outputDirectory": "dist",
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ],
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- **`framework`**: `vite` — Vercel auto-detects the build system
- **`installCommand`**: `pnpm install --frozen-lockfile` — matches CI; a stale lockfile fails the build loudly
- **`outputDirectory`**: `dist` — Vite's default output
- **`headers`**: hashed `/assets/*` get long-lived immutable caching
- **`rewrites`**: SPA fallback — all routes fall back to `index.html`

**Rewrite ordering matters**: Vercel applies `rewrites` *after* the filesystem check, so
`/assets/*.js` and `/chaos.png` are still served from disk and only unknown paths hit
`index.html`. Never point a rewrite `source` at a concrete filename — the filesystem wins.

`engines.node` in `package.json` is `>=20.19.0`; Vercel resolves that to the latest LTS.
CI pins Node 22. Do not add `engines` to `vercel.json` — it is not part of the schema.

## Deployment Commands

```bash
# Deploy to Vercel (requires vercel CLI)
npx vercel              # Preview deployment
npx vercel --prod       # Production deployment
npx vercel dev          # Local dev against the real vercel.json

# Local build verification
pnpm build              # Must succeed before deploying
```

## Pre-Deploy Checklist

1. **All checks pass**:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```

2. **vercel.json updated**: If changing build/output settings, also update README deployment section

3. **Lockfile committed**: `--frozen-lockfile` means any dependency change must ship with a
   regenerated `pnpm-lock.yaml`

4. **Environment variables**: Set in Vercel dashboard or via CLI:
   ```bash
   npx vercel env add <NAME> <VALUE>
   ```
   The app currently requires none.

## Local Preview

```bash
pnpm dev                # Start dev server at localhost:5173
pnpm build && pnpm preview  # Build + serve dist/ at localhost:4173
```

`pnpm dev` and `pnpm preview` both provide history fallback, so they cannot detect a broken
`vercel.json` rewrite. Use `npx vercel dev` when validating deployment config.

## Post-Deploy Checklist

Run against the public custom domain `https://china.chaosmic.cn/`:

1. `/` renders the home page.
2. `/china/timeline` and `/china/policies` deep links do not 404.
3. A generated `/<html-resource-slug>` route renders its iframe.
4. An unknown path lands on the in-app 404, not a Vercel error page.
5. `/assets/*.js` responses carry `Cache-Control: public, max-age=31536000, immutable`.
6. `/heritage/*.jpg` responds with `content-type: image/jpeg`.

**Do not verify against the Vercel `environment_url` from the GitHub Deployment record.**
That URL is password-protected and 302-redirects every request to a Vercel SSO page, which
looks like a healthy 200 with an unrelated HTML body. Use the custom domain.

To confirm a push deployed without hitting the Vercel dashboard:

```bash
curl -s https://api.github.com/repos/chaos-design/china/deployments?per_page=1
# then fetch the deployment's statuses_url -> state should be "success"
```

## Best Practices

- Always run `pnpm build` locally before pushing to production
- Use preview deployments (`npx vercel`) for pull request reviews
- Keep `vercel.json` in sync with local build config
- Don't modify build/output settings without updating documentation
