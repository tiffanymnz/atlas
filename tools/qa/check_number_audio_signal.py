#!/usr/bin/env python3
"""Offline signal screening of existing MP3s; never generates or approves voices."""
import array
import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]


def measure(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(ROOT / path), "-f", "f32le",
         "-ac", "1", "-ar", "24000", "pipe:1"],
        check=True, capture_output=True, timeout=30,
    ).stdout
    samples = array.array("f")
    samples.frombytes(raw)
    if sys.byteorder != "little":
        samples.byteswap()
    if not samples or not all(math.isfinite(x) for x in samples):
        raise ValueError(f"Empty or non-finite audio: {path}")
    windows = [samples[i:i + 240] for i in range(0, len(samples), 240)]
    # -40 dBFS window RMS is a reproducible screening threshold, not a speech detector.
    active = [i for i, w in enumerate(windows)
              if math.sqrt(sum(x*x for x in w) / len(w)) >= .01]
    energy = [x*x for i in active for x in windows[i]]
    return {
        "file": path,
        "sha256": hashlib.sha256((ROOT / path).read_bytes()).hexdigest(),
        "durationSeconds": round(len(samples) / 24000, 3),
        "peakDbfs": round(20 * math.log10(max(max(abs(x) for x in samples), 1e-12)), 2),
        "activeRmsDbfs": round(10 * math.log10(sum(energy) / len(energy)), 2) if energy else None,
        "leadingQuietMs": active[0] * 10 if active else None,
        "trailingQuietMs": max(0, round(len(samples) / 24 - (active[-1] + 1) * 10)) if active else None,
        "samplesAtOrAboveFullScale": sum(abs(x) >= 1 for x in samples),
    }


def main():
    screening = json.loads((ROOT / "curriculum/reviews/sprint18_number_audio_screening.json").read_text())
    candidate = json.loads((ROOT / "assets/audio/candidates/manifest.json").read_text())
    rows = []
    for clip in screening["numbers"]:
        rows.append(dict(version="current", language=clip["language"], number=clip["number"], **measure(clip["file"])))
    for language, entry in candidate["languages"].items():
        for clip in entry["numbers"]:
            rows.append(dict(version="candidate", language=language, number=clip["number"], **measure(clip["file"])))
    report = {
        "method": "ffmpeg decoded mono 24kHz PCM; active RMS uses 10ms windows at or above -40 dBFS",
        "limitations": "No listening, pronunciation, naturalness, phoneme-boundary, device playback, or comprehension approval. Quiet edges cannot prove an intact word ending. Active RMS varies with phonemes and is not perceived loudness.",
        "clips": rows,
    }
    target = ROOT / "curriculum/reviews/sprint18_number_audio_signal.json"
    target.write_text(json.dumps(report, indent=2) + "\n")
    for version in ("current", "candidate"):
        for language in ("en", "es"):
            group = [r for r in rows if r["version"] == version and r["language"] == language]
            levels = [r["activeRmsDbfs"] for r in group if r["activeRmsDbfs"] is not None]
            print(version, language, json.dumps({
                "clips": len(group), "activeRmsRangeDb": [min(levels), max(levels)],
                "fullScaleSamples": sum(r["samplesAtOrAboveFullScale"] for r in group),
                "quietOrEmptyClips": sum(r["activeRmsDbfs"] is None for r in group),
                "under20msQuietAtEnd": [r["number"] for r in group if r["trailingQuietMs"] is not None and r["trailingQuietMs"] < 20],
            }))


if __name__ == "__main__":
    main()
