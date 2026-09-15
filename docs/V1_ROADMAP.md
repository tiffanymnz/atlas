# Atlas V1 Roadmap

Target release: October 18, 2026.

Atlas V1 is a focused, memory-first bilingual GED comparison-learning release. The broader product vision remains valid, but approximately 150 concept pages, mobile apps, Atlas Studio, and a teacher dashboard are outside this V1 deadline.

## Release scope

1. A GitHub Pages learner that works in English and Spanish with equal access to every current lesson.
2. Lessons 001–004 covering `comparison.more`, `comparison.fewer`, `difference`, and `compare_unknown`.
3. A consistent lesson sequence: misconception, visual model, explanation, guided practice, independent practice, recall, and transfer.
4. Persistent per-lesson attempts, completion, accessibility settings, language choice, and cumulative learning history.
5. Memory assets generated from the same structured curriculum: flashcards, a worksheet, and a quiz.
6. Automated curriculum, persistence, analytics, bilingual-parity, and static-path checks.

## Sprint status

### Sprint 3 — Bilingual memory-first lessons — Complete

- Persistent English/Spanish switching.
- Complete Spanish parity for Lessons 001–004 and learner interface text.
- Memory hooks, independent practice, recall, and transfer fields validated for every lesson.

### Sprint 4 — Memory assets — Complete

- Generate bilingual flashcards, worksheet, and quiz from lesson JSON.
- Keep generated outputs reproducible and traceable to lesson IDs.

### Sprint 5 — Release hardening — Complete

- Keyboard, screen-reader, mobile, and cross-browser checks.
- Recovery testing for malformed and versioned saved data.
- Full end-to-end completion and restart checks in both languages.

The automated release gate now covers 33 behavior, accessibility, persistence, bilingual, curriculum, asset, route, reference, and static-path checks. Production deployment and smoke verification remain required for each release commit.

### V1 RC1 — In validation

- Deterministic release metadata and route/link/import/hash auditing.
- Release notes, known limitations, go/no-go gates, and rollback instructions.
- Final production and manual browser/device sign-off before the `v1.0.0` tag.

## V1 acceptance criteria

- All four lessons can be completed in English and Spanish.
- Switching language preserves the current lesson, screen, answers, attempt, and accessibility preferences.
- Every learner-facing curriculum string has a Spanish equivalent.
- Refresh, reopen, lesson switching, completion, restart, and learning history behave correctly.
- Memory assets build successfully from the same curriculum source.
- Automated tests and curriculum validation pass with zero failures.
- GitHub Pages deploys successfully and the production smoke test passes.
