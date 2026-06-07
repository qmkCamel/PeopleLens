## MODIFIED Requirements

### Requirement: Release package command

The project SHALL provide a repeatable Extension-first release packaging command.

#### Scenario: Package release
- **GIVEN** dependencies are installed
- **WHEN** `npm run release:package` is run
- **THEN** validation passes and a zip artifact for the Chrome Extension is created under `.release/`

### Requirement: Web release metadata

The Web build SHALL include support metadata and static policy assets, but Web deployment SHALL NOT be required for the current launch phase.

#### Scenario: Support assets exist
- **GIVEN** the Web app is built during validation
- **WHEN** the release output is inspected
- **THEN** it includes a web manifest, favicon, robots file, privacy page, and terms page for support or future hosting
