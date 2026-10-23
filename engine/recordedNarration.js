// Recordings are explicitly supplied per language; never substitute English
// narration for another language or silently replace a failed clip with speech.
export function recordedNarrationUrl(screen, language, engineUrl){
  const path=screen?.audioFiles?.[language];
  if(typeof path!=="string" || !/^assets\/audio\/[A-Za-z0-9_/-]+\.(mp3|wav|m4a|ogg)$/.test(path)) return null;
  return new URL(`../${path}`,engineUrl).href;
}

export function createRecordedNarration(makeAudio=src=>new Audio(src),{schedule=setTimeout,unschedule=clearTimeout}={}){
  let active=null,timer=null;
  function clearTimer(){if(timer!==null){unschedule(timer);timer=null;}}
  function stop(){
    const previous=active;
    active=null;
    clearTimer();
    if(previous){ previous.onended=null; previous.onerror=null; previous.onplaying=null; previous.onwaiting=null; previous.pause(); }
  }
  return {
    get playing(){ return active!==null; },
    stop,
    async play(src,onFinish,onError){
      stop();
      const sources=Array.isArray(src)?[...src]:[src];
      if(!sources.length){onError?.();return;}
      let clip;
      try{
        clip=makeAudio(sources.shift());
        active=clip;
        const finish=failed=>{
          if(active!==clip) return;
          stop();
          (failed?onError:onFinish)?.();
        };
        const play=async()=>{
          clearTimer();
          timer=schedule(()=>finish(true),15000);
          try{await clip.play();}catch{finish(true);}
        };
        // Reuse the media element unlocked by the original user tap on iOS.
        clip.onended=()=>{
          if(active!==clip) return;
          if(sources.length){clip.src=sources.shift();void play();}
          else finish(false);
        };
        clip.onerror=()=>finish(true);
        clip.onplaying=()=>{if(active===clip) clearTimer();};
        clip.onwaiting=()=>{
          if(active!==clip) return;
          clearTimer();timer=schedule(()=>finish(true),15000);
        };
        await play();
      }catch{if(!clip||active===clip){stop();onError?.();}}
    }
  };
}
