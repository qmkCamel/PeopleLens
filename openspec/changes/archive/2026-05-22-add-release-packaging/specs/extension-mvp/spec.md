## MODIFIED Requirements

### Requirement: Side panel shell

The Chrome Extension MVP SHALL provide a Manifest V3 side panel launched by the extension action and include release icon assets.

#### Scenario: Open side panel
- **GIVEN** the extension is installed
- **WHEN** the user clicks the extension action
- **THEN** Chrome opens the PeopleLens side panel

#### Scenario: Manifest icons
- **GIVEN** the extension package is built
- **WHEN** the manifest is inspected
- **THEN** it references packaged icons for 16, 32, 48, and 128 pixel sizes
