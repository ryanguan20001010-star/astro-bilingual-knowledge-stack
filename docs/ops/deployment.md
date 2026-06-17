# Deployment Guide

This project is optimized for deployment on Cloudflare Pages, but can be adapted for Vercel, Netlify, or standard Node/Static environments.

## Cloudflare Pages Setup

1. Push your repository to GitHub.
2. Log in to your Cloudflare Dashboard.
3. Go to "Workers & Pages" -> "Create application" -> "Pages" -> "Connect to Git".
4. Select this repository.
5. Set the build command: `pnpm build`
6. Set the output directory: `dist`
7. Add Environment Variables:
   - `NODE_VERSION`: `20`
8. Click "Save and Deploy".

## Optional Smoke Checks

This repository does not ship a provider-specific deploy workflow in `v0.1.0`.
Deployment should happen through your host's standard integration.

After deployment, you can run `.github/workflows/release-smoke.yml` manually with
your public site URL. Locally, you can run the same check with:

```bash
pnpm run smoke:prod -- --base https://your-site.example
```
