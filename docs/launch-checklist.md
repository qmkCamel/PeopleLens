# PeopleLens Launch Checklist

## Scope

This launch target is the Web MVP plus Chrome Extension MVP for external trial users.

## Included

- Paste-based Web MVP.
- Local heuristic analysis.
- AI structured analysis with runtime payload validation.
- Person cards with evidence and confidence.
- Relationship summaries.
- Local memory with save, search, clear, and JSON export.
- Markdown export for the current analysis.
- Fixture quality baseline.
- Chrome Extension side panel with active-page extraction and manual paste fallback.

## Not Included

- Accounts or authentication.
- Cloud sync.
- External biography enrichment.
- Background page scanning.
- Page text highlighting or hover cards.
- Complex graph visualization.

## Required Checks

Run before release:

```bash
npm run validate
npm run release:package
```

Expected checks:

- OpenSpec validation passes.
- Fixture analysis passes.
- Web build passes.
- Extension build passes.
- Extension zip package is created under `.release/`.

## Static Release Pages

Confirm deployed URLs work:

- `/privacy.html`
- `/terms.html`
- `/robots.txt`
- `/site.webmanifest`
- `/favicon.svg`

## Manual Web Smoke Test

1. Run `npm run dev`.
2. Paste a real article.
3. Run local analysis.
4. Save a person.
5. Confirm the person appears in local memory.
6. Export Markdown.
7. Export local memory JSON.
8. Clear memory and confirm the memory panel resets.

## Manual Extension Smoke Test

1. Run `npm run build:extension`.
2. Load `extension-dist/` through Chrome Extensions Developer Mode.
3. Open an article page.
4. Open PeopleLens side panel.
5. Click analyze current page.
6. Confirm fallback paste works on pages where extraction is blocked or too short.

## Chrome Web Store Preparation

- Prepare screenshots listed in `docs/chrome-web-store-listing.md`.
- Confirm extension icon renders at 16, 32, 48, and 128 pixels.
- Use the deployed `/privacy.html` URL for privacy policy.
- Confirm permission rationale matches `extension/manifest.json`.
