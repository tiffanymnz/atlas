# Counting audio

These MP3s are generated synthetic narration, not human recordings. They are
provisional voice candidates. No music or added effects. Normalized mono audio
at 24 kHz / 64 kbps; each clip is loaded on demand, not as one large download.
`catalog.js` maps exact lesson text to language-specific files. The learner
uses these files for short counting instructions, number taps, numeric choices,
group construction, and replay of the active hint/feedback. Older optional
full reviews retain their number-only strategy. Comparison and later prototypes
still use device speech unless an exact phrase has a bundled clip.

Generated with Kokoro v1.0, `af_heart` (English) and `ef_dora` (Spanish), using
the CPU ONNX export. These are preset synthetic voices; no person's voice was
cloned for Atlas. Voice suitability and Spanish pronunciation still need listening
review. Decoding and playback events cannot establish instructional quality.

The current build is `kokoro-v1-misaki094-v2`. It converts phonemes with
Misaki's English fallback and Spanish G2P before model inference. The initial
build omitted model-specific sound conversion and is superseded. Different
build IDs produce different asset URLs, preventing reuse of the older clips.
Numerals and spoken names share a canonical recording (for example, `6` and
`six`). The catalog has 1,194 text entries mapped to 1,152 unique MP3s.

## Provenance

- Model publisher: https://huggingface.co/hexgrad/Kokoro-82M (Apache-2.0 weights).
- Runtime: https://github.com/thewh1teagle/kokoro-onnx (MIT).
- Model export: https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.0.onnx
- Voice styles: https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/voices-v1.0.bin
- Model SHA256: `beb0d1848dee9a49da392cc3df26958d46cfa35d321edf434f52949153f0df3a`
- Voices SHA256: `bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d`

## Rebuild

Use a separate Python 3.12 environment with `kokoro-onnx==0.4.9`,
`onnxruntime==1.31.0`, `numpy==2.5.4`, `misaki==0.9.4`, and
`soundfile==0.14.0`; install ffmpeg.
Download the files above and verify their hashes. They are build dependencies;
do not commit the model, environment, or Python packages.

```sh
python tools/build/generate_counting_audio.py --model /path/to/kokoro-v1.0.onnx --voices /path/to/voices-v1.0.bin
python tools/build/generate_counting_audio.py --check
```

The generator resumes existing files. For a voice/model change, generate into
a separate checkout with an empty audio output directory; do not reuse old
clips with new provenance. For faster CPU builds use four processes with
`--shards 4 --shard 0` through `--shard 3`. Run `--check` after all finish.
Re-run listening review after any voice, script, or model change.

## Recognition screening

`tools/qa/screen_number_audio.py` is optional build-time screening using
`faster-whisper==1.2.1`. It receives no expected-transcript prompt. Its report
records recognition mismatches for review and cannot approve naturalness,
pronunciation, device playback, or independent learning. Short single words
can yield recognizer errors. The current screening includes unresolved flags;
these voices are not cleared for learner testing.

## Continuous-count comparison candidate

On October 24 the user reported inconsistent naturalness in both languages.
`candidates/` therefore contains a separate experiment, not an approved fix.
Each language is rendered once as a continuous count from zero to twenty,
then split using the model's returned phoneme durations. The entire render
is normalized once, rather than independently adjusting every number's gain.
Each split includes a 15 ms leading margin, a 3 ms edge fade, and 80/120 ms
silence before/after it. Check for cut sounds or carryover when listening.

The same English and Spanish preset voices are used. This experiment tests
context and consistency; it does not establish naturalness. All active learner
clips remain unchanged. Use the version selector in `tools/qa/audio-review.html`
to compare the same number, or play the candidate's full count.

```sh
python tools/build/generate_sequence_number_candidates.py --model /path/to/kokoro-v1.0.onnx --voices /path/to/voices-v1.0.bin
```

The candidate manifest records hashes and model-derived sample ranges for all
42 number clips. Promotion into the learner requires an actual listening decision.

## Build-runtime telemetry

An October 24 build attempted unexpected Microsoft telemetry, and automatic
approval review blocked further interaction with that process. The builders
now set `ORT_DISABLE_TELEMETRY=1` before importing ONNX Runtime and call its
disable API after import. The recognition helper sets the same opt-out before
loading its dependencies. These are build-time scripts; the learner downloads
audio files and does not load this model runtime. Validation after the incident
used existing audio and did not rerun model inference.

Opt-out reference: https://github.com/microsoft/onnxruntime/blob/main/docs/Privacy.md
