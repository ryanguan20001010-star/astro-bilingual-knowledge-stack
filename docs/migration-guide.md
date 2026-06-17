# Migration Guide

Migrating an existing markdown-based documentation site to the Bilingual Knowledge Stack is straightforward.

## 1. Move Your Content

Place your English markdown files in `src/content/blog/en/` and your Chinese (or alternate language) files in `src/content/blog/zh/`.

**Important:** To ensure the language switcher works correctly, keep the filenames (slugs) identical across language directories.

## 2. Update Frontmatter

Ensure your markdown files comply with the Zod schema defined in `src/content/config.ts`. The required fields are:

- `title`
- `description`
- `pubDate`
- `locale` ('en' or 'zh')

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

After moving your files, run the built-in quality gates to ensure no links were broken during the migration:

```bash
pnpm run check:links
pnpm run check:images
```
