# PeopleLens Project Context

## Purpose

PeopleLens is a local-first reading assistant that turns people-heavy articles into a clear cast list. It helps readers understand who appears in an article, why they matter in that article, how they relate to each other, and whether the reader has seen or saved them before.

## Current Product Stage

- Web MVP built with Vite, React, and TypeScript.
- Users paste article text and optionally provide title and source URL.
- Analysis supports local heuristic extraction and AI structured extraction.
- Local memory currently uses browser `localStorage`.
- A fixture article workflow exists under `fixtures/` for quality baselines.

## Key Commands

- `npm run dev` starts the Vite development server.
- `npm run build` runs TypeScript and production build checks.
- `npm run fixtures:analyze` runs local analysis against ready fixture articles.
- `npm run openspec:list` lists active OpenSpec changes.
- `npm run openspec:validate -- <change-or-spec>` validates OpenSpec artifacts.

## Code Layout

- `src/analysis/` contains text cleanup, sentence splitting, local extraction, relationship extraction, AI provider integration, and Markdown export.
- `src/memory/` contains browser-local person memory.
- `src/ui/` contains React UI components.
- `fixtures/articles.json` is the fixture manifest.
- `fixtures/sources/` stores manually collected source article Markdown.
- `docs/` contains product and technical design notes.

## Development Workflow

- Use OpenSpec for feature-sized changes, behavior changes, architectural shifts, and changes that alter user-facing requirements.
- Small mechanical fixes may be implemented directly when the intended behavior is already clear.
- For OpenSpec changes, create a proposal before implementation, keep tasks verifiable, then archive the change after implementation and validation.
- Prefer adding or updating fixture expectations when extraction quality changes.
- Run `npm run fixtures:analyze` and `npm run build` before considering a change complete.

## Product Constraints

- Preserve the privacy posture: local mode must not upload article text.
- AI mode must remain explicit and user-triggered.
- Avoid background page scanning in the MVP.
- Person cards should prioritize article-grounded identity, role, evidence, and uncertainty over broad biography.
- Relationship summaries should be evidence-backed and conservative.

## Engineering Constraints

- Keep analysis logic deterministic where possible.
- Prefer conservative false-positive reduction for local extraction, especially Chinese names.
- Keep generated and temporary outputs out of git.
- Do not commit `node_modules/`, `dist/`, or `.tmp/`.
- Do not use private npm registry URLs in `package-lock.json`; use `https://registry.npmjs.org/`.
