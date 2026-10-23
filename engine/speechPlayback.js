import {configureSpeech} from "./speechVoice.js";

// Keep every utterance alive until it finishes, including individual dot names.
// Call play synchronously from the user's tap so mobile gesture permission remains.
export function createSpeechPlayback({synthesis,makeUtterance,schedule=setTimeout,unschedule=clearTimeout}){
  let active=null, timer=null;
  function clearTimer(){if(timer!==null){unschedule(timer);timer=null;}}
  function stop(){
    const previous=active;
    active=null;clearTimer();
    if(previous){previous.onstart=null;previous.onend=null;previous.onerror=null;}
    if(synthesis?.speaking||synthesis?.pending) synthesis.cancel();
  }
  return {
    get playing(){return active!==null;},
    stop,
    play(text,language,{numberOnly=false,onStart,onFinish,onError}={}){
      stop();
      if(!text?.trim()||!synthesis||!makeUtterance){onError?.();return;}
      let utterance;
      const finish=failed=>{
        if(active!==utterance) return;
        active=null;clearTimer();
        utterance.onstart=null;utterance.onend=null;utterance.onerror=null;
        (failed?onError:onFinish)?.();
      };
      try{
        utterance=makeUtterance(text);
        configureSpeech(utterance,language,synthesis,numberOnly);
        active=utterance;
        utterance.onstart=()=>{if(active===utterance){clearTimer();onStart?.();}};
        utterance.onend=()=>finish(false);
        utterance.onerror=()=>finish(true);
        timer=schedule(()=>{
          if(active!==utterance) return;
          finish(true);
          synthesis.cancel();
        },6000);
        if(synthesis.paused) synthesis.resume();
        synthesis.speak(utterance);
      }catch{
        if(utterance&&active===utterance) finish(true);
        else onError?.();
      }
    }
  };
}
