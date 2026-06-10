# Maintainer Workflows

Running a content-heavy documentation or knowledge site requires discipline. This toolkit automates the boring parts.

## 1. Content Authoring

- Write English content in `src/content/blog/en/`.
- Write Chinese content in `src/content/blog/zh/`.
- Keep file names (slugs) identical across languages for automatic alternate linking.

## 2. Pre-Commit / Pre-Push Checks

Before opening a PR, run:
```bash
pnpm check:content
pnpm check:links
pnpm check:images
```

## 3. Review Process

The `ci.yml` and `content-quality.yml` GitHub Actions will automatically run the quality gates. PRs with broken links or invalid frontmatter will fail CI.

## 4. Release and Changelog

To generate an automatic changelog update based on your Git history:
```bash
pnpm update-log
```
This script reads your commits and updates `WEBSITE_UPDATES.md` (or `CHANGELOG.md` depending on configuration).

## 5. Post-Deploy Validation

After deployment, the smoke test script hits critical routes to ensure they return 200 OK and didn't break during build:
```bash
pnpm smoke:prod --base https://your-site.com
```
