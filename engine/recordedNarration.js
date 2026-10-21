// Recordings are explicitly supplied per language; never substitute English
// narration for another language or silently replace a failed clip with speech.
export function recordedNarrationUrl(screen, language, engineUrl){
  const path=screen?.audioFiles?.[language];
  if(typeof path!=="string" || !/^assets\/audio\/[A-Za-z0-9_/-]+\.(mp3|wav|m4a|ogg)$/.test(path)) return null;
  return new URL(`../${path}`,engineUrl).href;
}

export function createRecordedNarration(makeAudio=src=>new Audio(src)){
  let active=null;
  function stop(){
    const previous=active;
    active=null;
    if(previous){ previous.onended=null; previous.onerror=null; previous.pause(); }
  }
  return {
    get playing(){ return active!==null; },
    stop,
    async play(src,onFinish,onError){
      stop();
      const clip=makeAudio(src);
      active=clip;
      const finish=(failed)=>{
        if(active!==clip) return;
        stop();
        (failed?onError:onFinish)?.();
      };
      clip.onended=()=>finish(false);
      clip.onerror=()=>finish(true);
      try{ await clip.play(); }catch{ finish(true); }
    }
  };
}
