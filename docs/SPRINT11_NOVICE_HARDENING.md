# Sprint 11 novice hardening

## Decision

Sprint 11 does not approve Lessons 005–011 for production curriculum. It performs an internal first-exposure audit, corrects barriers that can be demonstrated from the lesson sequence, and preserves the separate human-observation gate.

Automated checks answer whether the implementation follows declared contracts. They do not answer whether an unfamiliar learner understands, remembers, or transfers the concept.

## Confirmed correction

Lesson 007 previously expected a learner to use fraction simplification and fraction multiplication while declaring only whole identification and equal-part interpretation as prerequisites. The lesson now reconstructs common percentages through equal shares:

- four equal 25% shares rebuild 100%;
- ten equal 10% shares rebuild 100%;
- five equal 20% shares rebuild 100%; and
- the learner divides the named whole into the corresponding number of equal shares.

The word `equivalent` is now defined before it is relied upon. English and Spanish use the same reconstruction rather than an unexplained conversion shortcut.

## Internal audit result

The machine-readable record at `curriculum/reviews/sprint11_internal_novice_audit_v1.json` covers Lessons 005–011. It records the finding, action, and residual risk for every lesson and requires all three prototype clusters to remain pending human observation.

No other blocking hidden prerequisite was demonstrated during the internal audit. That is not evidence that the other lessons are instructionally complete.

## Human observation protocol

Run at least two uncoached sessions per cluster with adults who have not recently studied the material:

1. division, fraction meaning, and percent;
2. area and perimeter; and
3. inclusive inequality language.

During each session:

- do not define terms or reinterpret prompts;
- record hesitation, requested clarification, answer changes, and reasoning;
- require an explanation in the learner's own words;
- require a new example with different numbers or context;
- ask why one plausible wrong answer fails; and
- record whether the learner reconstructs the idea without repeating the memory hook.

Revise immediately for undeclared prerequisite knowledge. Revise when two learners expose the same ambiguity, misleading visual, translation problem, or shortcut that permits a correct answer without understanding.

## Exit gate

Sprint 11 is technically complete when the full repository suite passes and every cluster has a review record. Curriculum approval remains open until the human sessions are documented. `adult_review_required` must remain unchanged until then.
