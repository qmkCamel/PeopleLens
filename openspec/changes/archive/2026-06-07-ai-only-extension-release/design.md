## Design

### Product Direction

PeopleLens will expose one analysis path: AI structured analysis. This removes the product ambiguity between "fast but weak" local rules and "useful" AI output. The local heuristic implementation can remain in the repository for internal experimentation, but it is no longer a product mode or release gate.

### Web Surface

The Web app remains useful as a development/smoke surface and support page host, but it is not the launch target for this phase. The Web form should:

- Always show AI provider settings.
- Require an API key before analysis.
- Use the existing structured payload validation before rendering results.
- Keep existing results visible during a new analysis attempt.

### Chrome Extension

The extension side panel becomes the primary release surface. It should:

- Store AI provider settings locally in the extension page.
- Read the active tab only after the user clicks the analysis button.
- Send extracted or pasted article content to the configured AI provider.
- Preserve manual paste fallback for blocked or low-signal pages.
- Keep prior results visible during extraction or analysis failures.

### Release Validation

`npm run validate` remains the standard local gate, but it should reflect the launch target:

- OpenSpec validation.
- Web build to keep the dev/support surface healthy.
- Extension typecheck and build.
- Release asset inspection for support assets and extension package inputs.

Fixture analysis against the local heuristic remains available through `npm run fixtures:analyze`, but it is not a release gate while local analysis is not user-facing.
