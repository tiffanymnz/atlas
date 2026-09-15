# Atlas V1 Release Checklist

Target release: October 18, 2026.

## Automated gate

Run `npm test`. A release candidate must pass:

- all Node behavior and acceptance tests with zero failures;
- lesson and knowledge-graph validation;
- generated-memory-asset freshness;
- English and Spanish completion/restart flows for Lessons 001–004;
- malformed, legacy, and future-version saved-data recovery;
- keyboard, focus, semantic progress, live-status, motion, contrast, mobile, and static-path contracts.
- release metadata, required routes, internal references, module imports, and generated-output hashes.

## Browser coverage

| Target | Required check |
| --- | --- |
| Chromium | Production keyboard, persistence, bilingual, completion, restart, and responsive smoke test |
| Firefox | Standards-based semantic and responsive contract; manual release check when available |
| Safari/WebKit | Standards-based semantic and responsive contract; manual release check when available |

The learner uses standard HTML controls, ES modules, CSS media queries, local storage, and DOM APIs. It does not depend on a browser-specific framework or build output.

## Production gate

- GitHub Pages deploys from the intended `main` commit.
- The learner and memory-practice hub return successfully.
- English/Spanish switching preserves lesson position and attempt state.
- Keyboard focus advances to changed lesson content and returns after the learning-summary dialog closes.
- A lesson can complete, restart, and retain the prior completed attempt.
- The viewport has no horizontal overflow at mobile width.
- No console errors appear during the smoke flow.
