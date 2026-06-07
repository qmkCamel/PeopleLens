## MODIFIED Requirements

### Requirement: Expected people checks

The fixture analysis script SHALL fail when required expected people are missing, and SHALL remain available as a local heuristic regression tool while local analysis is not user-facing.

#### Scenario: Missing expected person
- **GIVEN** a ready fixture declares `expected.topPeople`
- **WHEN** the analysis result does not include one of those names
- **THEN** the script exits with failure

#### Scenario: Run release validation
- **GIVEN** the project validation command is run for the AI-only Extension release
- **WHEN** local heuristic fixture analysis has not been run
- **THEN** release validation can still pass because local heuristic analysis is not a user-facing launch path
