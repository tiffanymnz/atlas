"""Render a continuous count, then split it using model phoneme durations.

Candidates only: this never changes the learner's active audio catalog.
Uses the same build-only dependencies and verified model as counting narration.
"""
import argparse
import os
import hashlib
import json
from pathlib import Path
import runpy
import subprocess
import tempfile
from types import SimpleNamespace

# Set before importing ONNX Runtime: its opt-out must precede initialization.
os.environ["ORT_DISABLE_TELEMETRY"]="1"

ROOT=Path(__file__).resolve().parents[2]

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--model",required=True)
    parser.add_argument("--voices",required=True)
    args=parser.parse_args()
    import numpy as np
    import onnxruntime as rt
    rt.disable_telemetry_events()
    import soundfile as sf
    from kokoro_onnx import Kokoro
    from misaki.espeak import EspeakFallback,EspeakG2P
    words=runpy.run_path(str(ROOT/"tools/build/generate_counting_audio.py"))["WORDS"]
    options=rt.SessionOptions();options.intra_op_num_threads=2;options.inter_op_num_threads=1
    session=rt.InferenceSession(args.model,sess_options=options,providers=["CPUExecutionProvider"])
    class FloatSpeedSession:
        duration=None
        def __getattr__(self,key):return getattr(session,key)
        def run(self,outputs,inputs):
            inputs["speed"]=np.array([.94],dtype=np.float32)
            result=session.run(outputs,inputs);self.duration=result[1].reshape(-1)
            return result
    wrapped=FloatSpeedSession()
    model=Kokoro.from_session(wrapped,args.voices)
    english=EspeakFallback(british=False);spanish=EspeakG2P(language="es")
    manifest={"version":"sequence-number-candidate-v1","status":"unapproved candidate",
        "method":"One continuous 0–20 render per language; split at model phoneme-duration boundaries; normalize the full render once.",
        "limitation":"Phoneme timing is not a human pronunciation or naturalness judgment. Review for cut sounds and unwanted carryover.","languages":{}}
    def encode(samples,rate,path):
        with tempfile.TemporaryDirectory() as folder:
            wav=Path(folder)/"clip.wav";sf.write(wav,samples,rate)
            subprocess.run(["ffmpeg","-v","error","-y","-i",str(wav),"-codec:a","libmp3lame","-b:a","64k",str(path)],check=True)
    for language,names in words.items():
        voice="af_heart" if language=="en" else "ef_dora"
        phonemes=[english(SimpleNamespace(text=word))[0] if language=="en" else spanish(word)[0] for word in names]
        full=", ".join(phonemes)+"."
        tokens=model.tokenizer.tokenize(full)
        assert len(tokens)<510,"Counting sequence must fit in one model inference"
        audio,rate=model.create(full,voice=voice,is_phonemes=True,trim=False)
        durations=wrapped.duration
        assert len(durations)==len(tokens)+2,"Unexpected phoneme-duration alignment"
        hop=len(audio)/int(durations.sum())
        assert hop==600,"Unexpected waveform frame size"
        folder=ROOT/"assets/audio/candidates"/language;folder.mkdir(parents=True,exist_ok=True)
        with tempfile.TemporaryDirectory() as temporary:
            raw=Path(temporary)/"raw.wav";normalized=Path(temporary)/"normalized.wav"
            sf.write(raw,audio,rate)
            subprocess.run(["ffmpeg","-v","error","-y","-i",str(raw),"-af","loudnorm=I=-19:TP=-2:LRA=7","-ar",str(rate),str(normalized)],check=True)
            audio,normalized_rate=sf.read(normalized)
            assert normalized_rate==rate and len(audio)>=int(durations.sum())*600
        full_path=folder/"count-0-20.mp3";encode(audio,rate,full_path)
        samples=[];offset=1
        separator=len(model.tokenizer.tokenize(", "))
        for number,(word,phones) in enumerate(zip(names,phonemes)):
            length=len(model.tokenizer.tokenize(phones))
            start=int(durations[:offset].sum())*600
            # Include the punctuation pause, stopping before the next number.
            boundary=offset+length+(separator if number<20 else 1)
            end=min(len(audio),int(durations[:boundary].sum())*600)
            clip=audio[max(0,start-int(.015*rate)):end].copy()
            assert len(clip)>rate*.1 and np.max(np.abs(clip))>.005
            fade=min(int(rate*.003),len(clip)//2)
            clip[:fade]*=np.linspace(0,1,fade);clip[-fade:]*=np.linspace(1,0,fade)
            clip=np.pad(clip,(int(rate*.08),int(rate*.12)))
            path=folder/f"number-{number:02}.mp3";encode(clip,rate,path)
            samples.append({"number":number,"word":word,"file":str(path.relative_to(ROOT)),
                "sha256":hashlib.sha256(path.read_bytes()).hexdigest(),"startSample":start,"endSample":end,"sampleRate":rate})
            offset=boundary
        manifest["languages"][language]={"voice":voice,"fullSequence":str(full_path.relative_to(ROOT)),
            "fullSampleCount":len(audio),"sampleRate":rate,
            "fullSha256":hashlib.sha256(full_path.read_bytes()).hexdigest(),"numbers":samples}
        print(f"Built {language}: 21 candidate clips and continuous count",flush=True)
    (ROOT/"assets/audio/candidates/manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")

if __name__=="__main__":main()
