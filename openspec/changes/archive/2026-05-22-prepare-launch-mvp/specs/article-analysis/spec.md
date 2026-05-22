## MODIFIED Requirements

### Requirement: AI structured mode

The system SHALL provide an explicit AI structured mode that requires user-provided provider settings and validates structured payloads before rendering.

#### Scenario: Missing API key
- **GIVEN** the user selects AI structured mode without an API key
- **WHEN** the user starts analysis
- **THEN** the system refuses analysis and explains that an API key is required

#### Scenario: Run AI analysis
- **GIVEN** the user selects AI structured mode with provider settings
- **WHEN** the user starts analysis
- **THEN** the system sends the title, source, and sentence list to the configured provider

#### Scenario: Reject invalid AI payload
- **GIVEN** the configured provider returns JSON that does not match the PeopleLens cast shape
- **WHEN** AI analysis maps the response
- **THEN** the system rejects the payload with a user-facing validation error instead of rendering partial invalid data
