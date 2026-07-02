import { renderComparisonBlocks, renderChoiceScreen, renderLanguage, renderEquation, renderComplete } from "../../sdk/components/lessonComponents.js";
import { createAnalytics, showAnalytics } from "../analytics-engine/analyticsEngine.js";
import { recommendNext } from "../recommendation-engine/recommendationEngine.js";

let lesson = null, index = 0, selected = null, hintIndex = 0;
let dark = false, big = false, reduce = false;
let analytics = createAnalytics();

const root = document.getElementById("lessonRoot");
const lessonSelect = document.getElementById("lessonSelect");
function el(id){ return document.getElementById(id); }
function pct(){ return Math.round(index/(lesson.screens.length-1)*100); }
function current(){ return lesson.screens[index]; }
function emit(type,payload={}){ analytics.record({type, screen:index, component:current()?.type, payload}); }
function hasNextLesson(){ return lessonSelect.selectedIndex < lessonSelect.options.length - 1; }
function goToNextLesson(){ if(hasNextLesson()){ lessonSelect.selectedIndex += 1; loadLesson(lessonSelect.value); } }
function reviewVisualGap(){
  const target = lesson.screens.findIndex(screen => screen.visual && screen.visual.revealGap === true);
  index = target >= 0 ? target : Math.max(0, lesson.screens.length - 2);
  selected = null;
  hintIndex = 0;
  emit("review_visual_gap", {target:index});
  render();
}
function base(screen){ return `<span class="badge">${screen.label || screen.stage || "Lesson"}</span><div class="progress"><span style="width:${pct()}%"></span></div><h1>${screen.title}</h1>`; }
async function loadLesson(path){
  const res = await fetch(path);
  lesson = await res.json();
  index = 0; selected = null; hintIndex = 0; analytics = createAnalytics();
  render();
}
function render(){
  const screen = current();
  selected = null; hintIndex = 0; emit("mount");
  if(screen.type==="intro"){
    const body = screen.body ? `<p>${screen.body}</p>` : "";
    const callout = screen.callout ? `<div class="coach" style="display:block">${screen.callout}</div>` : "";
    root.innerHTML = base(screen)+body+callout+`<button class="btn primary" id="nextBtn">Start lesson</button>`;
    el("nextBtn").onclick = next; return;
  }
  if(screen.type==="observe"){
    root.innerHTML = base(screen)+renderComparisonBlocks(screen.visual)+`<div class="toolbar"><button class="btn secondary" id="backBtn">Back</button><button class="btn primary" id="nextBtn">${screen.nextLabel || "Next"}</button></div>`;
    el("backBtn").onclick = back; el("nextBtn").onclick = next; return;
  }
  if(screen.type==="discover" || screen.type==="symbol" || screen.type==="reflection"){
    const visual = screen.visual ? renderComparisonBlocks(screen.visual) : `<p>${screen.prompt || ""}</p>`;
    root.innerHTML = base(screen)+visual+renderChoiceScreen(screen);
    bindChoiceScreen(screen); return;
  }
  if(screen.type==="language"){
    root.innerHTML = base(screen)+renderComparisonBlocks(screen.visual)+renderLanguage(screen)+`<div class="coach" style="display:block">${screen.guidance}</div><div class="toolbar"><button class="btn secondary" id="backBtn">Back</button><button class="btn primary" id="nextBtn">Next</button></div>`;
    el("backBtn").onclick = back; el("nextBtn").onclick = next; return;
  }
  if(screen.type==="equationReveal"){
    root.innerHTML = base(screen)+renderComparisonBlocks(screen.visual)+renderEquation(screen)+`<div class="toolbar"><button class="btn secondary" id="backBtn">Back</button><button class="btn primary" id="nextBtn">Reflect</button></div>`;
    el("backBtn").onclick = back; el("nextBtn").onclick = next; return;
  }
  if(screen.type==="complete"){
    const hasNext = hasNextLesson();
    root.innerHTML = renderComplete(screen, recommendNext(lesson, analytics.summary(), screen, hasNext), hasNext);
    el("restartBtn").onclick = restart;
    const reviewBtn = el("reviewBtn");
    if(reviewBtn) reviewBtn.onclick = reviewVisualGap;
    const nextBtn = el("nextLessonBtn");
    if(nextBtn) nextBtn.onclick = goToNextLesson;
    return;
  }
}
function bindChoiceScreen(screen){
  document.querySelectorAll(".choice").forEach(btn=>{
    btn.onclick = () => {
      selected = Number(btn.dataset.i);
      document.querySelectorAll(".choice").forEach(b=>b.classList.remove("selected"));
      btn.classList.add("selected");
      el("submit").disabled = false;
      emit("select",{value:selected});
    };
  });
  el("hintBtn").onclick = () => hint(screen);
  el("submit").onclick = () => submitChoice(screen);
}
function submitChoice(screen){
  const choice = screen.choices[selected];
  const good = choice.correct;
  const fb = el("feedback");
  emit("submit",{correct:good, value:selected, misconception:choice.misconception || null, evidence:choice.evidence || null});
  if(good){
    document.querySelectorAll(".choice").forEach((btn,i)=>{ btn.disabled = true; if(screen.choices[i].correct) btn.classList.add("correct"); });
    fb.style.display = "block"; fb.className = "feedback success";
    fb.innerHTML = `<strong>Correct.</strong>${choice.feedback ? "<br>"+choice.feedback : ""}`;
    setTimeout(next,900);
  } else {
    const h = screen.hints?.[Math.min(hintIndex, screen.hints.length-1)] || "Look at what the problem is asking you to find.";
    hintIndex++;
    fb.style.display = "block"; fb.className = "feedback warn";
    fb.innerHTML = `<strong>Look again.</strong><br>${h}`;
    document.querySelectorAll(".choice").forEach(btn=>{ btn.disabled = false; btn.classList.remove("selected","correct"); });
    selected = null; el("submit").disabled = true; emit("guided_retry",{hint:h});
  }
}
function hint(screen){
  const h = screen.hints?.[Math.min(hintIndex, screen.hints.length-1)] || "Look at what the problem is asking you to find.";
  hintIndex++;
  const box = el("hintBox");
  box.style.display = "block"; box.innerHTML = `<strong>Hint</strong><br>${h}`;
  emit("hint",{hint:h});
}
function next(){ if(index < lesson.screens.length-1){ index++; render(); } }
function back(){ if(index > 0){ index--; render(); } }
function restart(){ index = 0; analytics = createAnalytics(); render(); }
el("analyticsBtn").onclick = () => showAnalytics(lesson, analytics, index, pct());
el("closeAnalytics").onclick = () => { el("analyticsModal").style.display = "none"; el("analyticsModal").setAttribute("aria-hidden","true"); };
el("analyticsModal").onclick = e => { if(e.target.id==="analyticsModal"){ el("analyticsModal").style.display = "none"; el("analyticsModal").setAttribute("aria-hidden","true"); } };
el("themeBtn").onclick = function(){ dark=!dark; document.body.setAttribute("data-theme",dark?"dark":"light"); this.innerHTML=dark?"Light mode":"Dark mode"; };
el("textBtn").onclick = function(){ big=!big; document.documentElement.style.setProperty("--scale",big?"1.12":"1"); this.innerHTML=big?"Normal text":"Bigger text"; };
el("motionBtn").onclick = function(){ reduce=!reduce; document.body.className=reduce?"reduce":""; this.innerHTML=reduce?"Allow motion":"Reduce motion"; };
lessonSelect.onchange = () => loadLesson(lessonSelect.value);
loadLesson(lessonSelect.value);
