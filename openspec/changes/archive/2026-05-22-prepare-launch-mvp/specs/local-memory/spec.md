## MODIFIED Requirements

### Requirement: Saved people

The system SHALL allow users to save and unsave people locally and inspect saved people in a memory library.

#### Scenario: Toggle saved person
- **GIVEN** a person card is displayed
- **WHEN** the user toggles the saved state
- **THEN** the system persists the updated saved state in browser storage

#### Scenario: View saved people
- **GIVEN** local memory contains saved people
- **WHEN** the memory library is displayed
- **THEN** saved people are shown with encounter count and recent source metadata

### Requirement: Clear local data

The system SHALL allow users to clear and export local PeopleLens memory.

#### Scenario: Clear memory
- **GIVEN** local memory exists
- **WHEN** the user clears local memory
- **THEN** the system removes PeopleLens memory from browser storage

#### Scenario: Export memory
- **GIVEN** local memory exists
- **WHEN** the user exports memory
- **THEN** the system downloads a JSON file containing the local PeopleLens memory map

## ADDED Requirements

### Requirement: Memory search

The system SHALL support local search across stored people and source article titles.

#### Scenario: Search memory
- **GIVEN** local memory contains people and source metadata
- **WHEN** the user enters a memory search query
- **THEN** the memory library shows matching people whose names or source titles include the query
