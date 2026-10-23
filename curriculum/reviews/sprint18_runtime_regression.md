# Sprint 18 runtime regression review

Date: October 23, 2026. Scope: the existing learner, all 34 picker entries,
English and Spanish. This is engineering evidence, not learner approval.

## Follow-up: bundled counting audio

The earlier speech failure below prompted a bundled-audio implementation.
Counting now has 1,194 language-specific synthetic MP3 clips mapped to lesson
scripts, number names, choices, hints, and feedback. Short counting lessons use
media playback without requiring a browser speech engine. Optional full reviews
retain their number-only strategy. Comparison and later prototypes continue
to depend on device speech except where an exact bundled phrase is available.

Hints and feedback play after the learner's action, with Listen replay available.
There is no page-load autoplay. The player reuses a media element within a
prompt/hint sequence, handles rejected playback and a 15-second loading stall,
and stops on screen changes, language changes, restart, and page hiding.

A remaining old speech call in add/remove-dot handling was found and fixed.
The earlier DOM suite could pass despite an event-handler exception. The test
harness now collects uncaught browser errors and fails if any occur; it also
checks number taps, choices, and add/remove controls with speech APIs absent.
This corrects a gap in the earlier regression evidence.

The expanded suite passes 134 tests. Audio-file presence is now a required
`npm test` gate, alongside catalog/text coverage. Full MP3 decoding is checked
with `python3 tools/build/generate_counting_audio.py --check --decode`; all
1,194 MP3s passed decoding. An empty clip left by an interrupted generation
was caught by this gate and regenerated. Resume now rejects undersized files.
Generation details and voice provenance: `../../assets/audio/README.md`.

Physical iPhone playback, pronunciation, acceptable voice quality, mobile
layout, and independent first-exposure comprehension remain unverified.
Bundled audio does not itself establish standalone learning effectiveness.

Published playback check: `598cb79bbd58d76960b66e68241c626a2c63470f`.
English and Spanish introduction narration both entered Stop audio and returned
to Listen without an audio error. Spanish prompt-plus-hint replay also finished
without an error, with zero selected answers on the fresh question. These are
real browser media-event checks, not a listening judgment. They supersede the
earlier counting speech failure below. The check also exposed singular dot
wording, now corrected; number/hint/feedback playback now consistently exposes
Stop audio while active.

Final runtime follow-up: `2f8dc3affde542778eefb01a0d16c529ea71238d`.
The exact preview loaded as a fresh attempt. Spanish singular feedback showed
"Hay un punto"; English and Spanish number playback both completed without an
audio error, and Stop audio was visible during playback. The 876-screen DOM
regression was rerun after these last wording/control changes and passed.

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

- Counting browser playback now passes; later lessons still need separate
  audio coverage and verification.
- Audible playback and acceptable voice quality on physical iPhone/Safari;
  audio-dependent lessons are not cleared for independent use without this.
- Current mobile layout, zoom, keyboard, and assistive-technology checks.
- Independent Spanish review and first-exposure learner observation.

Do not merge or declare the build ready for learner testing based solely on
these automated results. Preserve all branches and the existing production build.
