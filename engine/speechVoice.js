// Voice names are vendor labels, not evidence of instructional effectiveness.
// Prefer enhanced voices when exposed, then the device's matching default.
export function chooseSpeechVoice(voices, language){
  const target=language==="es"?"es-ES":"en-US";
  const matching=voices.filter(voice=>voice.lang?.replaceAll("_","-").toLowerCase().split("-")[0]===language);
  const score=voice=>
    (/natural|neural|premium|enhanced/i.test(voice.name||"")?100:0)+
    (voice.lang.replaceAll("_","-").toLowerCase()===target.toLowerCase()?20:0)+
    (voice.default?10:0);
  return matching.sort((a,b)=>score(b)-score(a))[0]||null;
}

export function configureSpeech(utterance, language, synthesis, numberOnly=false){
  utterance.lang=language==="es"?"es-ES":"en-US";
  const voice=chooseSpeechVoice(synthesis.getVoices?.()||[],language);
  if(voice){ utterance.voice=voice; utterance.lang=voice.lang; }
  utterance.rate=numberOnly?0.9:0.95;
  utterance.pitch=1;
  return utterance;
}
