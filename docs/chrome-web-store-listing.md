# Chrome Web Store Listing Draft

## Extension Name

PeopleLens

## Short Description

Generate an article-grounded cast list of people, evidence, relationships, and local reading memory.

## Detailed Description

PeopleLens helps readers understand people-heavy articles without leaving the page.

Use the side panel to analyze the current article after you explicitly click the analyze button. PeopleLens sends the article title, source URL, and extracted text to the AI provider you configure, then renders likely people, evidence sentences, possible relationships, and local reading memory.

Privacy posture:

- The extension reads the active tab only after you click analyze.
- AI analysis sends article content to the configured provider.
- API Keys and local memory stay in browser storage.
- No background page scanning.
- No account required.

## Category

Productivity

## Language

Chinese and English article support. Primary UI language is Chinese.

## Permissions Rationale

- `activeTab`: allows PeopleLens to read the current tab only after the user invokes the extension.
- `scripting`: injects a temporary extraction function into the active page after user action.
- `sidePanel`: displays the PeopleLens analysis UI in Chrome's side panel.
- `storage`: reserved for extension-side settings and local state.
- `https://api.deepseek.com/*`: allows AI analysis requests when users configure DeepSeek.
- `https://api.openai.com/*`: allows AI analysis requests when users configure OpenAI.

The extension does not request broad page-reading host permissions such as `<all_urls>`.

## Privacy Practices

PeopleLens does not sell data and does not require an account. Article text is sent to the AI provider configured by the user only after the user starts analysis. API Keys and local memory are stored locally in the browser or extension storage.

## Screenshots to Prepare

- Side panel before analysis.
- Side panel AI settings.
- Side panel after analyzing an article with person cards.
- Local memory/search state in the Web app.
- Privacy controls or local memory export state.

## Reviewer Notes

To test:

1. Build with `npm run build:extension`.
2. Load `extension-dist/` as an unpacked extension.
3. Open a readable article page.
4. Open the side panel and enter a DeepSeek or OpenAI API Key.
5. Click "分析当前页面".
6. Confirm person cards render.
7. Try a blocked or sparse page and confirm manual paste fallback appears.

## Support URL

Use the repository issue tracker until a dedicated support page exists.
