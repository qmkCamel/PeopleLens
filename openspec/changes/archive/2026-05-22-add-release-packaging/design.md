## Overview

Release packaging is implemented as static assets and deterministic scripts. The Web app remains a static Vite deployment. The extension package remains unpacked output in `extension-dist/` with a zip artifact for distribution review.

## Decisions

### Policy Pages

Use static HTML under `public/` for privacy and terms. This keeps the pages available at predictable URLs after static deployment without adding routing.

### Icons

Generate simple PNG icons for extension-required sizes and a favicon SVG for Web. The source of truth is a small deterministic script so icon assets can be regenerated without design tooling.

### Store Listing

Store listing copy lives in `docs/chrome-web-store-listing.md`. It is not executable configuration, but it makes Chrome Web Store submission requirements explicit.

### Release Command

Add `npm run release:package` to run validation, build the Web app, build the extension, and create a zip under `.release/`.

## Non-Goals

- No paid production infrastructure setup.
- No Chrome Web Store upload automation.
- No domain-specific canonical URL until a final deployment domain is chosen.

## Validation

Run:

```bash
npm run validate
npm run release:package
```
