## Why

PeopleLens is functionally ready for MVP/Beta use, but public release still needs the packaging assets and policy pages expected by static hosting and Chrome Extension distribution. Without these, the Web app lacks basic SEO/social metadata and the extension lacks store-ready icons and listing material.

## What Changes

- Add static release assets for the Web app: manifest, robots, favicon, privacy page, and terms page.
- Add extension icons and store listing draft material.
- Add release scripts for a repeatable Web and Extension package build.
- Update documentation and specs to capture release packaging requirements.

## Capabilities

### New Capabilities
- `release-packaging`: Web/Extension release assets, policy pages, and packaging commands.

### Modified Capabilities
- `extension-mvp`: extension manifest includes release icons and store preparation material.

## Impact

- Affected files: `public/`, `extension/`, `docs/`, `scripts/`, `package.json`, `index.html`.
- Build impact: `npm run validate` will include release packaging checks.
- Product impact: no behavior change to article analysis or memory.
