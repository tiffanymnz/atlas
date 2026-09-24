# Sprint 10 Research Decision

Date: September 24, 2026.

## Decision

The next Atlas prototype cluster is:

1. `inequalities.at_least`
2. `inequalities.no_more_than`
3. explicit inclusive-minimum versus inclusive-maximum transfer

Lessons 010–011 remain prototypes with `adult_review_required`. Earlier prototype review gates remain open independently.

## Why this cluster is next

- These concepts form the remaining paired language cluster in the ten-concept Math P0 graph.
- Both failures are caused by unreliable keyword reading: `least` can trigger smaller values and `more` can trigger larger values.
- The existing number-line model can expose three separate decisions: the boundary, whether equality is included, and the allowed direction.
- The pair supports practical GED contexts including eligibility, budgets, capacity, hours, and limits without changing the learner architecture.

## Instructional decision

`At least` appears first as a minimum that includes the exact boundary. The learner tests the boundary and nearby values before seeing `≥`.

`No more than` appears second as a maximum that includes the exact boundary. The learner again tests values before seeing `≤`.

The symbols compress reasoning already established in context and on the number line. They are not taught through an alligator-mouth mnemonic or by isolating one word from each phrase.

## Evidence boundary

Precise language, multiple representations, worked examples, and number-line use are supported instructional practices. Direct evidence for this exact sequence and wording with adult GED learners remains limited.

Automated tests can verify the declared instructional contract, bilingual parity, persistence, generated assets, diagnostic errors, and representation consistency. They cannot establish that unfamiliar learners interpret the phrases or symbols without coaching.

## Release gate

Before production approval:

- observe first-time adult learners completing both lessons without coaching;
- verify that the exact boundary is included in both phrases;
- verify that learners reason from minimum or maximum rather than from isolated keywords;
- verify that the number-line arrows are interpreted as sets of allowed values;
- review `por lo menos`, `como mínimo`, `no más de`, and `como máximo` with target Spanish-speaking learners;
- revise repeated ambiguity and rerun all repository and production gates.
