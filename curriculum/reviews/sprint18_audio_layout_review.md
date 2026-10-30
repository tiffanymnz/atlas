# Audio and narrow-layout review

Date: October 23, 2026. Test branch only; no production approval.

## October 24 listening feedback

The user reports that some numbers sound natural and others do not in both
languages. This is a failed consistency/naturalness review, not voice approval.
Pairing work is paused while number audio is addressed.

A continuous-count comparison candidate is available separately from the
active lesson clips. Model timing splits each full count into individual
numbers, and one loudness adjustment is applied across the full recording.
The review page offers both versions for the same number, plus the full count.
It remains an unapproved experiment: splitting may introduce cut sounds or
carryover, and consistent generation does not prove a better voice.

Engineering checks: 137 tests pass, including candidate coverage, clip hashes,
model timing ranges, and confirmation that active learner clips remain unchanged.
All 42 candidate clips and both complete counts decode successfully. These
checks do not override the user's failed naturalness review.

Automatic review blocked further interaction with the build process after an
unexpected Microsoft telemetry attempt. Build scripts now set the documented
ONNX Runtime opt-out before dependency initialization. Remaining validation used
existing outputs and did not rerun model inference. Payload contents were not
established; no claim is made that the attempted disclosure was harmless.

## Confirmed generator defect and correction

The initial bundled-audio build fed generic eSpeak phonemes directly into the
voice model. The model's language pipeline expects conversions such as English
diphthong markers and Spanish affricates. The generator now uses Misaki 0.9.4
English fallback and Spanish G2P, then invokes model inference with
`is_phonemes=True`. Primary implementation references:

- https://github.com/hexgrad/misaki/blob/main/misaki/espeak.py
- https://github.com/thewh1teagle/kokoro-onnx/blob/main/examples/spanish.py

All clips are rebuilt under a new build identifier; old URLs are superseded.
Numeral choices and spoken number names now share the same canonical clip,
avoiding different renditions of the same number across controls. There are
1,194 text entries and 1,152 unique audio assets. This fixes an input-format
defect; it does not establish acceptable pronunciation or naturalness.

## Number-word recognition screening

The multilingual Whisper small model screened the 42 isolated number names
(0–20 in each language), without an expected-text prompt. Full records and
file hashes are in `sprint18_number_audio_screening.json`.

| Language | Exact normalized matches | Unresolved flags |
| --- | ---: | ---: |
| English | 20 of 21 | 1 |
| Spanish | 10 of 21 | 11 |

English six was transcribed as a different word. Spanish flags include zero,
one, three, five, six, eight, eleven, twelve, thirteen, sixteen, and twenty.
An earlier progress statement claiming 21/21 English matches was premature;
20/21 is the completed result.

These are recognizer outputs, not established pronunciation errors. Short
single-word clips can confuse recognition. Alternative Spanish preset voices
did not show a reliable advantage in a small candidate screen; no voice was
switched on that basis. Context/cropping experiments were inconclusive and
were not used in the delivered assets. Human listening review remains required.

## Real-browser narrow-layout checks

Published runtime inspected: `8abe7b8965936cb374ad5cf5657b1d60f51d4b2c`.
The developer harness loads the actual learner inside a narrow iframe;
it does not reproduce Safari, touch input, or physical-device audio.

| Representative screen | Language | Widths | Text sizes |
| --- | --- | --- | --- |
| Three-dot model | English | 320, 375, 390, 430 px | Normal, larger |
| Twenty-dot model | English and Spanish | Same four widths | Normal, larger |
| Paired-dot model | English and Spanish | Same four widths | Normal, larger |
| Difference blocks | Spanish | Same four widths | Normal, larger |
| Perimeter trace | Spanish | Same four widths | Normal, larger |

All 56 measured combinations had no horizontal page overflow or measured
content extending beyond the viewport. The iframe's vertical scrollbar uses
15 pixels, so content widths were 305, 360, 375, and 415 pixels. Comparison
rows with 13 top blocks and 8 bottom blocks had zero horizontal misalignment
between matched blocks at every width. Screenshots of the introduction and
paired-dot model were also inspected. This is representative coverage, not
an every-screen mobile-device pass.

## Release disposition

Engineering validation: all 136 tests pass, along with lesson, knowledge,
research, memory, audio-catalog, and release audits. All 1,152 current MP3s
passed full decoding. Screening-file hashes are tested against the exact
number recordings the learner serves; a voice change invalidates stale evidence.

Hold learner testing pending voice/pronunciation review and current physical
iPhone playback. Spanish is not signed off. Pairing and later lessons still
depend on device speech; their audio coverage is separate remaining work.
First-exposure learning effectiveness also remains unverified. Keep the branch
separate from main and retain all branches.

`tools/qa/audio-review.html` provides direct number and direction playback for
adult listening review, initially in English. It does not display recognizer
guesses or record approval. It avoids requiring another complete lesson run.

Post-publish runtime smoke check: `3da42f7a3839f489415e64dfeb26428b453b643c`
loaded the fresh introduction; English and Spanish narration both started
and finished without an audio error. This verifies media events, not audibility
or pronunciation quality on a physical device.

## Offline number-signal comparison — October 29, 2026

`python3 tools/qa/check_number_audio_signal.py` measures existing recordings
without loading a model or generating audio. Exact file hashes and measurements
are in `sprint18_number_audio_signal.json`.

All 84 isolated clips (42 current and 42 candidate) decoded, contained signal
above the screening threshold, and had no samples at or above digital full scale.
All had at least 20 ms of quiet at the end at the stated threshold. This does
not establish that a consonant or word ending survived segmentation.

| Set | English active RMS range | Spanish active RMS range |
| --- | --- | --- |
| Current | −18.32 to −16.22 dBFS | −19.76 to −16.43 dBFS |
| Sequence candidate | −25.28 to −15.00 dBFS | −23.54 to −13.96 dBFS |

The candidate has a wider signal-level spread despite normalization of each
continuous count. It is not ready to replace the current set as a consistency
fix. Active RMS is a screening measure, not perceived loudness; phonemes differ
in energy. Do not infer that the current set sounds natural from its smaller
range. The user's naturalness objection remains unresolved. Keep candidate
audio out of the learner until listening review covers each number, its ending,
and its level alongside adjacent numbers and lesson directions.

## Listening findings — October 30, 2026

User reports English playback is too fast, “zero” sounds unusual, and isolated
sequence candidates contain two numbers or a number followed by the start of
the next word. Spanish was not tested. This is a segmentation failure despite
valid decoding, quiet edges, model timing, and passing technical tests.

Reject the sequence candidate as a replacement; do not attempt to certify word
boundaries from signal thresholds. The review page now serves only original
complete clips, defaults to 80% playback, and offers 65% and 100% comparisons
with pitch preservation requested from the browser. Directions use the same
selected rate. This is an audition control, not regenerated slower narration
or a pronunciation fix. English zero remains unresolved. Learner audio and
production are unchanged. Spanish remains unreviewed.
