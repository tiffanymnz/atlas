# Recorded narration integration

No approved natural recordings are included yet. This interface enables
repository-hosted screen narration without a service, account, or redesign.

Add `audioFiles` to an English lesson screen once recordings are available:

```json
"audioFiles": {
  "en": "assets/audio/en/count-one-intro.mp3",
  "es": "assets/audio/es/count-one-intro.mp3"
}
```

Paths are relative to the repository root. MP3, WAV, M4A, and OGG are accepted;
browser codec support still needs testing. Keep both language paths in the
base lesson, because translation overlays retain the base schema keys.
Never point both languages at an English recording.

Listen plays the recording on request; pressing it again stops playback.
Changing screens or starting number speech stops the recording. Failed clips
show Audio unavailable and can be retried; they do not silently switch to
synthetic speech. Screens without configured recordings retain existing behavior.

This first integration covers screen instructions only. Dynamic hints,
feedback, controls, choices, and individual number names still need their own
approved recordings and playback support before a prereader audio claim.

Review each recording for short familiar wording, clear number pronunciation,
gentle pace, and lack of background music. Verify English and Spanish with
appropriate reviewers and test on iPhone as well as a desktop browser.
Do not describe the lessons as naturally narrated until the files exist and
play correctly in the learner interface.
