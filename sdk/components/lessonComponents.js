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
export function renderChoiceScreen(screen){
  let html = `<div class="choiceGrid">`;
  screen.choices.forEach((c,i)=> html += `<button class="choice" data-i="${i}"><span>${c.text}</span><span></span></button>`);
  return html + `</div><div class="toolbar"><button class="btn secondary" id="hintBtn">Hint</button><button class="btn primary" id="submit" disabled>Check answer</button></div><div class="hint" id="hintBox"></div><div class="feedback" id="feedback"></div>`;
}
export function renderLanguage(screen){
  let html = `<div class="phraseGrid">`;
  screen.phrases.forEach(p => html += `<div class="phrase">${p}<span>${screen.phraseMeaning || "Same idea"}</span></div>`);
  return html + `</div>`;
}
export function renderEquation(screen){ return `<div class="equation">${screen.equation}</div>`; }
export function renderComplete(screen,recommendation,hasNext){
  const nextButton = hasNext ? `<button class="btn primary" id="nextLessonBtn">Next lesson</button>` : "";
  return `<div class="complete"><div class="check">✓</div><span class="badge">Complete</span><h1>${screen.title}</h1><p>${screen.body}</p><div class="toolbar" style="justify-content:center"><button class="btn secondary" id="reviewBtn">Review visual gap</button>${nextButton}<button class="btn secondary" id="restartBtn">Restart lesson</button></div></div>`;
}
