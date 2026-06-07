## Why

Local heuristic analysis is not strong enough for the current product bar. PeopleLens should simplify the user-facing product to one AI-powered analysis path, reduce ambiguous mode switching, and focus launch readiness on the Chrome Extension rather than a public Web deployment.

## What Changes

- Remove local heuristic analysis from user-facing Web and Chrome Extension flows.
- Make AI provider settings required for analysis and keep analysis user-triggered.
- Update the Chrome Extension side panel to analyze active pages through the configured AI provider with manual paste fallback.
- Treat Web as a development and support surface for now; do not present it as the launch target.
- Update release docs and packaging copy so the release artifact is the Chrome Extension package.

## Capabilities

### Modified Capabilities

- `article-analysis`: AI analysis becomes the only user-facing analysis path.
- `extension-mvp`: side panel uses AI analysis after user-triggered page extraction.
- `release-packaging`: release package is Extension-first; Web assets are support/build artifacts, not the public launch target.
- `fixture-quality-baseline`: local heuristic fixture checks remain available but are no longer part of the release validation gate.

## Impact

- Affected code: `src/App.tsx`, `src/ui/ArticleInput.tsx`, `extension/sidepanel.tsx`, `extension/sidepanel.css`, `scripts/`, `docs/`, `public/`, `openspec/`.
- Privacy: article title, source URL, and sentence list are sent to the user-configured AI provider only after the user starts analysis.
- Launch scope: Chrome Extension package can be tested and prepared; public Web deployment is deferred.
