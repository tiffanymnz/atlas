# Atlas V1 Release Notes

Version: `1.0.0`

Released: September 16, 2026, ahead of the October 18 target

Atlas V1 is a focused, memory-first English/Spanish GED comparison-learning release. Learners can complete four connected lessons, leave and return without losing their place, switch languages without losing their attempt, and review printable memory practice generated from the same curriculum source.

## Learner experience

- Lessons 001–004 cover `comparison.more`, `comparison.fewer`, `difference`, and `compare_unknown`.
- Each lesson includes misconception checks, visual models, explanations, memory hooks, guided practice, independent practice, recall, transfer, reflection, and completion.
- Dark mode, larger text, reduced motion, language, selected lesson, current screen, answers, feedback, hints, completion, and history persist locally.
- Completed attempts remain in cumulative history when a learner restarts.
- Keyboard navigation, semantic progress, live feedback, skip navigation, dialog focus, forced colors, and responsive layouts are supported.

## Memory practice

- English and Spanish flashcards, worksheets, and quizzes are generated from lesson JSON.
- Worksheets and quizzes include answer keys and print/PDF controls.
- A SHA-256 manifest ties generated outputs to the four lesson IDs and eight curriculum/translation sources.

## Quality gate

`npm test` runs the complete behavior and release gate. V1 passes 33 Node tests, lesson/knowledge-graph validation, memory-asset freshness, and the release route/reference/hash audit. Production Chromium and physical iPhone/Safari acceptance checks passed. Firefox desktop and Chrome/Android physical checks were unavailable and explicitly accepted as release risks.
