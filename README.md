# Astro Bilingual Knowledge Stack

[![Astro](https://img.shields.io/badge/Astro-v5-ff5a03?logo=astro)](https://astro.build/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/ryanguan20001010-star/astro-bilingual-knowledge-stack/actions/workflows/ci.yml/badge.svg)](https://github.com/ryanguan20001010-star/astro-bilingual-knowledge-stack/actions)

> A minimal bilingual Astro starter for knowledge sites that need typed content, locale-aware routing, and maintainer quality gates.

Demo: https://ryanguan20001010-star.github.io/astro-bilingual-knowledge-stack/

## What This Is

This repository packages a small, reusable slice of a bilingual Astro publishing workflow:

- content collection schemas for English and Chinese knowledge pages
- i18n helpers and locale-aware route patterns
- neutral SEO metadata components
- content, link, image, and SEO quality-check scripts
- optional post-deploy smoke checks for public example routes
- GitHub Actions templates for install, validation, test, and build

It intentionally excludes paid content, commerce integrations, private analytics, brand assets, real production snapshots, and live cloud bindings.

## Quick Start

```bash
pnpm install
pnpm run dev
```

Before opening a PR or publishing a derived template, run:

```bash
pnpm run check:content
pnpm run check:links
pnpm run check:seo
pnpm test
pnpm run build
```

## Project Shape

```text
src/content/              Example bilingual MDX content
src/data/locales/         English and Chinese UI dictionaries
src/utils/i18n.ts         Locale helpers
tools/check-*             Maintainer quality gates
tools/smoke-production/   Optional public-route smoke checker
.github/workflows/        CI and content quality templates
```

## Documentation

- [Migration Guide](docs/migration-guide.md): Learn how to migrate your existing markdown site to this framework.
- [Open Source Scope](OPEN_SOURCE_SCOPE.md): Understand what belongs in this OSS template.
- [Private Exclusions](PRIVATE_EXCLUSIONS.md): Review what must never be copied from a private or commercial site.
- [Contributing](CONTRIBUTING.md): Find out how to contribute.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
