# Sprint 9 Research Decision

Date: September 22, 2026.

## Decision

The next Atlas prototype cluster is:

1. `geometry.area`
2. `geometry.perimeter`
3. explicit area-versus-perimeter transfer

Lessons 008–009 remain prototypes with `adult_review_required`. Sprint 8's separate novice-observation gate also remains open; starting this cluster does not promote Lessons 005–007.

## Why this cluster is next

- Both concepts have evidence-level B research cards, while the remaining algebra and inequality candidates are evidence level C.
- Area and perimeter share a visual context but answer different questions: coverage inside versus distance around.
- Teaching them separately before contrasting them avoids making the distinction depend on memorized keywords.
- The pair supports a strong transfer check: equal areas can have different perimeters.
- The existing JSON lesson engine can represent both concepts without redesign or migration.

## Instructional decision

Area appears first as coverage by equal square units. Multiplication is introduced as an efficient count of a rectangular array, not as an unexplained formula.

Perimeter appears second as one complete traced path around a boundary. Addition is introduced from the actual side sequence before the rectangle shortcut.

The concepts are contrasted only after each has its own meaning, unit, model, reconstruction steps, and misuse boundary.

## Evidence boundary

The GED Mathematical Reasoning assessment includes area and perimeter. The IES mathematics intervention guidance supports systematic instruction, precise language, concrete and semi-concrete representations, and deliberate word-problem instruction. Direct evidence for this exact sequence with adult GED learners remains limited.

Automated tests can verify the declared instructional contract, bilingual parity, persistence, generated assets, and transfer structure. They cannot prove that unfamiliar learners distinguish coverage from boundary distance without coaching.

## Release gate

Before production approval:

- observe first-time adult learners completing both lessons without coaching;
- verify that square units versus linear units are understood rather than repeated;
- verify that the perimeter visual reads as a path instead of a rectangle-area prompt;
- verify that learners can explain why equal areas may have different perimeters;
- review Spanish terminology with target learners;
- keep all failures and hesitations tied to a specific screen and misconception;
- rerun the complete repository and production gates after corrections.
