# fixture-quality-baseline Specification

## Purpose

Maintain a small, reviewable article fixture set that protects extraction quality while PeopleLens evolves.
## Requirements
### Requirement: Fixture manifest

The system SHALL maintain a structured fixture manifest for article quality baselines.

#### Scenario: Ready fixture
- **GIVEN** a fixture has `textStatus` set to `ready`
- **WHEN** the fixture analysis script runs
- **THEN** the script reads the fixture source from `textPath`

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

### Requirement: False positive checks

The fixture analysis script SHALL fail when excluded false positives appear in results.

#### Scenario: Excluded false positive appears
- **GIVEN** a ready fixture declares `expected.excludedFalsePositives`
- **WHEN** the analysis result includes one of those names
- **THEN** the script exits with failure

### Requirement: WeChat article collection

The fixture workflow SHALL support manually collected WeChat article Markdown.

#### Scenario: WeChat article cannot be automatically read
- **GIVEN** a WeChat article requires browser-mediated access
- **WHEN** the article is added to the fixture set
- **THEN** the source Markdown is collected manually and stored under `fixtures/sources/`

