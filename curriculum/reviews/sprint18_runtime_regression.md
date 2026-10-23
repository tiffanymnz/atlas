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

## Published browser smoke check

Runtime commit tested: `f2f713e5367730124c0659fb0b4cc148d7195f5b` on the
commit-specific raw.githack preview with an isolated engineering practice token.
The curriculum loaded; the first question had no selected answers and its check
button was disabled. Keyboard arrow navigation selected an answer; submission
and reload preserved that checked answer. English-to-Spanish switching preserved
the result and translated feedback. The learning summary opened and closed with
Escape. Larger text and reduced motion survived reload. At the observed
1348-pixel viewport there was no horizontal overflow, including with larger text.

Listen failed in this cloud Chromium browser and displayed the retry message.
This is a failed playback check, not evidence of working audio. The browser
console showed extension metadata errors; no Atlas-origin error was observed
in that smoke-check log. No physical-device audio result is available.

## Remaining release gates

- Resolve the failed browser playback check and establish working audio.
- Audible playback and acceptable voice quality on physical iPhone/Safari;
  audio-dependent lessons are not cleared for independent use without this.
- Current mobile layout, zoom, keyboard, and assistive-technology checks.
- Independent Spanish review and first-exposure learner observation.

Do not merge or declare the build ready for learner testing based solely on
these automated results. Preserve all branches and the existing production build.
