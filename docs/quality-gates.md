# Quality Gates

To maintain a high standard of code and content quality, the repository implements a series of automated checks. Contributors and maintainers are required to run these verification gates before submitting or merging pull requests.

## The Verification Script

The primary entry point for all pre-submit checks is:

```bash
pnpm run verify
```

This script executes a sequence of individual validation tools to ensure the repository remains in a healthy state. Under the hood, `pnpm run verify` covers the following gates:

### 1. Content & Frontmatter Validation
- **Command:** `pnpm run check:content` (runs `tools/check-content/run.mjs`)
- **Coverage:** Scans MDX/Markdown files in the content collection directory. It validates frontmatter fields against Zod schemas, checking for required metadata (e.g., titles, descriptions, publication dates, and translation completeness).

### 2. Link Verification
- **Command:** `pnpm run check:links` (runs `tools/check-links/run.mjs`)
- **Coverage:** Analyzes internal relative links and absolute external links within markdown/MDX content files to ensure there are no dead links or broken anchors.

### 3. Image Integrity Checks
- **Command:** `pnpm run check:images` (runs `tools/check-images/run.mjs`)
- **Coverage:** Verifies that all images referenced in the content exist in the specified public or asset directories, preventing broken image placeholders.

### 4. SEO Metadata Validation
- **Command:** `pnpm run check:seo` (runs `tools/check-seo/run.mjs`)
- **Coverage:** Checks that pages have valid SEO properties (e.g., standard title length, description length, open graph tags, canonical links, and locale alternate declarations).

### 5. Tests
- **Command:** `pnpm test` (runs `vitest run`)
- **Coverage:** Executes the Vitest unit and integration test suite, ensuring utility functions (such as i18n routing helpers) behave correctly.

### 6. Astro Check & Build
- **Command:** `pnpm run build` (runs `astro check && astro build`)
- **Coverage:** Performs Astro-specific static analysis (`astro check` to validate Astro components and TypeScript types) and builds the site to verify there are no compilation errors.

---

## Continuous Integration (CI) Usage

Every pull request and commit pushed to the main repository triggers the GitHub Actions CI workflow (defined in `.github/workflows/ci.yml`). 

The CI runner executes the equivalent of `pnpm run verify` in an isolated environment:
1. Installs dependencies using `pnpm`.
2. Runs the validation scripts.
3. Runs the test suite.
4. Builds the application.

If any check fails, the build is marked as failed, and merging is blocked. Maintainers will check the CI logs to assist in troubleshooting the issue.
