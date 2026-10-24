"""Optional speech-recognition screening; never a human listening sign-off.

Build-only dependencies: faster-whisper==1.2.1, numpy, ffmpeg. A multilingual
Whisper base model is downloaded to the supplied cache directory, not the repo.
"""
import argparse
import os
import json
import pathlib
import re
import runpy
import subprocess
import unicodedata
import hashlib

os.environ["ORT_DISABLE_TELEMETRY"]="1"

ROOT=pathlib.Path(__file__).resolve().parents[2]

def normalize(text):
    plain=unicodedata.normalize("NFKD",text.lower()).encode("ascii","ignore").decode()
    return re.sub(r"[^a-z0-9]","",plain)

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--model-cache",required=True)
    parser.add_argument("--model",default="base",choices=["base","small"])
    args=parser.parse_args()
    import numpy as np
    from faster_whisper import WhisperModel
    source=runpy.run_path(str(ROOT/"tools/build/generate_counting_audio.py"))
    entries=source["catalog"]()
    model=WhisperModel(args.model,device="cpu",compute_type="int8",cpu_threads=4,download_root=args.model_cache)
    results=[]
    for language in ["en","es"]:
        for number,word in enumerate(source["WORDS"][language]):
            path=ROOT/entries[language][word]
            raw=subprocess.run(["ffmpeg","-v","error","-i",str(path),"-ar","16000","-ac","1","-f","f32le","-"],capture_output=True,check=True).stdout
            # Feed decoded PCM so screening is independent of PyAV API versions.
            samples=np.frombuffer(raw,dtype=np.float32)
            segments,_=model.transcribe(samples,language=language,beam_size=5,temperature=0,
                condition_on_previous_text=False,vad_filter=False)
            recognized=" ".join(segment.text.strip() for segment in segments)
            result={"language":language,"number":number,"expected":word,"recognized":recognized,
                "recognitionMatch":normalize(recognized) in [normalize(word),str(number)],
                "numericChoiceSameBytes":(ROOT/entries[language][str(number)]).read_bytes()==path.read_bytes(),
                "sha256":hashlib.sha256(path.read_bytes()).hexdigest(),
                "file":entries[language][word]}
            results.append(result)
            print(json.dumps(result,ensure_ascii=False),flush=True)
    report={"date":"2026-10-23","recognizer":f"faster-whisper 1.2.1 / multilingual {args.model} / CPU int8 / no transcript prompt",
        "audioBuild":source["VOICE_BUILD_ID"],
        "limitation":"Recognition is a screening signal, not human pronunciation or voice-quality approval. Mismatches require review.",
        "numbers":results}
    (ROOT/"curriculum/reviews/sprint18_number_audio_screening.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")

if __name__=="__main__":main()
