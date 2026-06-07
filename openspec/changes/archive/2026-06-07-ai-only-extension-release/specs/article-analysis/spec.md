## REMOVED Requirements

### Requirement: Local heuristic mode

The system SHALL provide a local analysis mode that does not upload article text.

#### Scenario: Run local analysis
- **GIVEN** the user selects local analysis mode
- **WHEN** the user starts analysis
- **THEN** the system extracts candidate people, evidence sentences, and relationships in the browser

## MODIFIED Requirements

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
