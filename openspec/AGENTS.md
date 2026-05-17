# OpenSpec Instructions for PeopleLens

Use OpenSpec as the durable planning layer for PeopleLens.

## When to Use OpenSpec

Create an OpenSpec change for:

- New user-facing features.
- Changes to article analysis behavior or person extraction quality.
- Changes to memory, privacy, AI provider behavior, or export behavior.
- Architectural changes that affect future Chrome Extension work.

Direct implementation is acceptable for:

- Typo fixes.
- Small dependency or environment cleanup.
- Test/fixture maintenance that does not change intended product behavior.

## Change Lifecycle

1. Propose: define what changes and why.
2. Explore/design/spec: capture affected requirements and implementation approach.
3. Apply: implement tasks against the accepted artifacts.
4. Validate: run OpenSpec validation plus project checks.
5. Archive: consolidate completed behavior into permanent specs.

## Required Local Checks

Before completion, run:

```bash
npm run fixtures:analyze
npm run build
```

Run OpenSpec validation for relevant artifacts:

```bash
npm run openspec:validate -- <change-or-spec>
```

## Repository Notes

- Read `openspec/project.md`, `docs/product-mvp-design.md`, and `docs/technical-architecture.md` when proposing feature-sized changes.
- Keep fixture data under `fixtures/`.
- Keep temporary outputs under `.tmp/`, which is ignored by git.
- Preserve the MVP privacy model: user-triggered analysis, local-first memory, no background scanning.
