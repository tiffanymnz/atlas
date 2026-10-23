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

## Provenance

- Model publisher: https://huggingface.co/hexgrad/Kokoro-82M (Apache-2.0 weights).
- Runtime: https://github.com/thewh1teagle/kokoro-onnx (MIT).
- Model export: https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/kokoro-v1.0.onnx
- Voice styles: https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/voices-v1.0.bin
- Model SHA256: `beb0d1848dee9a49da392cc3df26958d46cfa35d321edf434f52949153f0df3a`
- Voices SHA256: `bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d`

## Rebuild

Use a separate Python 3.12 environment with `kokoro-onnx==0.4.9`,
`onnxruntime==1.31.0`, `numpy==2.5.4`, and `soundfile==0.14.0`; install ffmpeg.
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
