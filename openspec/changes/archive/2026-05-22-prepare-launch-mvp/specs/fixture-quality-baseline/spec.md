## MODIFIED Requirements

### Requirement: Expected people checks

The fixture analysis script SHALL fail when required expected people are missing and SHALL be part of the project validation command.

#### Scenario: Missing expected person
- **GIVEN** a ready fixture declares `expected.topPeople`
- **WHEN** the analysis result does not include one of those names
- **THEN** the script exits with failure

#### Scenario: Run full validation
- **GIVEN** the project validation command is run
- **WHEN** fixture analysis fails
- **THEN** the validation command exits with failure
