# Audio and narrow-layout review

Date: October 23, 2026. Test branch only; no production approval.

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
