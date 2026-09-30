# Small-number foundation: release boundary

The learner picker now begins with `lesson000p.json` (1–3), with an optional
`lesson000r.json` return practice, before the preserved 0–10 and 11–20 lessons.
The return practice is suggested after the local calendar day changes, but it
can be opened sooner; its progress and attempts have a separate lesson record.
It uses a different dot arrangement, asks for groups of 3 and 2, and gives
specific feedback for too many or too few dots. This is an opportunity for
later retrieval, not evidence that a learner actually returned or retained it.
Each number from 0–20 now has an immediate quantity
check and a later check; 1–20 use a changed arrangement. The first lesson also asks
learners to construct 2 and 3. This is a teaching prototype, not evidence that
a previously unexposed child has learned numbers independently.
The 0–10 lesson now asks learners to make 4, 5, 7, 8, and 10 after seeing each
quantity, with specific too-many and too-few feedback. It remains long and needs
observation to see whether children should pause between smaller sections.

## Design basis

- Singapore MOE: move from tangible objects to pictures and symbols; distinguish
  saying numbers to 20 from reliably counting objects to 10.
  https://nel.moe.edu.sg/la/numeracy/how-can-you-do-it-/using-concrete-pictorial-abstract--cpa--approach/
  https://nel.moe.edu.sg/la/numeracy/overview/
- England, Development Matters: sustained attention to small numbers, one
  number word for each object, cardinality, and repeated varied experiences.
  https://www.gov.uk/government/publications/development-matters--2/development-matters
- New Zealand, Te Whāriki: manipulate objects and hear meaningful mathematical
  language before relying on symbols; embed numbers in purposeful activity.
  https://newzealandcurriculum.tahurangi.education.govt.nz/te-whariki-online/p-ngarau-mathematics/5637164155.p

## What is still needed before a standalone-child claim

1. Record and review natural, short narration for all directions, choices,
   feedback, controls, and number names in each claimed language. The browser
   speech fallback in the prototype is device-dependent and is not an approved
   child-facing voice. Provide a non-audio route for deaf learners.
2. Extend construction, useful contexts, and specific error recovery to more
   numbers. Verify return practice occurred on a later day and that the child
   counted an unfamiliar arrangement without coaching. Completion of the
   current 0–20 route does not establish mastery.
3. Observe consenting first-time learners without coaching. Test whether each
   can navigate, count an unfamiliar arrangement once per object, make a
   requested amount, connect the spoken word with a numeral, and repeat on a
   later day. Record exact sticking points and revise before claims of efficacy.
4. Recheck Spanish with a qualified reviewer and target learners. The Spanish
   overlay is present but has not been independently proofread in this cycle.

Code tests validate structure and behavior, not child comprehension. A fixed
number of screens or repetitions is not itself a mastery standard.

## Construction through twenty

The 11–15 and 16–20 lessons now include making groups of 12, 15, 18,
and 20 after the corresponding number has been introduced and counted.
Feedback directs learners to add or remove a dot as appropriate. The
20-dot activity allows adding up to twenty, so it has no excess-dot path.
Both lessons advance their content revision to preserve earlier completed
attempts separately. Natural narration and first-time learner observation
remain outstanding; these additions do not establish mastery.
