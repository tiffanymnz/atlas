export function renderComparisonBlocks(visual,label="Comparison model"){
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
      html += `<span class="${cls}" aria-hidden="true" style="animation-delay:${i*20}ms"></span>`;
    }
    return html + `</div>`;
  }
  return `<div class="stage" role="img" aria-label="${label}">${row(top,false)}${row(bottom,true)}<div class="visualMsg">${msg}</div></div>`;
}
function renderEqualGroups(visual,label){
  const groups=Math.max(1,Number(visual?.groups)||1),items=Math.max(0,Number(visual?.itemsPerGroup)||0);
  const boxes=Array.from({length:groups},()=>`<div class="equalGroup" aria-hidden="true"><span>${Array.from({length:items},()=>"<i></i>").join("")}</span><b>${items}</b></div>`).join("");
  return `<div class="stage conceptStage" role="img" aria-label="${visual?.ariaLabel||label}"><div class="equalGroups">${boxes}</div><div class="visualMsg">${visual?.message||""}</div></div>`;
}
function renderFractionBar(visual,label){
  const denominator=Math.max(1,Number(visual?.denominator)||1),numerator=Math.max(0,Number(visual?.numerator)||0);
  const wholes=Math.max(1,Math.ceil(numerator/denominator));
  const bars=Array.from({length:wholes},(_,whole)=>`<div class="fractionBar" style="--parts:${denominator}">${Array.from({length:denominator},(_,part)=>`<span class="fractionPart${whole*denominator+part<numerator?" filled":""}" aria-hidden="true"></span>`).join("")}</div>`).join("");
  const caption=visual?.caption?`<div class="fractionLabel">${visual.caption}</div>`:"";
  return `<div class="stage conceptStage" role="img" aria-label="${visual?.ariaLabel||label}"><div class="fractionBars">${bars}</div>${caption}<div class="visualMsg">${visual?.message||""}</div></div>`;
}
function renderHundredGrid(visual,label){
  const shaded=Math.min(100,Math.max(0,Number(visual?.shaded)||0));
  const cells=Array.from({length:100},(_,index)=>`<span class="hundredCell${index<shaded?" filled":""}" aria-hidden="true"></span>`).join("");
  const caption=visual?.caption?`<div class="fractionLabel">${visual.caption}</div>`:"";
  return `<div class="stage conceptStage" role="img" aria-label="${visual?.ariaLabel||label}"><div class="hundredGrid">${cells}</div>${caption}<div class="visualMsg">${visual?.message||""}</div></div>`;
}
function renderAreaGrid(visual,label){
  const rows=Math.min(10,Math.max(1,Number(visual?.rows)||1));
  const columns=Math.min(12,Math.max(1,Number(visual?.columns)||1));
  const cells=Array.from({length:rows*columns},()=>`<span class="areaCell" aria-hidden="true"></span>`).join("");
  const caption=visual?.caption?`<div class="fractionLabel">${visual.caption}</div>`:"";
  return `<div class="stage conceptStage" role="img" aria-label="${visual?.ariaLabel||label}"><div class="areaGrid" style="--area-columns:${columns};--area-rows:${rows}">${cells}</div>${caption}<div class="visualMsg">${visual?.message||""}</div></div>`;
}
function renderPerimeterPath(visual,label){
  if(visual?.shape==="step"){
    const values=(Array.isArray(visual.segments)?visual.segments:[6,2,2,2,4,4]).slice(0,6);
    const segment=index=>Number(values[index])||0;
    const caption=visual?.caption?`<div class="fractionLabel">${visual.caption}</div>`:"";
    return `<div class="stage conceptStage" role="img" aria-label="${visual?.ariaLabel||label}"><svg class="perimeterStep" viewBox="0 0 380 280" aria-hidden="true" focusable="false"><path d="M45 45 H335 V135 H240 V230 H45 Z"></path><circle cx="45" cy="45" r="9"></circle><text x="190" y="28">${segment(0)} units</text><text x="350" y="95">${segment(1)} units</text><text x="288" y="122">${segment(2)} units</text><text x="255" y="185">${segment(3)} units</text><text x="143" y="258">${segment(4)} units</text><text x="28" y="140">${segment(5)} units</text></svg>${caption}<div class="visualMsg">${visual?.message||""}</div></div>`;
  }
  const width=Math.min(12,Math.max(1,Number(visual?.widthUnits)||1));
  const height=Math.min(10,Math.max(1,Number(visual?.heightUnits)||1));
  const caption=visual?.caption?`<div class="fractionLabel">${visual.caption}</div>`:"";
  return `<div class="stage conceptStage" role="img" aria-label="${visual?.ariaLabel||label}"><div class="perimeterModel" style="--path-width:${width};--path-height:${height}" aria-hidden="true"><span class="perimeterStart">●</span><span class="perimeterTop">${width} units</span><span class="perimeterRight">${height} units</span><span class="perimeterBottom">${width} units</span><span class="perimeterLeft">${height} units</span></div>${caption}<div class="visualMsg">${visual?.message||""}</div></div>`;
}
export function renderConceptVisual(visual,label="Concept model"){
  if(visual?.kind==="equalGroups") return renderEqualGroups(visual,label);
  if(visual?.kind==="fractionBar") return renderFractionBar(visual,label);
  if(visual?.kind==="hundredGrid") return renderHundredGrid(visual,label);
  if(visual?.kind==="areaGrid") return renderAreaGrid(visual,label);
  if(visual?.kind==="perimeterPath") return renderPerimeterPath(visual,label);
  return renderComparisonBlocks(visual,label);
}
export function renderChoiceScreen(screen,copy={hint:"Hint",checkAnswer:"Check answer"}){
  let html = `<div class="choiceGrid" role="radiogroup" aria-label="${copy.choices || "Answer choices"}">`;
  screen.choices.forEach((c,i)=> html += `<button class="choice" type="button" role="radio" data-i="${i}" aria-checked="false" tabindex="${i===0?0:-1}"><span>${c.text}</span><span></span></button>`);
  return html + `</div><div class="toolbar"><button class="btn secondary" type="button" id="hintBtn">${copy.hint}</button><button class="btn primary" type="button" id="submit" disabled>${copy.checkAnswer}</button></div><div class="hint" id="hintBox" role="note" aria-live="polite"></div><div class="feedback" id="feedback" role="status" aria-live="polite" aria-atomic="true"></div>`;
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
  html += `</div>`;
  if(screen.definitions?.length) html += `<div class="definitionGrid">${screen.definitions.map(item=>`<div class="definition"><strong>${item.term}</strong><span>${item.meaning}</span></div>`).join("")}</div>`;
  return html;
}
export function renderEquation(screen){ return `<div class="equation">${screen.equation}</div>`; }
export function renderComplete(screen,recommendation,hasNext,copy={complete:"Complete",nextLesson:"Next lesson",reviewVisualGap:"Review visual gap",restartLesson:"Restart lesson"}){
  const nextButton = hasNext ? `<button class="btn primary" type="button" id="nextLessonBtn">${copy.nextLesson}</button>` : "";
  return `<div class="complete"><div class="check" aria-hidden="true">✓</div><span class="badge">${copy.complete}</span><h1 id="screenTitle">${screen.title}</h1><p>${screen.body}</p><div class="toolbar" style="justify-content:center"><button class="btn secondary" type="button" id="reviewBtn">${copy.reviewVisualGap}</button>${nextButton}<button class="btn secondary" type="button" id="restartBtn">${copy.restartLesson}</button></div></div>`;
}
