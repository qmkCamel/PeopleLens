# PeopleLens Release Guide

## Release Type

Current target: MVP/Beta.

This release is suitable for Web MVP deployment and Chrome Extension internal testing. Chrome Web Store production submission still requires final screenshots, developer account review, and a public support URL.

## Prerequisites

- Node and npm available through mise or local Node installation.
- Dependencies installed with `npm ci`.
- Public npm registry lockfile intact.

## Build and Validate

```bash
npm ci
npm run validate
```

## Package Release

```bash
npm run release:package
```

Outputs:

- Web static site: `dist/`
- Chrome Extension unpacked build: `extension-dist/`
- Chrome Extension zip: `.release/peoplelens-extension-0.1.0.zip`

## Web Deployment

Deploy `dist/` to a static host such as Vercel, Netlify, Cloudflare Pages, GitHub Pages, or an object storage CDN.

Required static files included in `dist/`:

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
5. Provide public privacy policy URL from the deployed Web app.

## Release Gate

Do not release if any of these fail:

- `npm run openspec:validate`
- `npm run fixtures:analyze`
- `npm run build`
- `npm run typecheck:extension`
- `npm run build:extension`
