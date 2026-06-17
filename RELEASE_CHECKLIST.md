# Release Checklist

Use this checklist before tagging a public release.

## Repository Readiness

- [ ] Repository is public.
- [ ] `LICENSE` is present and recognized by GitHub.
- [ ] `README.md` explains the project without claiming adoption that is not public.
- [ ] `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `ROADMAP.md`, and `CHANGELOG.md` are present.
- [ ] Issue templates and the pull request template are present.

## Boundary Check

- [ ] No private brand names or production domains remain.
- [ ] No paid content, commerce integrations, or marketing automation remain.
- [ ] No real analytics snapshots, private operations data, or live cloud bindings remain.
- [ ] `.env.example` contains placeholders only.

## Verification

Run these commands before tagging:

```bash
pnpm run verify
pnpm run smoke:prod -- --base http://127.0.0.1:4321
```

For local smoke checks, start a preview server first:

```bash
pnpm preview --host 127.0.0.1 --port 4321
```
