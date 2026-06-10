# Astro Bilingual Knowledge Stack

[![Astro](https://img.shields.io/badge/Astro-v5-ff5a03?logo=astro)](https://astro.build/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/ryanguan20001010-star/astro-bilingual-knowledge-stack/actions/workflows/ci.yml/badge.svg)](https://github.com/ryanguan20001010-star/astro-bilingual-knowledge-stack/actions)

> *A production-ready bilingual (CJK/EN) i18n content framework for Astro, extracted from a live knowledge base.*

## Background

**Extracted from production:** This framework is the core engine extracted from a live production bilingual knowledge base running thousands of articles across Chinese and English, serving readers actively. We built this because Astro's built-in i18n routing is great, but maintaining a production documentation site requires automated quality gates, strictly typed frontmatter schemas, and a robust CI/CD pipeline.

## Features

- **Built-in i18n Routing:** Native support for `/en/` and `/zh/` prefixes with automatic locale detection.
- **Zod Schema Validation:** Strictly typed frontmatter for markdown and MDX content.
- **CI/CD Quality Gates:** Automated scripts to prevent broken links, missing images, and invalid SEO metadata.
- **Maintainer Workflows:** Tools for generating automated CHANGELOGs and running post-deploy smoke tests.

## Screenshot

![Bilingual Stack Demo](https://via.placeholder.com/1280x960.png?text=Bilingual+Knowledge+Stack+Demo)

## Quick Start

You can create a new project based on this template in seconds. No need to clone!

```bash
npm create astro@latest -- --template ryanguan20001010-star/astro-bilingual-knowledge-stack
```

## Documentation

- [Migration Guide](docs/migration-guide.md): Learn how to migrate your existing markdown site to this framework.
- [Contributing](CONTRIBUTING.md): Find out how to contribute to this project. We welcome beginners!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
