## ADDED Requirements

### Requirement: Web release metadata

The Web release SHALL include static metadata and discovery assets.

#### Scenario: Static assets exist
- **GIVEN** the Web app is built
- **WHEN** the release output is inspected
- **THEN** it includes a web manifest, favicon, robots file, privacy page, and terms page

### Requirement: Extension release icons

The extension release SHALL include icon assets referenced by the Manifest V3 manifest.

#### Scenario: Build extension package
- **GIVEN** extension icons are generated
- **WHEN** the extension is built
- **THEN** `extension-dist/manifest.json` references existing 16, 32, 48, and 128 pixel PNG icons

### Requirement: Store listing draft

The project SHALL maintain Chrome Web Store listing draft copy for human review.

#### Scenario: Prepare store submission
- **GIVEN** a maintainer prepares Chrome Web Store submission
- **WHEN** they open project docs
- **THEN** they can find description, privacy practices, permission rationale, and testing notes

### Requirement: Release package command

The project SHALL provide a repeatable release packaging command.

#### Scenario: Package release
- **GIVEN** dependencies are installed
- **WHEN** `npm run release:package` is run
- **THEN** validation passes and a zip artifact for the extension is created under `.release/`
