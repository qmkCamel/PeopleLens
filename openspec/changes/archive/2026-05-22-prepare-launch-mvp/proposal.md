## Why

PeopleLens has a functional Web MVP, but several launch-readiness gaps remain: local memory is not inspectable or exportable, AI structured output is not validated before rendering, Chrome Extension packaging is not available, and the project lacks a single verification path for these requirements.

This change prepares the MVP for external trial use while preserving the current privacy posture and avoiding non-MVP scope such as accounts, cloud sync, external biography enrichment, or automated background scanning.

## What Changes

- Add a memory library panel with search, saved/recent sections, and local memory export.
- Add runtime validation for AI structured responses before mapping them to UI state.
- Add a Chrome Extension MVP side panel that can analyze the active page on user request and fall back to manual paste.
- Add extension build tooling and documentation.
- Update specs for launch-ready Web MVP behavior and Extension MVP behavior.

## Capabilities

### New Capabilities
- `extension-mvp`: Chrome Extension side panel, active-page extraction, and manual fallback.

### Modified Capabilities
- `article-analysis`: runtime validation for AI structured responses and extension-initiated analysis.
- `local-memory`: searchable memory library and local memory export.
- `fixture-quality-baseline`: launch validation must include fixture analysis.

## Impact

- Affected code: `src/App.tsx`, `src/memory/`, `src/ui/`, `src/analysis/openaiProvider.ts`, `extension/`, `scripts/`.
- Affected build: adds `npm run build:extension` and `npm run validate`.
- Privacy: extension uses `activeTab` and user-triggered extraction only; no background scanning.
