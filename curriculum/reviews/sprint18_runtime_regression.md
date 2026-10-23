# Sprint 18 runtime regression review

Date: October 23, 2026. Scope: the existing learner, all 34 picker entries,
English and Spanish. This is engineering evidence, not learner approval.

## Findings and fixes

- Preview URLs on the same host reused saved answers. A `practice` query token
  now isolates a test run's answers, history, and last lesson without deleting
  normal progress. Reopening the same run intentionally resumes it. Accessibility
  and language preferences remain shared. Ordinary URLs preserve normal resume.
- Browser speech could fail silently. Playback now retains utterances, resumes
  paused speech, handles errors, detects a six-second failure to start, and shows
  a retry message. Stale callbacks cannot update a newer playback request.
- Completion screens now also expose the audio error status.
- Earlier acceptance tests archived state directly; their name now accurately
  describes that scope. New DOM tests exercise real learner click handlers.
- Historical release sign-off is explicitly marked as historical so it cannot
  be mistaken for approval of this changed build.

## Automated evidence

`npm test`: 128 tests pass, plus lesson validation, knowledge graph, research
cards, generated memory assets, and release audit (52 internal references).

Actual learner DOM tests cover 34 lessons in two languages: 68 lesson runs and
876 screens. They exercise titles, empty fresh selections, available audio
requests, interactive counting, hints, incorrect answers, corrected answers,
group construction, completion, learning summary, and new attempts. Separate
flows cover refresh, language switching, isolated preview state, audio errors,
and successful retry. State tests cover malformed, legacy and future saved
records, history preservation, and accessibility preferences.

Speech uses a test double in DOM tests: it verifies requests and event handling,
not audible output, voice quality, or iPhone support. DOM rendering is not a
visual layout test. Correct-answer fixtures verify software behavior, not
whether a novice can discover the answer independently.

## Remaining release gates

- Real browser smoke check on the exact published commit.
- Audible playback and acceptable voice quality on physical iPhone/Safari;
  audio-dependent lessons are not cleared for independent use without this.
- Current mobile layout, zoom, keyboard, and assistive-technology checks.
- Independent Spanish review and first-exposure learner observation.

Do not merge or declare the build ready for learner testing based solely on
these automated results. Preserve all branches and the existing production build.
