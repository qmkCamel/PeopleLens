## ADDED Requirements

### Requirement: Side panel shell

The Chrome Extension MVP SHALL provide a Manifest V3 side panel launched by the extension action.

#### Scenario: Open side panel
- **GIVEN** the extension is installed
- **WHEN** the user clicks the extension action
- **THEN** Chrome opens the PeopleLens side panel

### Requirement: User-triggered page extraction

The extension SHALL extract current page text only after the user explicitly requests analysis.

#### Scenario: Analyze active page
- **GIVEN** the side panel is open on a content page
- **WHEN** the user clicks analyze current page
- **THEN** the extension extracts title, URL, and readable text from the active tab and analyzes it locally

### Requirement: Manual fallback

The extension SHALL provide manual paste fallback when active-page extraction is unavailable or insufficient.

#### Scenario: Extraction too short
- **GIVEN** active-page extraction returns less than the minimum useful article length
- **WHEN** the user requests analysis
- **THEN** the side panel keeps the extracted metadata and asks the user to paste article text manually

### Requirement: Minimal permissions

The extension SHALL avoid broad host permissions in the MVP.

#### Scenario: Inspect manifest permissions
- **GIVEN** the extension manifest is built
- **WHEN** permissions are reviewed
- **THEN** the manifest uses `activeTab`, `scripting`, `storage`, and `sidePanel` without broad host permissions
