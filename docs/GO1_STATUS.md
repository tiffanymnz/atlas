# GO1 Working Engine Status

Included: GitHub Pages root index, learner app, theme system, component SDK starter, lesson engine, analytics engine, recommendation engine, Lesson 001/002 JSON, knowledge graph starter, QA validator.

Sprint 1 complete: persistent per-lesson state, refresh/reopen restoration, lesson-switch restoration, completion status, accessibility preferences, cumulative learning history, and separation of current and prior completed attempts.

Sprint 2 scope: extend the existing comparison sequence through `difference` and `compare_unknown`, and enforce curriculum-to-knowledge-graph integrity in automated checks. Lessons 003 and 004 cover those concepts without changing the lesson-engine architecture.

Sprint 3 complete: persistent English/Spanish switching, complete bilingual parity for Lessons 001–004, and a validated memory-first sequence with misconception checks, memory hooks, guided practice, independent practice, recall, transfer, and reflection. Stable screen IDs preserve existing learner progress as the curriculum expands.

Sprint 4 complete: deterministic English/Spanish flashcards, printable worksheets with answer keys, and quizzes are generated from the lesson curriculum. A structured data file and SHA-256 manifest trace every output to all four lesson IDs, and automated checks fail when generated assets are stale.
