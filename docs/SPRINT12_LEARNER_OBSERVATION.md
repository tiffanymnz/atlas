# Sprint 12 learner observation kit

## Decision

Sprint 12 makes the human-evidence gate runnable and auditable. It does not claim that human validation has occurred.

The browser-based observation tool stores records only in the facilitator's browser until they are exported. It prohibits personal identifiers, requires adult eligibility and consent checks, captures uncoached conduct, and records explanations, transfer, wrong-answer reasoning, hesitations, interventions, and blocking issues.

## Evidence boundary

Two complete sessions from two distinct participants are required for each cluster:

1. division, fraction meaning, and percent;
2. area and perimeter; and
3. inclusive inequality language.

Meeting the count only makes a cluster ready for human curriculum review. The tool never outputs curriculum approval and never changes `adult_review_required`.

## Use

1. Open `apps/review/` and the learner app in separate tabs.
2. Assign a non-identifying participant code.
3. Confirm eligibility and consent before beginning.
4. Let the participant complete the cluster without coaching.
5. Record direct reasoning and behavior, not a score or a conclusion such as “understood.”
6. Save the record locally and export the JSON after the session.
7. Commit reviewed, de-identified evidence only after checking it for accidental personal information.

## Revision rules

Revise immediately when the lesson needs undeclared prerequisite knowledge, a facilitator must teach or reinterpret content, or an accessibility or translation barrier blocks the attempt. Revise when the same ambiguity, misleading visual, or shortcut appears in two independent sessions.

## Exit gate

Sprint 12 implementation is complete when the protocol, record validator, observation interface, export, summary, and automated checks pass. The curriculum gate remains open until real sessions are completed and reviewed.
