# Atlas V1 Roadmap

Target release: October 18, 2026.

Atlas V1 is a focused, memory-first bilingual GED comparison-learning release. The broader product vision remains valid, but approximately 150 concept pages, mobile apps, Atlas Studio, and a teacher dashboard are outside this V1 deadline.

Current checkpoint (October 23, 2026 UTC): the novice counting foundation is
published for testing on `sprint-18-small-number-foundation`. It adds a prerequisite
route before comparison; it does not expand V1 into a complete early-childhood
curriculum. Audio and saved-answer issues prompted another regression review.
See `../curriculum/reviews/sprint18_runtime_regression.md`. Earlier production
sign-off below applies to earlier releases only.

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

The current local suite passes 136 tests plus curriculum, knowledge, research,
memory, and release audits. Production deployment and smoke verification remain
required for each release commit. Automated checks do not prove novice comprehension.

### Earlier release baseline — previously signed off

- Deterministic release metadata and route/link/import/hash auditing.
- Release notes, known limitations, go/no-go gates, and rollback instructions.
- Production Chromium and physical iPhone/Safari sign-off completed. Unavailable Firefox desktop and Chrome/Android checks were explicitly accepted as release risks.

### Counting checkpoint — branch published; release pending

- Short teaching route: 1–3, zero, 4–6, 7–8, 9–10, 11–12, 13–15, 16–17, 18–20.
- Original full counting lessons and saved attempts remain intact as optional reviews.
- Optional return and spoken-number practice remain separately saved.
- Short counting lessons use bundled English/Spanish synthetic audio. Voice
  quality and physical iPhone playback remain unverified. Later lessons still
  depend on device speech; approved human narration is not included.
- The initial audio generator's phoneme conversion was corrected. Current
  pronunciation flags and 56 narrow-layout checks are recorded in
  `../curriculum/reviews/sprint18_audio_layout_review.md`; this is not voice approval.
- Route tests cover optional-review skipping, stopping before pairing, readiness,
  lesson switching, reopening, and preservation of previous full-lesson completion.
- No new features are needed to reach the next review checkpoint.

Remaining release work, in order:

1. Regression fixes are published to the existing test branch. GitHub CLI access
   now works; publication does not imply a merge or production deployment.
2. Smoke-test the published counting route, mobile layouts, interim voice,
   refresh/reopen, language switching, and completion on the actual build.
3. Review Spanish independently and revise specific findings.
4. Recheck Lessons 001–004 against the newer novice-language standard, including
   prerequisite explanations and the bridge from everyday language to technical terms.
5. Merge/deploy only within the authorized scope and verify the exact production commit.

Standalone learning effectiveness remains unverified without first-time learner
observation. Do not market code-review success as proof that children can learn
independently. The lesson picker has accumulated many optional practice entries;
review its usability during smoke testing before adding more curriculum.

## V1 acceptance criteria

- All four lessons can be completed in English and Spanish.
- Switching language preserves the current lesson, screen, answers, attempt, and accessibility preferences.
- Every learner-facing curriculum string has a Spanish equivalent.
- Refresh, reopen, lesson switching, completion, restart, and learning history behave correctly.
- Memory assets build successfully from the same curriculum source.
- Automated tests and curriculum validation pass with zero failures.
- GitHub Pages deploys successfully and the production smoke test passes.
