# Migration Guide

Migrating an existing Markdown-based documentation site to the Bilingual Knowledge Stack is straightforward.

## 1. Move Your Content

Place your English Markdown files in `src/content/blog/en/` and your Chinese (or alternative language) files in `src/content/blog/zh/`.

**Important:** To ensure the language switcher works correctly, keep  filenames (slugs) identical across language directories.

## 2. Update Frontmatter

Ensure your Markdown files comply with the Zod schema defined in `src/content/config.ts`. The required fields are:

- `title`
- `description`
- `pubDate`
- `locale` (`en` or `zh`)

Example:

```yaml
---
title: "My Existing Post"
description: "A migrated post"
pubDate: "2026-06-10"
locale: "en"
---
```

## 3. Run Quality Checks

After moving your files, run the built-in quality checks to ensure no links were broken during migration:

```bash
pnpm run check:links
pnpm run check:images
```
