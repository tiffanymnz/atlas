# Atlas GO1 V1

Current release: `1.0.0`. Run the complete gate with `npm test` or the deterministic route/link/hash audit alone with `npm run audit:release`.

Fixes:
- Removed duplicate recommendation text from the completion screen.
- Review visual gap now works and returns to the visual gap screen.
- Next lesson now works and loads the next lesson.
- Completion screen has three distinct actions only: Review visual gap, Next lesson, Restart lesson.
- Retains JSON-driven lesson engine structure.

Upload the full folder structure to GitHub Pages.

## Sprint 1

- Per-lesson screen, answer, hint, feedback, and current-attempt state persist in local storage.
- The last selected lesson and accessibility preferences persist across refreshes and reopen.
- Completion status and cumulative completed-attempt history persist.
- Restarting a lesson archives the completed attempt before creating a separate fresh attempt.
- Correct-answer feedback restores with a Continue action, so refreshing cannot strand the learner.
- Malformed saved records are repaired safely, and the learning summary reports cumulative completed-attempt metrics.

Run the checks with `npm test`.

## Sprint 2

- Lessons 003 and 004 extend the comparison sequence through `difference` and `compare_unknown`.
- Automated checks enforce curriculum-to-knowledge-graph integrity.

## Sprint 3

- Lessons 001–004 and the learner interface have complete English/Spanish parity.
- Every lesson follows the validated memory-first sequence: misconception, visual model, explanation, memory hook, guided practice, independent practice, recall, transfer, and reflection.
- Stable screen IDs migrate existing numeric progress safely when curriculum stages are inserted.

## Sprint 4

- `npm run build:memory` generates bilingual flashcards, worksheets, quizzes, structured memory data, and a traceability manifest under `assets/memory/`.
- `npm run check:memory` verifies that committed outputs exactly match the current lesson curriculum.

## Sprint 5

- Keyboard learners get skip navigation, arrow-key choice navigation, visible focus, semantic progress, and contained dialog focus.
- Screen-reader status, visual-model labels, preference states, and English/Spanish control labels stay synchronized.
- Mobile, reduced-motion, and forced-color safeguards are part of the shared component CSS.
- Saved learning data recovers valid progress from malformed, legacy, and future-version containers.
- Release acceptance tests complete and restart all four lessons in English and Spanish.

## Sprint 6

- The approved ten-concept Math P0 starter graph is stored under `curriculum/knowledge-graph/` without changing the V1 learner architecture.
- A crosswalk separates implemented Atlas lesson concepts from planned concepts, so future curriculum is not exposed as finished work.
- `npm run check:knowledge` validates node uniqueness, edge references, bilingual hooks, diagnostic references, adaptive rules, and crosswalk coverage.
- Post-V1 sequencing is documented in `docs/POST_V1_ROADMAP.md`.
- Meaning-first memory anchors and future research-card requirements are defined in `docs/ATLAS_LEARNING_STANDARD.md`.

## Sprint 7

- Eight machine-readable research cards cover every planned Math P0 starter-graph concept.
- Each card records meaning, purpose, reconstruction steps, misuse boundaries, bilingual notes, recall, transfer, evidence, adult-evidence limits, and unresolved questions.
- `npm run check:research` prevents missing concepts, broken sources, unsupported approval, or drift from the knowledge-graph crosswalk.
- The next prototype cluster is shared-equally division → fraction meaning → percent basics; it is not production-approved until the adult-facing review gate closes.

## Sprint 8

- Lessons 005–007 prototype shared-equally division, numerator/denominator meaning, and percent as a per-hundred relationship in the existing JSON lesson engine.
- Reusable equal-group, fraction-bar, and hundred-grid models connect concrete meaning to language and symbols in English and Spanish.
- A novice-comprehension gate checks declared prerequisites, plain-language definitions, reconstructable memory anchors, boundaries, layered hints, diagnostic errors, recall, transfer, and bilingual parity.
- The release suite now exercises all seven lessons while preserving V1 persistence, history, recovery, accessibility, and generated-memory contracts.
- These three lessons remain explicitly marked `adult_review_required`; automated checks cannot substitute for observation with first-time adult learners.

## Sprint 9

- Lessons 008–009 prototype area as interior coverage and perimeter as boundary distance without changing the JSON lesson architecture.
- Reusable area-grid and perimeter-path models make square units, linear units, arrays, and boundary tracing explicit in English and Spanish.
- Transfer work tests the difficult distinction directly: rectangles can have equal area and different perimeters.
- The release suite exercises all nine lessons while preserving persistence, history, recovery, accessibility, and generated-memory contracts.
- The Sprint 8 and Sprint 9 prototype clusters retain separate `adult_review_required` gates.

## Sprint 10

- Lessons 010–011 prototype `at least` as an included minimum and `no more than` as an included maximum.
- A reusable accessible number-line model connects closed boundary points to direction and inequality symbols.
- Examples require boundary testing before symbol selection, preventing unreliable keyword shortcuts.
- English and Spanish lessons, generated memory practice, persistence, accessibility, and cumulative history share the existing architecture.
- The inequality cluster remains `adult_review_required`; automated checks do not prove comprehension by unfamiliar learners.

## Sprint 11

- A machine-readable internal novice audit covers Lessons 005–011 without treating automation as learner evidence.
- Lesson 007 no longer assumes unexplained fraction simplification or fraction multiplication when teaching percent calculations.
- Common percentages are reconstructed from equal shares of the named whole in English and Spanish.
- Every prototype retains `adult_review_required`; three uncoached adult-observation clusters remain open.

## Sprint 12

- A browser-based observation kit turns the three pending human-review protocols into structured, exportable records.
- Eligibility, consent, uncoached conduct, reasoning, transfer, hesitations, interventions, and blocking issues are required evidence fields.
- Two complete sessions from distinct participants are required per cluster before evidence is ready for human curriculum review.
- The tool stores drafts locally, prohibits personal identifiers, and never grants curriculum approval or changes `adult_review_required`.

## Novice prerequisite pass

The [internal novice hardening record](docs/NOVICE_PREREQUISITE_HARDENING.md) identifies and repairs several hidden starting assumptions in Lessons 005 and 008–011 in English and Spanish. Lesson completion remains a progress record; the next-lesson shortcut now asks for correct first responses without hints on independent practice, recall, and transfer, and advances only within a concept sequence. Real first-exposure observations remain required before curriculum approval.

The current first option is the start of a **comparison unit**, not a zero-knowledge math course. Its counting and one-to-one matching prerequisites are stated on the opening screen. The [foundation pathway](docs/FOUNDATION_PATHWAY.md) lists the earlier concepts that still need lessons and observation before Atlas can claim a beginner starting point.
