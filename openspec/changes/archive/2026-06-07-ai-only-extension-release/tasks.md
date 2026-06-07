## 1. Specification

- [x] 1.1 Update article-analysis requirements for AI-only user-facing analysis.
- [x] 1.2 Update extension requirements for AI-powered side panel analysis.
- [x] 1.3 Update release packaging and fixture validation requirements for Extension-first launch.

## 2. Product Implementation

- [x] 2.1 Remove local/AI mode switching from the Web input flow.
- [x] 2.2 Route Web analysis through AI structured analysis only.
- [x] 2.3 Add AI provider settings and AI analysis to the Chrome Extension side panel.
- [x] 2.4 Preserve user-triggered extraction, manual fallback, busy state, existing results, and recoverable errors.

## 3. Release Scope

- [x] 3.1 Update validation/package scripts for Extension-first release semantics.
- [x] 3.2 Update README, launch checklist, release guide, store listing, and privacy copy.
- [x] 3.3 Update project/product/architecture docs that still describe local rules as a product capability.

## 4. Verification

- [x] 4.1 Run OpenSpec validation for the change.
- [x] 4.2 Run full project validation.
- [x] 4.3 Build and package the Chrome Extension release artifact.
- [x] 4.4 Inspect the extension package and run automated extension static checks; installed Chrome runtime automation was blocked by browser security policy and remains covered by the manual launch checklist.
