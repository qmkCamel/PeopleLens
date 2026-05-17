# local-memory Specification

## Purpose

Remember people the reader has encountered or saved in the current browser without requiring an account.

## Requirements

### Requirement: Encounter recording

The system SHALL record local encounter history for analyzed people.

#### Scenario: Record analyzed person
- **GIVEN** an analysis result contains a person
- **WHEN** analysis completes
- **THEN** the system records the person's normalized name, canonical name, encounter count, timestamps, and source article metadata in browser storage

### Requirement: Saved people

The system SHALL allow users to save and unsave people locally.

#### Scenario: Toggle saved person
- **GIVEN** a person card is displayed
- **WHEN** the user toggles the saved state
- **THEN** the system persists the updated saved state in browser storage

### Requirement: Clear local data

The system SHALL allow users to clear local PeopleLens memory.

#### Scenario: Clear memory
- **GIVEN** local memory exists
- **WHEN** the user clears local memory
- **THEN** the system removes PeopleLens memory from browser storage

### Requirement: Privacy boundary

The system SHALL keep local memory in the current browser for the MVP.

#### Scenario: Use without account
- **GIVEN** the user opens the Web MVP
- **WHEN** the user analyzes and saves people
- **THEN** the system does not require account registration or server-side profile storage
