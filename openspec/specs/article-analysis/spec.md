# article-analysis Specification

## Purpose

Turn pasted article text into an article-grounded cast list of people, evidence, uncertainty, and relationships.
## Requirements
### Requirement: User-triggered analysis

The system SHALL analyze article text only after the user explicitly requests analysis.

#### Scenario: Analyze pasted article
- **GIVEN** the user has pasted at least 40 characters of article text
- **WHEN** the user starts analysis
- **THEN** the system produces an analysis result for that article

#### Scenario: Reject short article text
- **GIVEN** the article text is shorter than 40 characters
- **WHEN** the user starts analysis
- **THEN** the system refuses analysis and shows a user-facing error

### Requirement: AI structured mode

The system SHALL provide AI structured analysis as the only user-facing analysis path, requiring user-provided provider settings and validating structured payloads before rendering.

#### Scenario: Missing API key
- **GIVEN** the user has not provided an API key
- **WHEN** the user starts analysis
- **THEN** the system refuses analysis and explains that an API key is required

#### Scenario: Run AI analysis
- **GIVEN** the user has provided provider settings
- **WHEN** the user starts analysis
- **THEN** the system sends the title, source, and sentence list to the configured provider

#### Scenario: Reject invalid AI payload
- **GIVEN** the configured provider returns JSON that does not match the PeopleLens cast shape
- **WHEN** AI analysis maps the response
- **THEN** the system rejects the payload with a user-facing validation error instead of rendering partial invalid data

### Requirement: Person cards

The system SHALL present extracted people as article-grounded person cards.

#### Scenario: Show person evidence
- **GIVEN** analysis identifies a person
- **WHEN** the result is displayed
- **THEN** the person card includes name, identity or identity uncertainty, article role, mention count, confidence, and evidence sentences

### Requirement: Relationship summaries

The system SHALL summarize possible person relationships conservatively using article evidence.

#### Scenario: Relationship evidence exists
- **GIVEN** multiple extracted people appear in the same evidence sentence
- **WHEN** relationship extraction runs
- **THEN** the system may produce a relationship summary linked to that evidence sentence

