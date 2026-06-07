## MODIFIED Requirements

### Requirement: User-triggered page extraction

The extension SHALL extract current page text and run AI analysis only after the user explicitly requests analysis.

#### Scenario: Analyze active page
- **GIVEN** the side panel is open on a content page and AI provider settings are configured
- **WHEN** the user clicks analyze current page
- **THEN** the extension extracts title, URL, and readable text from the active tab and analyzes it with the configured AI provider

#### Scenario: Missing API key
- **GIVEN** the side panel is open without an API key
- **WHEN** the user requests active-page or pasted-text analysis
- **THEN** the extension refuses analysis and keeps existing results visible

### Requirement: Manual fallback

The extension SHALL provide manual paste fallback when active-page extraction is unavailable or insufficient.

#### Scenario: Extraction too short
- **GIVEN** active-page extraction returns less than the minimum useful article length
- **WHEN** the user requests analysis
- **THEN** the side panel keeps the extracted metadata and asks the user to paste article text manually

#### Scenario: Analyze pasted text
- **GIVEN** the user has pasted at least the minimum useful article length and configured AI provider settings
- **WHEN** the user requests pasted-text analysis
- **THEN** the extension analyzes the pasted article with the configured AI provider
