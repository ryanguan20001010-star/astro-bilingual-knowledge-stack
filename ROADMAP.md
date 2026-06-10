# Roadmap

## v0.1.0 - The Extraction (Current)
- [x] Extract core i18n routing and content schemas from production repository.
- [x] Port content quality CLI tools (links, images, SEO).
- [x] Port maintainer scripts (smoke tests, changelog generation).
- [x] Setup GitHub Actions templates.
- [x] Create example bilingual content (neutral domain).
- [x] Document architecture and deployment processes.

## v0.2.0 - Tooling Enhancements
- [ ] Refine the CLI interface for the tooling scripts (add help menus, better error formatting).
- [ ] Add a `check-translations` tool to detect missing translation keys between `en.json` and `zh.json`.
- [ ] Improve the smoke test framework to support declarative configuration files.
- [ ] Add Lighthouse CI integration documentation.

## v1.0.0 - Stable Release
- [ ] Convert the toolkit into a more easily installable npm package / Astro integration, rather than just a starter template.
- [ ] Comprehensive test suite coverage (unit, integration, visual regression).
- [ ] Multi-theme support (currently hardcoded to a default aesthetic).
- [ ] Extensive tutorials and community templates.
