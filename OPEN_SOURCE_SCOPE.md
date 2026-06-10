# Open Source Scope

This document outlines what parts of the original private repository have been extracted and open-sourced in this toolkit.

## Included (Open Source)

1. **i18n Infrastructure (`src/utils/i18n.ts`, `src/data/locales/`)**
   - The core bilingual routing logic.
   - Translation helper functions.

2. **Content Architecture (`src/content/config.ts`)**
   - Zod schemas for validating bilingual markdown/MDX content.
   - Generic schemas for blog posts and glossary/wiki entries.

3. **Generic UI Components (`src/components/`)**
   - `LanguagePicker`, `TableOfContents`, `ThemeToggle`, `FormattedDate`, `SearchDialog`.
   - Base SEO components (`BaseHead`, `JsonLD`).

4. **Maintenance Tooling (`tools/`)**
   - `check-links`: Internal and external broken link checker.
   - `check-images`: Image reference validation.
   - `check-seo`: SEO metadata validation.
   - `check-content`: Frontmatter validation.
   - `smoke-production`: Post-deploy production availability probe.
   - `update-log`: Automated changelog generation.

5. **GitHub Actions (`.github/workflows/`)**
   - Pre-configured workflows for CI, content quality gates, deployment, and smoke testing.
