# Atlas Post-V1 Roadmap

Atlas V1 is stable. Post-V1 work expands the curriculum model before adding more application surfaces. The existing learner, state model, memory generator, and GitHub Pages deployment remain intact.

## Sprint 6 — Core knowledge foundation

Status: in progress.

- Import the approved ten-concept Math P0 starter graph into the repository.
- Preserve the source node identifiers for concepts, language traps, misconceptions, memory hooks, visuals, standards, assessments, edges, and adaptive rules.
- Crosswalk source concepts to Atlas's current semantic concept and lesson identifiers.
- Mark future concepts as planned instead of presenting them as implemented lessons.
- Validate node uniqueness, edge references, bilingual hooks, assessments, adaptive rules, and crosswalk coverage in `npm test`.

This sprint is data foundation only. It does not add unreviewed lessons or change V1 learner behavior.

## Sprint 7 — Research cards and lesson selection

Status: research package complete; adult-facing prototype review required before production lessons.

- Apply the meaning-first requirements in `ATLAS_LEARNING_STANDARD.md`.
- Complete evidence cards for the next Math P0 concepts.
- Keep evidence level, unresolved decisions, bilingual terminology, misconception targets, and visual choices explicit.
- Select the next lesson cluster only after the research gate passes.
- Do not treat a plausible teaching idea as an Atlas default without evidence review or learner testing.

Initial candidates are percent basics, numerator/denominator, one-step equations, area versus perimeter, inequality language, and shared-equally division. Candidate order is not a release commitment.

The recorded prototype decision is shared-equally division → fraction meaning → percent basics. See `SPRINT7_RESEARCH_DECISION.md` and the machine-readable cards under `curriculum/research/`.

## Sprint 8 — First post-V1 lesson cluster

Status: prototype implementation complete; adult learner review still required before production approval.

- Build the selected lesson cluster using the existing JSON-driven lesson architecture.
- Generate bilingual memory assets from the same curriculum source.
- Preserve V1 persistence, accessibility, recovery, and cumulative-history contracts.
- Add new behavior to the automated gate before publishing.

Lessons 005–007 implement the selected division → fraction meaning → percent basics cluster in English and Spanish. The automated novice gate and full V1 regression suite pass, but this is evidence that the implementation satisfies its declared contracts—not proof that an unfamiliar learner understands it. Use `SPRINT8_NOVICE_REVIEW.md` for the remaining observation gate.

## Sprint 9 — Area and perimeter meaning

Status: prototype implementation complete; adult learner review required before production approval.

- Teach area first as coverage with equal square units.
- Teach perimeter second as a complete boundary path measured in linear units.
- Contrast the concepts only after each meaning and unit is established independently.
- Preserve the current learner architecture, persistence model, bilingual overlays, generated memory assets, and release gates.
- Keep Sprint 8's learner-review gate open independently.

See `SPRINT9_RESEARCH_DECISION.md` and `SPRINT9_NOVICE_REVIEW.md`.

## Sprint 10 — Inclusive inequality language

Status: prototype implementation complete; adult learner review required before production approval.

- Teach `at least` first as an included minimum, then connect the boundary test to a closed point, greater values, and `≥`.
- Teach `no more than` second as an included maximum, then connect the boundary test to a closed point, smaller values, and `≤`.
- Require learners to test the exact boundary and nearby values instead of choosing a symbol from the words `least` or `more`.
- Preserve the learner architecture, browser persistence, bilingual overlays, generated memory assets, and release gates.

See `SPRINT10_RESEARCH_DECISION.md` and `SPRINT10_NOVICE_REVIEW.md`.

## Deferred

The Core 100 remains the graph expansion target. Approximately 150 math concept pages, accounts, cloud sync, teacher dashboards, native apps, and Atlas Studio remain outside the immediate post-V1 scope.
