import {countingAudio} from "../assets/audio/catalog.js";

export function bundledAudioUrls(parts,language,engineUrl){
  if(!parts.length) return null;
  const paths=parts.map(text=>countingAudio[language]?.[String(text).replace(/\s+/g," ").trim()]);
  return paths.every(Boolean)?paths.map(path=>new URL(`../${path}`,engineUrl).href):null;
}

// Read the current hint/feedback as separate clips, without reading HTML labels.
export function countingAudioParts(screen,state={}){
  const parts=[screen.audio];
  const hintAt=index=>screen.hints?.[Math.min(Math.max(index,0),screen.hints.length-1)];
  if(state.hintShown) parts.push(hintAt(state.hintStep??Math.max((state.hintIndex||1)-1,0)));
  if(state.feedback){
    if(screen.type==="buildGroup"){
      const count=state.builtCount||0;
      parts.push(state.submittedCorrect?screen.correctFeedback:
        count>screen.targetCount?(screen.tooManyFeedback||screen.wrongFeedback):
        count<screen.targetCount?(screen.tooFewFeedback||screen.wrongFeedback):screen.wrongFeedback);
    }else parts.push(state.submittedCorrect?screen.choices?.[state.selected]?.feedback:
      screen.choices?.[state.wrongChoiceIndex]?.feedback||hintAt(state.feedbackHintIndex??Math.max((state.hintIndex||1)-1,0)));
  }
  return parts.filter(Boolean);
}
