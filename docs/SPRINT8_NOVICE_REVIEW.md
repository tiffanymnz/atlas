# Sprint 8 novice review

## Decision

Lessons 005–007 are working prototypes, not production-approved curriculum. They remain marked `adult_review_required` until first-time adult learners can explain and transfer each concept without coaching outside the lesson.

## Novice-first standard

Evaluate from the learner's stated prerequisites only. Familiarity with a term, symbol, shortcut, or notation must not be silently supplied by the reviewer. A correct screen is not sufficient if a learner could only follow it because they had already encountered the material.

The implementation review found and removed three hidden assumptions:

- Division no longer tests a decimal share before the fraction cluster establishes non-whole quantities.
- Fraction transfer explains five fourths in words instead of requiring prior knowledge of mixed-number notation.
- Percent no longer relies on decimal notation or decimal-moving distractors that the lesson has not introduced.

## Automated gate

For every prototype in English and Spanish, the suite verifies:

- minimal, explicit assumed knowledge and observable success criteria;
- plain-language definitions before specialized vocabulary is relied upon;
- a visual-to-language-to-symbol sequence;
- a memory anchor with at least four reconstruction steps and a stated limit;
- layered hints and explanatory correct feedback;
- wrong answers tied to specific misconceptions;
- separate recall and transfer tasks;
- persistence, completion, attempt history, recovery, accessibility, and generated-memory compatibility.

## Human observation gate

Use adults who have not recently studied the target lesson. Do not explain vocabulary, point to the correct choice, or reinterpret the prompt during the attempt. After each lesson, ask the learner to:

1. explain the idea in their own words without repeating the displayed hook;
2. rebuild an example with different numbers;
3. explain why one plausible wrong answer is wrong;
4. solve a new-context transfer item;
5. name anything that felt undefined, abrupt, or dependent on prior schooling.

Record hesitation and reasoning, not only answer accuracy. A lesson passes only when the learner can explain both what the model means and when it does not apply. Revise when two learners expose the same ambiguity, or immediately when a screen requires undeclared prior knowledge.

## Remaining questions

- Does the hundred-grid stay legible and meaningful on a small phone rather than looking like decoration?
- Does “rate” help learners connect percent situations, or add vocabulary before it adds meaning?
- Is the jump from fraction-part meaning to equivalent fractions sufficient for the first percent calculations?
- Can learners distinguish the original whole from the changed amount in percent-change transfer?
- Do the Spanish terms match how target learners naturally discuss the ideas?

Automated completion must not close these questions. Production approval requires documented learner observation and adult curriculum review.
