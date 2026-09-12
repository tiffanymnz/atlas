import { renderComparisonBlocks, renderChoiceScreen, renderLanguage, renderEquation, renderComplete } from "../sdk/components/lessonComponents.js";
import { createAnalytics, showAnalytics } from "./analytics-engine/analyticsEngine.js";
import { recommendNext } from "./recommendation-engine/recommendationEngine.js";
import { getPreferences, savePreferences, ensureLessonRecord, saveLessonRecord, getAllLessonRecords, archiveCompletedAttempt, newLessonAttempt, getLastLessonPath, saveLastLessonPath } from "./state-store/stateStore.js";

let lesson = null, lessonPath = null, index = 0, selected = null, hintIndex = 0;
let dark = false, big = false, reduce = false;
let analytics = createAnalytics();
let lessonRecord = null;

const root = document.getElementById("lessonRoot");
const lessonSelect = document.getElementById("lessonSelect");
function el(id){ return document.getElementById(id); }
function pct(){ return Math.round(index/(lesson.screens.length-1)*100); }
function current(){ return lesson.screens[index]; }
function currentState(){
  lessonRecord.screenStates ||= {};
  lessonRecord.screenStates[index] ||= { selected:null, hintIndex:0, hintHtml:"", feedback:null, submittedCorrect:false };
  return lessonRecord.screenStates[index];
}
function syncAttemptEvents(){
  if(lessonRecord?.currentAttempt) lessonRecord.currentAttempt.events = analytics.events();
}
function persist(){
  if(!lesson || !lessonRecord) return;
  lessonRecord.index = index;
  syncAttemptEvents();
  saveLessonRecord(lesson.metadata.id, lessonRecord);
}
function emit(type,payload={}){ analytics.record({type, screen:index, component:current()?.type, payload}); syncAttemptEvents(); persist(); }
function hasNextLesson(){ return lessonSelect.selectedIndex < lessonSelect.options.length - 1; }
function goToNextLesson(){ if(hasNextLesson()){ persist(); lessonSelect.selectedIndex += 1; loadLesson(lessonSelect.value); } }
function reviewVisualGap(){
  const target = lesson.screens.findIndex(screen => screen.visual && screen.visual.revealGap === true);
  index = target >= 0 ? target : Math.max(0, lesson.screens.length - 2);
  lessonRecord.index = index;
  emit("review_visual_gap", {target:index});
  render();
}
function base(screen){ return `<span class="badge">${screen.label || screen.stage || "Lesson"}</span><div class="progress"><span style="width:${pct()}%"></span></div><h1>${screen.title}</h1>`; }

function applyPreferences(){
  document.body.setAttribute("data-theme",dark?"dark":"light");
  document.documentElement.style.setProperty("--scale",big?"1.12":"1");
  document.body.classList.toggle("reduce",reduce);
  el("themeBtn").innerHTML=dark?"Light mode":"Dark mode";
  el("textBtn").innerHTML=big?"Normal text":"Bigger text";
  el("motionBtn").innerHTML=reduce?"Allow motion":"Reduce motion";
}
function loadPreferences(){
  const prefs=getPreferences();
  dark=!!prefs.dark; big=!!prefs.big; reduce=!!prefs.reduce;
  applyPreferences();
}
function persistPreferences(){ savePreferences({dark,big,reduce}); }

async function loadLesson(path){
  if(lesson && lessonRecord) persist();
  const res = await fetch(path);
  lesson = await res.json();
  lessonPath = path;
  saveLastLessonPath(path);
  lessonRecord = ensureLessonRecord(lesson, path);
  index = Math.min(Math.max(Number(lessonRecord.index)||0,0), lesson.screens.length-1);
  analytics = createAnalytics(lessonRecord.currentAttempt?.events || []);
  selected = null; hintIndex = 0;
  render();
}

function restoreChoiceState(screen){
  const state=currentState();
  selected=state.selected;
  hintIndex=state.hintIndex || 0;
  if(selected !== null && selected !== undefined){
    const selectedBtn=document.querySelector(`.choice[data-i="${selected}"]`);
    if(selectedBtn) selectedBtn.classList.add("selected");
    el("submit").disabled=false;
  }
  const hintBox=el("hintBox");
  if(state.hintHtml){ hintBox.style.display="block"; hintBox.innerHTML=state.hintHtml; }
  const fb=el("feedback");
  if(state.feedback){
    fb.style.display="block";
    fb.className=state.feedback.className || "feedback";
    fb.innerHTML=state.feedback.html || "";
  }
  if(state.submittedCorrect){
    document.querySelectorAll(".choice").forEach((btn,i)=>{
      btn.disabled=true;
      if(screen.choices[i].correct) btn.classList.add("correct");
      btn.classList.remove("selected");
    });
    el("submit").disabled=true;
  }
}

function markCompleted(){
  if(!lessonRecord.currentAttempt.completed){
    lessonRecord.currentAttempt.completed=true;
    lessonRecord.currentAttempt.completedAt=new Date().toISOString();
    syncAttemptEvents();
    lessonRecord.status="completed";
    lessonRecord=archiveCompletedAttempt(lessonRecord, analytics.summary());
    persist();
  }else{
    lessonRecord.status="completed";
    persist();
  }
}

function render(){
  const screen = current();
  const state=currentState();
  selected=state.selected;
  hintIndex=state.hintIndex || 0;
  if(screen.type!=="complete" && lessonRecord.status==="not_started" && index>0) lessonRecord.status="in_progress";
  persist();

  if(screen.type==="intro"){
    const body = screen.body ? `<p>${screen.body}</p>` : "";
    const callout = screen.callout ? `<div class="coach" style="display:block">${screen.callout}</div>` : "";
    const label = lessonRecord.status==="in_progress" ? "Resume lesson" : lessonRecord.status==="completed" ? "Review lesson" : "Start lesson";
    root.innerHTML = base(screen)+body+callout+`<button class="btn primary" id="nextBtn">${label}</button>`;
    el("nextBtn").onclick = next; return;
  }
  if(screen.type==="observe"){
    root.innerHTML = base(screen)+renderComparisonBlocks(screen.visual)+`<div class="toolbar"><button class="btn secondary" id="backBtn">Back</button><button class="btn primary" id="nextBtn">${screen.nextLabel || "Next"}</button></div>`;
    el("backBtn").onclick = back; el("nextBtn").onclick = next; return;
  }
  if(screen.type==="discover" || screen.type==="symbol" || screen.type==="reflection"){
    const visual = screen.visual ? renderComparisonBlocks(screen.visual) : `<p>${screen.prompt || ""}</p>`;
    root.innerHTML = base(screen)+visual+renderChoiceScreen(screen);
    bindChoiceScreen(screen); restoreChoiceState(screen); return;
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
    markCompleted();
    const hasNext = hasNextLesson();
    root.innerHTML = renderComplete(screen, recommendNext(lesson, analytics.summary(), screen, hasNext), hasNext);
    el("restartBtn").onclick = restart;
    const reviewBtn = el("reviewBtn");
    if(reviewBtn) reviewBtn.onclick = reviewVisualGap;
    const nextBtn = el("nextLessonBtn");
    if(nextBtn) nextBtn.onclick = goToNextLesson;
  }
}

function bindChoiceScreen(screen){
  document.querySelectorAll(".choice").forEach(btn=>{
    btn.onclick = () => {
      const state=currentState();
      if(state.submittedCorrect) return;
      selected = Number(btn.dataset.i);
      state.selected=selected;
      document.querySelectorAll(".choice").forEach(b=>b.classList.remove("selected"));
      btn.classList.add("selected");
      el("submit").disabled = false;
      lessonRecord.screenStates[index]=state;
      emit("select",{value:selected});
    };
  });
  el("hintBtn").onclick = () => hint(screen);
  el("submit").onclick = () => submitChoice(screen);
}

function submitChoice(screen){
  if(selected===null || selected===undefined) return;
  const state=currentState();
  const choice = screen.choices[selected];
  const good = choice.correct;
  const fb = el("feedback");
  emit("submit",{correct:good, value:selected, misconception:choice.misconception || null, evidence:choice.evidence || null});
  if(good){
    state.submittedCorrect=true;
    state.selected=selected;
    document.querySelectorAll(".choice").forEach((btn,i)=>{ btn.disabled = true; if(screen.choices[i].correct) btn.classList.add("correct"); });
    fb.style.display = "block"; fb.className = "feedback success";
    fb.innerHTML = `<strong>Correct.</strong>${choice.feedback ? "<br>"+choice.feedback : ""}`;
    state.feedback={className:fb.className,html:fb.innerHTML};
    lessonRecord.screenStates[index]=state; persist();
    setTimeout(next,900);
  } else {
    const h = screen.hints?.[Math.min(hintIndex, screen.hints.length-1)] || "Look at what the problem is asking you to find.";
    hintIndex++;
    state.hintIndex=hintIndex;
    fb.style.display = "block"; fb.className = "feedback warn";
    fb.innerHTML = `<strong>Look again.</strong><br>${h}`;
    state.feedback={className:fb.className,html:fb.innerHTML};
    document.querySelectorAll(".choice").forEach(btn=>{ btn.disabled = false; btn.classList.remove("selected","correct"); });
    selected = null; state.selected=null; el("submit").disabled = true;
    lessonRecord.screenStates[index]=state; persist(); emit("guided_retry",{hint:h});
  }
}

function hint(screen){
  const state=currentState();
  const h = screen.hints?.[Math.min(hintIndex, screen.hints.length-1)] || "Look at what the problem is asking you to find.";
  hintIndex++;
  state.hintIndex=hintIndex;
  const box = el("hintBox");
  box.style.display = "block"; box.innerHTML = `<strong>Hint</strong><br>${h}`;
  state.hintHtml=box.innerHTML;
  lessonRecord.screenStates[index]=state; persist(); emit("hint",{hint:h});
}

function next(){
  if(index < lesson.screens.length-1){
    if(index===0 && lessonRecord.status!=="completed") lessonRecord.status="in_progress";
    index++; lessonRecord.index=index; persist(); render();
  }
}
function back(){ if(index > 0){ index--; lessonRecord.index=index; persist(); render(); } }
function restart(){
  lessonRecord = newLessonAttempt(lessonRecord);
  analytics = createAnalytics();
  index = 0; selected=null; hintIndex=0;
  persist(); render();
}

el("analyticsBtn").onclick = () => { persist(); showAnalytics(lesson, analytics, index, pct(), getAllLessonRecords(), lessonSelect.options.length); };
el("closeAnalytics").onclick = () => { el("analyticsModal").style.display = "none"; el("analyticsModal").setAttribute("aria-hidden","true"); };
el("analyticsModal").onclick = e => { if(e.target.id==="analyticsModal"){ el("analyticsModal").style.display = "none"; el("analyticsModal").setAttribute("aria-hidden","true"); } };
el("themeBtn").onclick = function(){ dark=!dark; applyPreferences(); persistPreferences(); };
el("textBtn").onclick = function(){ big=!big; applyPreferences(); persistPreferences(); };
el("motionBtn").onclick = function(){ reduce=!reduce; applyPreferences(); persistPreferences(); };
lessonSelect.onchange = () => loadLesson(lessonSelect.value);

window.addEventListener("beforeunload", persist);
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "hidden") persist(); });

loadPreferences();
const savedLessonPath = getLastLessonPath();
if(savedLessonPath && [...lessonSelect.options].some(option => option.value === savedLessonPath)) lessonSelect.value = savedLessonPath;
loadLesson(lessonSelect.value);
