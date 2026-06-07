# PeopleLens Launch Checklist

## Scope

This launch target is the AI-only Chrome Extension MVP for external trial users. The Web app is not part of this public launch phase.

## Included

- Chrome Extension side panel with active-page extraction and manual paste fallback.
- AI structured analysis with runtime payload validation.
- Person cards with evidence and confidence.
- Relationship summaries.
- Local memory with save, search, clear, and JSON export.
- Markdown export for the current analysis.
- Web app build kept as a local development and support-asset surface.

## Not Included

- Accounts or authentication.
- Cloud sync.
- External biography enrichment.
- Background page scanning.
- Page text highlighting or hover cards.
- Complex graph visualization.
- Public Web app launch.
- Local heuristic analysis as a user-facing mode.

## Required Checks

Run before release:

```bash
npm run validate
npm run e2e:extension
npm run release:package
```

Expected checks:

- OpenSpec validation passes.
- Web build passes as a support-surface check.
- Extension typecheck and build pass.
- Release asset inspection passes.
- Lightpanda and Playwright/Chromium extension E2E pass.
- Extension zip package is created under `.release/`.

## Static Support Pages

Confirm built support assets exist. Deploy only if a public privacy/support URL is needed for extension review:

- `/privacy.html`
- `/terms.html`
- `/robots.txt`
- `/site.webmanifest`
- `/favicon.svg`

## Optional Web Dev Smoke Test

1. Run `npm run dev`.
2. Paste a real article.
3. Configure AI provider settings.
4. Run AI analysis.
5. Save a person.
6. Confirm the person appears in local memory.
7. Export Markdown.
8. Export local memory JSON.
9. Clear memory and confirm the memory panel resets.

## Manual Extension Smoke Test

1. Run `npx playwright install chromium` if Chromium is not installed locally.
2. Run `npm run e2e:extension`.
3. Run `npm run build:extension`.
4. Load `extension-dist/` through Chrome Extensions Developer Mode.
5. Open an article page.
6. Open PeopleLens side panel.
7. Configure an AI provider API Key.
8. Click analyze current page.
9. Confirm the clicked button shows in-progress feedback and existing results remain visible during a retry.
10. Confirm person cards, relationships, local memory, save toggle, and Markdown export work.
11. Confirm fallback paste works on pages where extraction is blocked or too short.
12. Clear the API Key and confirm analysis is refused before reading the active page.

## Chrome Web Store Preparation

- Prepare screenshots listed in `docs/chrome-web-store-listing.md`.
- Confirm extension icon renders at 16, 32, 48, and 128 pixels.
- Provide a public privacy policy URL; Web product launch is not required.
- Confirm permission rationale matches `extension/manifest.json`.
