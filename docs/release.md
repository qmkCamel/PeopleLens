# PeopleLens Release Guide

## Release Type

Current target: MVP/Beta.

This release is suitable for Chrome Extension internal testing and store-preparation review. The Web app is not a public launch target in this phase; `dist/` is kept as a build-validated support asset surface.

Chrome Web Store production submission still requires final screenshots, developer account review, a public support URL, and a public privacy policy URL.

## Prerequisites

- Node and npm available through mise or local Node installation.
- Dependencies installed with `npm ci`.
- Public npm registry lockfile intact.

## Build and Validate

```bash
npm ci
npx playwright install chromium
npm run validate
npm run e2e:extension
```

## Package Release

```bash
npm run release:package
```

Outputs:

- Web support assets: `dist/`
- Chrome Extension unpacked build: `extension-dist/`
- Chrome Extension zip: `.release/peoplelens-extension-0.1.0.zip`

## Web Deployment

Do not deploy the Web app as the product launch target for this phase.

If a public privacy policy URL is needed for Chrome Web Store review, deploy only the support pages or host equivalent policy text through an approved support channel.

Support files included in `dist/`:

- `privacy.html`
- `terms.html`
- `robots.txt`
- `site.webmanifest`
- `favicon.svg`

## Chrome Extension Distribution

Internal testing:

1. Run `npm run build:extension`.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Load unpacked `extension-dist/`.

Store submission:

1. Run `npm run release:package`.
2. Upload `.release/peoplelens-extension-0.1.0.zip`.
3. Use draft copy from `docs/chrome-web-store-listing.md`.
4. Attach screenshots.
5. Provide a public privacy policy URL. The Web product itself does not need to be launched.

## Release Gate

Do not release if any of these fail:

- `npm run openspec:validate`
- `npm run build`
- `npm run typecheck:extension`
- `npm run build:extension`
- `npm run release:check`
- `npm run e2e:extension`

`npm run fixtures:analyze` remains available as a local heuristic regression tool, but it is not a release gate while local heuristic analysis is not user-facing.
