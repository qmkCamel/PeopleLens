## Overview

The launch-readiness work keeps the current Web MVP architecture and adds narrowly scoped capabilities around it. The Web app remains the primary product surface. The extension is a side-panel prototype that reuses the existing local analysis core rather than introducing a separate backend.

## Decisions

### Memory Library

Use the existing `localStorage` memory map for this iteration. A new UI panel reads `getMemoryEntries()` from `memoryService`, filters by search text, and exposes JSON export. IndexedDB is still a future migration, not a launch blocker for MVP trial use.

### AI Validation

Add a small hand-written validator instead of adding Zod. The payload shape is simple and keeping validation local avoids expanding runtime dependencies. Validation rejects missing fields, invalid confidence values, and references without usable evidence IDs.

### Extension Build

Use esbuild for extension bundling. Vite remains the Web app build. The extension build copies static manifest/service worker/sidebar HTML into `extension-dist/` and bundles the side panel React entry with existing analysis modules.

### Page Extraction

The side panel uses `chrome.scripting.executeScript` against the active tab after a user clicks the analysis button. The injected function removes obvious chrome/noise elements and scores article/main/body text containers by paragraph density. If extraction is too short, the side panel asks for manual paste.

## Non-Goals

- No account system.
- No cloud sync.
- No background page scanning.
- No external biography enrichment.
- No automatic modification/highlighting of the current page.
- No complex graph visualization.

## Validation

Run:

```bash
npm run openspec:validate
npm run fixtures:analyze
npm run build
npm run build:extension
```

The `npm run validate` script runs the full set.
