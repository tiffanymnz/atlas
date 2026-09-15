export function renderComparisonBlocks(visual){
  const top = visual?.topCount ?? 15;
  const bottom = visual?.bottomCount ?? 9;
  const reveal = !!visual?.revealGap;
  const msg = visual?.message || "";
  const shared = Math.min(top,bottom);
  function row(count,isBottom){
    let html = `<div class="blockRow">`;
    for(let i=0;i<count;i++){
      let cls = "block";
      if(isBottom) cls += " bottom";
      if(!isBottom && reveal && i>=shared) cls += " extra";
      else if(reveal && i<shared) cls += " dim";
      html += `<span class="${cls}" style="animation-delay:${i*20}ms"></span>`;
    }
    return html + `</div>`;
  }
  return `<div class="stage" aria-label="Comparison model showing ${top} compared with ${bottom}">${row(top,false)}${row(bottom,true)}<div class="visualMsg">${msg}</div></div>`;
}
export function renderChoiceScreen(screen,copy={hint:"Hint",checkAnswer:"Check answer"}){
  let html = `<div class="choiceGrid">`;
  screen.choices.forEach((c,i)=> html += `<button class="choice" data-i="${i}"><span>${c.text}</span><span></span></button>`);
  return html + `</div><div class="toolbar"><button class="btn secondary" id="hintBtn">${copy.hint}</button><button class="btn primary" id="submit" disabled>${copy.checkAnswer}</button></div><div class="hint" id="hintBox"></div><div class="feedback" id="feedback"></div>`;
}
export function localizeChoiceState(screen,state,copy){
  const hintAt=index=>screen.hints?.[Math.min(Math.max(index,0),screen.hints.length-1)] || copy.fallbackHint;
  const result={hintHtml:null,feedback:null};
  if(state.hintShown||state.hintHtml){
    const index=Number.isInteger(state.hintStep)?state.hintStep:Math.max((Number(state.hintIndex)||1)-1,0);
    result.hintHtml=`<strong>${copy.hint}</strong><br>${hintAt(index)}`;
  }
  if(state.feedback){
    if(state.submittedCorrect){
      const detail=screen.choices?.[state.selected]?.feedback;
      result.feedback={className:"feedback success",html:`<strong>${copy.correct}</strong>${detail?"<br>"+detail:""}`};
    }else{
      const index=Number.isInteger(state.feedbackHintIndex)?state.feedbackHintIndex:Math.max((Number(state.hintIndex)||1)-1,0);
      result.feedback={className:"feedback warn",html:`<strong>${copy.lookAgain}</strong><br>${hintAt(index)}`};
    }
  }
  return result;
}
export function renderLanguage(screen){
  let html = `<div class="phraseGrid">`;
  screen.phrases.forEach(p => html += `<div class="phrase">${p}<span>${screen.phraseMeaning || "Same idea"}</span></div>`);
  return html + `</div>`;
}
export function renderEquation(screen){ return `<div class="equation">${screen.equation}</div>`; }
export function renderComplete(screen,recommendation,hasNext,copy={complete:"Complete",nextLesson:"Next lesson",reviewVisualGap:"Review visual gap",restartLesson:"Restart lesson"}){
  const nextButton = hasNext ? `<button class="btn primary" id="nextLessonBtn">${copy.nextLesson}</button>` : "";
  return `<div class="complete"><div class="check">✓</div><span class="badge">${copy.complete}</span><h1>${screen.title}</h1><p>${screen.body}</p><div class="toolbar" style="justify-content:center"><button class="btn secondary" id="reviewBtn">${copy.reviewVisualGap}</button>${nextButton}<button class="btn secondary" id="restartBtn">${copy.restartLesson}</button></div></div>`;
}
