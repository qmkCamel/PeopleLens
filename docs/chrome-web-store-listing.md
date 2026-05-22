# Chrome Web Store Listing Draft

## Extension Name

PeopleLens

## Short Description

Generate an article-grounded cast list of people, evidence, relationships, and local reading memory.

## Detailed Description

PeopleLens helps readers understand people-heavy articles without leaving the page.

Use the side panel to analyze the current article after you explicitly click the analyze button. PeopleLens extracts likely people, explains why each person appears in the article, shows evidence sentences, summarizes possible relationships, and remembers people locally in your browser.

Privacy posture:

- Local analysis runs in the browser.
- The extension reads the active tab only after you click analyze.
- No background page scanning.
- No account required.
- Local memory stays in browser storage and can be cleared or exported.

## Category

Productivity

## Language

Chinese and English article support. Primary UI language is Chinese.

## Permissions Rationale

- `activeTab`: allows PeopleLens to read the current tab only after the user invokes the extension.
- `scripting`: injects a temporary extraction function into the active page after user action.
- `sidePanel`: displays the PeopleLens analysis UI in Chrome's side panel.
- `storage`: reserved for extension-side settings and local state.

The extension does not request broad host permissions.

## Privacy Practices

PeopleLens does not sell data and does not require an account. Article text analyzed in local mode is processed in the browser. If users choose AI structured analysis in the Web app, article sentences are sent to the provider configured by the user. The extension MVP currently uses local analysis only.

## Screenshots to Prepare

- Side panel before analysis.
- Side panel after analyzing an article with person cards.
- Local memory/search state in the Web app.
- Privacy controls or local memory export state.

## Reviewer Notes

To test:

1. Build with `npm run build:extension`.
2. Load `extension-dist/` as an unpacked extension.
3. Open a readable article page.
4. Open the side panel and click "分析当前页面".
5. Confirm person cards render.
6. Try a blocked or sparse page and confirm manual paste fallback appears.

## Support URL

Use the repository issue tracker until a dedicated support page exists.
