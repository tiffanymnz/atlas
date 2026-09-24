import { renderConceptVisual, renderChoiceScreen, localizeChoiceState, renderLanguage, renderEquation, renderComplete } from "../sdk/components/lessonComponents.js?v=2.0";
import { createAnalytics, showAnalytics } from "./analytics-engine/analyticsEngine.js";
import { recommendNext } from "./recommendation-engine/recommendationEngine.js";
import { getPreferences, savePreferences, ensureLessonRecord, saveLessonRecord, getAllLessonRecords, archiveCompletedAttempt, newLessonAttempt, resolveLessonPosition, getLastLessonPath, saveLastLessonPath } from "./state-store/stateStore.js?v=1.5";
import { loadLocalizedLesson } from "./i18n/lessonLocale.js";

let lesson = null, lessonPath = null, index = 0, selected = null, hintIndex = 0;
let dark = false, big = false, reduce = false, language = "en";
let analytics = createAnalytics();
let lessonRecord = null;
let modalReturnFocus = null;

const root = document.getElementById("lessonRoot");
const lessonSelect = document.getElementById("lessonSelect");
const COPY={
  en:{language:"Español",dark:"Dark mode",light:"Light mode",bigger:"Bigger text",normal:"Normal text",reduce:"Reduce motion",allow:"Allow motion",summary:"Learning summary",memoryAssets:"Memory practice",progress:"Progress",progressBar:"Lesson progress",skip:"Skip to lesson",chooseLesson:"Choose a lesson",choices:"Answer choices",close:"Close",lesson:"Lesson",continue:"Continue",back:"Back",next:"Next",reflect:"Reflect",hint:"Hint",checkAnswer:"Check answer",correct:"Correct.",lookAgain:"Look again.",fallbackHint:"Look at what the problem is asking you to find.",start:"Start lesson",resume:"Resume lesson",review:"Review lesson",complete:"Complete",nextLesson:"Next lesson",reviewVisualGap:"Review visual gap",reviewModel:"Review the model",restartLesson:"Restart lesson",completed:"Completed",inProgress:"In progress"},
  es:{language:"English",dark:"Modo oscuro",light:"Modo claro",bigger:"Texto más grande",normal:"Texto normal",reduce:"Reducir movimiento",allow:"Permitir movimiento",summary:"Resumen de aprendizaje",memoryAssets:"Práctica de memoria",progress:"Progreso",progressBar:"Progreso de la lección",skip:"Saltar a la lección",chooseLesson:"Elige una lección",choices:"Opciones de respuesta",close:"Cerrar",lesson:"Lección",continue:"Continuar",back:"Atrás",next:"Siguiente",reflect:"Reflexionar",hint:"Pista",checkAnswer:"Comprobar respuesta",correct:"Correcto.",lookAgain:"Inténtalo de nuevo.",fallbackHint:"Observa lo que el problema te pide encontrar.",start:"Comenzar lección",resume:"Continuar lección",review:"Repasar lección",complete:"Completada",nextLesson:"Próxima lección",reviewVisualGap:"Repasar la diferencia visual",reviewModel:"Repasar el modelo",restartLesson:"Reiniciar lección",completed:"Completada",inProgress:"En progreso"}
};
function copy(){ return COPY[language]; }
function el(id){ return document.getElementById(id); }
function pct(){ return Math.round(index/(lesson.screens.length-1)*100); }
function current(){ return lesson.screens[index]; }
function screenStateKey(){ return current()?.id || String(index); }
function currentState(){
  lessonRecord.screenStates ||= {};
  const key=screenStateKey();
  lessonRecord.screenStates[key] ||= { selected:null, hintIndex:0, hintHtml:"", feedback:null, submittedCorrect:false };
  return lessonRecord.screenStates[key];
}
function syncAttemptEvents(){
  if(lessonRecord?.currentAttempt) lessonRecord.currentAttempt.events = analytics.events();
}
function persist(){
  if(!lesson || !lessonRecord) return;
  lessonRecord.index = index;
  lessonRecord.screenId = current()?.id || null;
  syncAttemptEvents();
  saveLessonRecord(lesson.metadata.id, lessonRecord);
}
function emit(type,payload={}){ analytics.record({type, screen:index, component:current()?.type, payload}); syncAttemptEvents(); persist(); }
function hasNextLesson(){ return lessonSelect.selectedIndex < lessonSelect.options.length - 1; }
function refreshLessonOptions(){
  const records=new Map(getAllLessonRecords().map(record=>[record.path,record]));
  for(const option of lessonSelect.options){
    const baseLabel=option.dataset[language] || option.dataset.en || option.textContent;
    const status=records.get(option.value)?.status;
    option.textContent=baseLabel+(status==="completed"?` — ${copy().completed}`:status==="in_progress"?` — ${copy().inProgress}`:"");
  }
}
function goToNextLesson(){ if(hasNextLesson()){ persist(); lessonSelect.selectedIndex += 1; loadLesson(lessonSelect.value); } }
function reviewVisualGap(){
  let target = lesson.screens.findIndex(screen => screen.visual && screen.visual.revealGap === true);
  if(target < 0) target = lesson.screens.findIndex(screen => screen.type === "observe" && screen.visual);
  index = target >= 0 ? target : Math.max(0, lesson.screens.length - 2);
  lessonRecord.index = index;
  emit("review_visual_gap", {target:index});
  render();
  focusLesson();
}
function focusLesson(){ root.focus({preventScroll:true}); }
function base(screen){ const progress=pct(); return `<span class="badge">${screen.label || screen.stage || copy().lesson}</span><div class="progress" role="progressbar" aria-label="${copy().progressBar}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="width:${progress}%"></span></div><h1 id="screenTitle">${screen.title}</h1>`; }

function applyPreferences(){
  document.body.setAttribute("data-theme",dark?"dark":"light");
  document.documentElement.style.setProperty("--scale",big?"1.12":"1");
  document.body.classList.toggle("reduce",reduce);
  document.documentElement.lang=language;
  el("languageBtn").textContent=copy().language;
  el("themeBtn").textContent=dark?copy().light:copy().dark;
  el("textBtn").textContent=big?copy().normal:copy().bigger;
  el("motionBtn").textContent=reduce?copy().allow:copy().reduce;
  el("themeBtn").setAttribute("aria-pressed",String(dark));
  el("textBtn").setAttribute("aria-pressed",String(big));
  el("motionBtn").setAttribute("aria-pressed",String(reduce));
  el("analyticsBtn").textContent=copy().summary;
  el("memoryAssetsLink").textContent=copy().memoryAssets;
  el("analyticsTitle").textContent=copy().summary;
  el("progressLabel").textContent=copy().progress;
  el("closeAnalytics").textContent=copy().close;
  el("skipLink").textContent=copy().skip;
  el("lessonSelectLabel").textContent=copy().chooseLesson;
  refreshLessonOptions();
}
function loadPreferences(){
  const prefs=getPreferences();
  dark=!!prefs.dark; big=!!prefs.big; reduce=!!prefs.reduce; language=prefs.language;
  applyPreferences();
}
function persistPreferences(){ savePreferences({dark,big,reduce,language}); }

async function loadLesson(path,{focus=true}={}){
  if(lesson && lessonRecord) persist();
  root.setAttribute("aria-busy","true");
  try{
    lesson = await loadLocalizedLesson(path,language);
    lessonPath = path;
    saveLastLessonPath(path);
    lessonRecord = ensureLessonRecord(lesson, path);
    index = resolveLessonPosition(lessonRecord,lesson);
    analytics = createAnalytics(lessonRecord.currentAttempt?.events || []);
    selected = null; hintIndex = 0;
    refreshLessonOptions();
    render();
  }finally{
    root.setAttribute("aria-busy","false");
  }
  if(focus) focusLesson();
}

function setCorrectControls(){
  const submit=el("submit"), hint=el("hintBtn");
  submit.textContent=copy().continue;
  submit.disabled=false;
  submit.onclick=next;
  hint.disabled=true;
}

function restoreChoiceState(screen){
  const state=currentState();
  const localized=localizeChoiceState(screen,state,copy());
  selected=state.selected;
  hintIndex=state.hintIndex || 0;
  if(selected !== null && selected !== undefined){
    const selectedBtn=document.querySelector(`.choice[data-i="${selected}"]`);
    if(selectedBtn){
      document.querySelectorAll(".choice").forEach(btn=>btn.tabIndex=-1);
      selectedBtn.classList.add("selected"); selectedBtn.setAttribute("aria-checked","true"); selectedBtn.tabIndex=0;
    }
    el("submit").disabled=false;
  }
  const hintBox=el("hintBox");
  if(localized.hintHtml){ hintBox.style.display="block"; hintBox.innerHTML=localized.hintHtml; }
  const fb=el("feedback");
  if(localized.feedback){
    fb.style.display="block";
    fb.className=localized.feedback.className;
    fb.innerHTML=localized.feedback.html;
  }
  if(state.submittedCorrect){
    document.querySelectorAll(".choice").forEach((btn,i)=>{
      btn.disabled=true;
      if(screen.choices[i].correct) btn.classList.add("correct");
      btn.classList.remove("selected");
      btn.setAttribute("aria-checked",String(i===state.selected));
    });
    setCorrectControls();
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
  refreshLessonOptions();
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
    const label = lessonRecord.status==="in_progress" ? copy().resume : lessonRecord.status==="completed" ? copy().review : copy().start;
    root.innerHTML = base(screen)+body+callout+`<button class="btn primary" type="button" id="nextBtn">${label}</button>`;
    el("nextBtn").onclick = next; return;
  }
  if(screen.type==="observe"){
    root.innerHTML = base(screen)+renderConceptVisual(screen.visual,screen.title)+`<div class="toolbar"><button class="btn secondary" type="button" id="backBtn">${copy().back}</button><button class="btn primary" type="button" id="nextBtn">${screen.nextLabel || copy().next}</button></div>`;
    el("backBtn").onclick = back; el("nextBtn").onclick = next; return;
  }
  if(["misconception","discover","symbol","guidedPractice","independentPractice","recall","transfer","reflection"].includes(screen.type)){
    const visual = screen.visual ? renderConceptVisual(screen.visual,screen.title) : `<p>${screen.prompt || ""}</p>`;
    root.innerHTML = base(screen)+visual+renderChoiceScreen(screen,copy());
    bindChoiceScreen(screen); restoreChoiceState(screen); return;
  }
  if(screen.type==="language"){
    root.innerHTML = base(screen)+renderConceptVisual(screen.visual,screen.title)+renderLanguage(screen)+`<div class="coach" style="display:block">${screen.guidance}</div><div class="toolbar"><button class="btn secondary" type="button" id="backBtn">${copy().back}</button><button class="btn primary" type="button" id="nextBtn">${copy().next}</button></div>`;
    el("backBtn").onclick = back; el("nextBtn").onclick = next; return;
  }
  if(screen.type==="memoryHook"){
    const steps=screen.rebuildSteps?.length?`<ol>${screen.rebuildSteps.map(step=>`<li>${step}</li>`).join("")}</ol>`:"";
    const boundary=screen.boundary?`<p class="boundary"><strong>${screen.boundaryLabel||"Boundary"}:</strong> ${screen.boundary}</p>`:"";
    root.innerHTML = base(screen)+`<div class="coach" style="display:block"><strong>${screen.hook}</strong><br>${screen.body}${steps}${boundary}</div><div class="toolbar"><button class="btn secondary" type="button" id="backBtn">${copy().back}</button><button class="btn primary" type="button" id="nextBtn">${copy().next}</button></div>`;
    el("backBtn").onclick = back; el("nextBtn").onclick = next; return;
  }
  if(screen.type==="equationReveal"){
    root.innerHTML = base(screen)+renderConceptVisual(screen.visual,screen.title)+renderEquation(screen)+`<div class="toolbar"><button class="btn secondary" type="button" id="backBtn">${copy().back}</button><button class="btn primary" type="button" id="nextBtn">${copy().reflect}</button></div>`;
    el("backBtn").onclick = back; el("nextBtn").onclick = next; return;
  }
  if(screen.type==="complete"){
    markCompleted();
    const hasNext = hasNextLesson();
    const completionCopy={...copy()};
    if(!lesson.screens.some(item=>item.visual?.revealGap === true)) completionCopy.reviewVisualGap=copy().reviewModel;
    root.innerHTML = renderComplete(screen, recommendNext(lesson, analytics.summary(), screen, hasNext,language), hasNext,completionCopy);
    el("restartBtn").onclick = restart;
    const reviewBtn = el("reviewBtn");
    if(reviewBtn) reviewBtn.onclick = reviewVisualGap;
    const nextBtn = el("nextLessonBtn");
    if(nextBtn) nextBtn.onclick = goToNextLesson;
  }
}

function bindChoiceScreen(screen){
  const buttons=[...document.querySelectorAll(".choice")];
  buttons.forEach((btn,buttonIndex)=>{
    btn.onclick = () => {
      const state=currentState();
      if(state.submittedCorrect) return;
      selected = Number(btn.dataset.i);
      state.selected=selected;
      buttons.forEach(b=>{ b.classList.remove("selected"); b.setAttribute("aria-checked","false"); b.tabIndex=-1; });
      btn.classList.add("selected");
      btn.setAttribute("aria-checked","true");
      btn.tabIndex=0;
      el("submit").disabled = false;
      lessonRecord.screenStates[screenStateKey()]=state;
      emit("select",{value:selected});
    };
    btn.onkeydown = event => {
      const keys=["ArrowDown","ArrowRight","ArrowUp","ArrowLeft","Home","End"];
      if(!keys.includes(event.key)) return;
      event.preventDefault();
      let target=buttonIndex;
      if(event.key==="Home") target=0;
      else if(event.key==="End") target=buttons.length-1;
      else if(event.key==="ArrowDown"||event.key==="ArrowRight") target=(buttonIndex+1)%buttons.length;
      else target=(buttonIndex-1+buttons.length)%buttons.length;
      buttons[target].click();
      buttons[target].focus();
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
    document.querySelectorAll(".choice").forEach((btn,i)=>{ btn.disabled = true; btn.setAttribute("aria-checked",String(i===selected)); if(screen.choices[i].correct) btn.classList.add("correct"); });
    fb.style.display = "block"; fb.className = "feedback success";
    fb.innerHTML = `<strong>${copy().correct}</strong>${choice.feedback ? "<br>"+choice.feedback : ""}`;
    state.feedback={kind:"success"};
    lessonRecord.screenStates[screenStateKey()]=state; persist(); setCorrectControls();
  } else {
    const h = screen.hints?.[Math.min(hintIndex, screen.hints.length-1)] || copy().fallbackHint;
    hintIndex++;
    state.hintIndex=hintIndex;
    fb.style.display = "block"; fb.className = "feedback warn";
    fb.innerHTML = `<strong>${copy().lookAgain}</strong><br>${h}`;
    state.feedbackHintIndex=Math.max(hintIndex-1,0);
    state.feedback={kind:"warning"};
    document.querySelectorAll(".choice").forEach(btn=>{ btn.disabled = false; btn.classList.remove("selected","correct"); btn.setAttribute("aria-checked","false"); });
    selected = null; state.selected=null; el("submit").disabled = true;
    lessonRecord.screenStates[screenStateKey()]=state; persist(); emit("guided_retry",{hint:h});
  }
}

function hint(screen){
  const state=currentState();
  const usedIndex=hintIndex;
  const h = screen.hints?.[Math.min(usedIndex, screen.hints.length-1)] || copy().fallbackHint;
  hintIndex++;
  state.hintIndex=hintIndex;
  const box = el("hintBox");
  box.style.display = "block"; box.innerHTML = `<strong>${copy().hint}</strong><br>${h}`;
  state.hintShown=true;
  state.hintStep=usedIndex;
  state.hintHtml="";
  lessonRecord.screenStates[screenStateKey()]=state; persist(); emit("hint",{hint:h});
}

function next(){
  if(index < lesson.screens.length-1){
    if(index===0 && lessonRecord.status!=="completed") lessonRecord.status="in_progress";
    index++; lessonRecord.index=index; persist(); refreshLessonOptions(); render(); focusLesson();
  }
}
function back(){ if(index > 0){ index--; lessonRecord.index=index; persist(); render(); focusLesson(); } }
function restart(){
  lessonRecord = newLessonAttempt(lessonRecord);
  analytics = createAnalytics();
  index = 0; selected=null; hintIndex=0;
  persist(); refreshLessonOptions(); render(); focusLesson();
}

function closeAnalytics(){
  const modal=el("analyticsModal");
  if(modal.getAttribute("aria-hidden")==="true") return;
  modal.style.display="none";
  modal.setAttribute("aria-hidden","true");
  modalReturnFocus?.focus?.();
}
el("analyticsBtn").onclick = () => {
  persist();
  modalReturnFocus=document.activeElement;
  showAnalytics(lesson, analytics, index, pct(), getAllLessonRecords(), language);
  el("closeAnalytics").focus();
};
el("closeAnalytics").onclick = closeAnalytics;
el("analyticsModal").onclick = e => { if(e.target.id==="analyticsModal") closeAnalytics(); };
el("analyticsModal").onkeydown = event => {
  if(event.key==="Escape"){ event.preventDefault(); closeAnalytics(); return; }
  if(event.key!=="Tab") return;
  const focusable=[...el("analyticsModal").querySelectorAll("button,[href],select,textarea,input,[tabindex]:not([tabindex='-1'])")].filter(item=>!item.disabled);
  if(!focusable.length) return;
  const first=focusable[0],last=focusable[focusable.length-1];
  if(event.shiftKey&&document.activeElement===first){ event.preventDefault(); last.focus(); }
  else if(!event.shiftKey&&document.activeElement===last){ event.preventDefault(); first.focus(); }
};
el("themeBtn").onclick = function(){ dark=!dark; applyPreferences(); persistPreferences(); };
el("textBtn").onclick = function(){ big=!big; applyPreferences(); persistPreferences(); };
el("motionBtn").onclick = function(){ reduce=!reduce; applyPreferences(); persistPreferences(); };
el("languageBtn").onclick = async function(){ language=language==="en"?"es":"en"; persistPreferences(); applyPreferences(); await loadLesson(lessonPath||lessonSelect.value); };
lessonSelect.onchange = () => loadLesson(lessonSelect.value);

window.addEventListener("beforeunload", persist);
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "hidden") persist(); });

loadPreferences();
const savedLessonPath = getLastLessonPath();
if(savedLessonPath && [...lessonSelect.options].some(option => option.value === savedLessonPath)) lessonSelect.value = savedLessonPath;
loadLesson(lessonSelect.value,{focus:false});
