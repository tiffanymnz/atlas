# Recorded narration integration

## October 23 counting update

Short counting lessons now use bundled synthetic MP3s for instructions, number
names, numeric choices, hints, feedback, and group construction. Hints and
feedback play after the learner taps the corresponding control; Listen can
replay the prompt plus current support. There is no page-load autoplay.
The catalog and build provenance are in `../../assets/audio/README.md`.
Number-only optional full reviews retain that strategy. Other lessons still
use device speech unless an explicit recording or matching bundled phrase exists.

This addresses missing device voices for covered counting content. It does not
establish acceptable voice quality, physical iPhone playback, complete interface
narration, or independent prereader comprehension. Those remain review gates.

## Explicit recording override

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

The explicit override below covers screen instructions. The newer bundled
counting catalog covers dynamic counting support separately. Neither is an
approved human recording set; a prereader audio claim still needs review.

Review each recording for short familiar wording, clear number pronunciation,
gentle pace, and lack of background music. Verify English and Spanish with
appropriate reviewers and test on iPhone as well as a desktop browser.
Do not describe the lessons as naturally narrated until the files exist and
play correctly in the learner interface.

## Interim device voice

Device speech now selects a matching English or Spanish voice on each request.
Names containing natural, neural, premium, or enhanced are preferred; then
locale and device-default status break ties. These names are vendor labels,
not a verified quality score. No voice downloads or account changes occur.
Sentence playback uses rate 0.95, and number words use 0.9. If the voice list
is initially empty, the browser chooses its default; later requests recheck
the list. Recordings still take priority when configured.

This improves selection but cannot guarantee natural speech on every device.
Listen to actual directions and numbers on iPhone before accepting the voice.
Number-only lessons retain that strategy; this does not add missing narration.
