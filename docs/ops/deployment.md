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

## Automated Deployments via GitHub Actions

The provided `.github/workflows/deploy.yml` requires the following secrets to be set in your GitHub repository:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

It will automatically deploy the `main` branch to Cloudflare.
