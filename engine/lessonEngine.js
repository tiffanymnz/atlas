import { renderConceptVisual, renderChoiceScreen, localizeChoiceState, renderLanguage, renderEquation, renderComplete } from "../sdk/components/lessonComponents.js?v=2.9";
import { createAnalytics, showAnalytics } from "./analytics-engine/analyticsEngine.js";
import { recommendNext } from "./recommendation-engine/recommendationEngine.js";
import { assessNextLessonReadiness } from "./recommendation-engine/readiness.js";
import { nextTeachingOption } from "./recommendation-engine/lessonSequence.js";
import { getPreferences, savePreferences, ensureLessonRecord, saveLessonRecord, getAllLessonRecords, reviewSuggested, archiveCompletedAttempt, newLessonAttempt, resolveLessonPosition, getLastLessonPath, saveLastLessonPath } from "./state-store/stateStore.js?v=1.7";
import { loadLocalizedLesson } from "./i18n/lessonLocale.js";
import { createRecordedNarration, recordedNarrationUrl } from "./recordedNarration.js";
import {bundledAudioUrls,countingAudioParts} from "./countingAudio.js?v=2";

import { createSpeechPlayback } from "./speechPlayback.js";

const narration=createRecordedNarration();
const speech=createSpeechPlayback({synthesis:window.speechSynthesis,
  makeUtterance:typeof window.SpeechSynthesisUtterance==="function"?text=>new window.SpeechSynthesisUtterance(text):null});

let lesson = null, lessonPath = null, index = 0, selected = null, hintIndex = 0;
let dark = false, big = false, reduce = false, language = "en";
let analytics = createAnalytics();
let lessonRecord = null;
let modalReturnFocus = null;

const root = document.getElementById("lessonRoot");
const lessonSelect = document.getElementById("lessonSelect");
const COPY={
  en:{language:"Español",dark:"Dark mode",light:"Light mode",bigger:"Bigger text",normal:"Normal text",reduce:"Reduce motion",allow:"Allow motion",summary:"Learning summary",memoryAssets:"Memory practice",progress:"Progress",progressBar:"Lesson progress",skip:"Skip to lesson",chooseLesson:"Choose a lesson",choices:"Answer choices",close:"Close",lesson:"Lesson",continue:"Continue",back:"Back",next:"Next",reflect:"Reflect",hint:"Hint",checkAnswer:"Check answer",correct:"Correct.",lookAgain:"Look again.",fallbackHint:"Look at what the problem is asking you to find.",start:"Start lesson",resume:"Resume lesson",review:"Review lesson",complete:"Complete",nextLesson:"Next lesson",reviewVisualGap:"Review visual gap",reviewModel:"Review the model",restartLesson:"Restart lesson",newAttempt:"Try lesson again (new answers)",completed:"Completed",inProgress:"In progress",listen:"Listen",hearNumber:"Hear number",stopAudio:"Stop audio",audioUnavailable:"Audio unavailable",choice:"Choice",addDot:"Add a dot",removeDot:"Remove a dot",checkGroup:"Check my dots",groupCount:"Dots in your box"},
  es:{language:"English",dark:"Modo oscuro",light:"Modo claro",bigger:"Texto más grande",normal:"Texto normal",reduce:"Reducir movimiento",allow:"Permitir movimiento",summary:"Resumen de aprendizaje",memoryAssets:"Práctica de memoria",progress:"Progreso",progressBar:"Progreso de la lección",skip:"Saltar a la lección",chooseLesson:"Elige una lección",choices:"Opciones de respuesta",close:"Cerrar",lesson:"Lección",continue:"Continuar",back:"Atrás",next:"Siguiente",reflect:"Reflexionar",hint:"Pista",checkAnswer:"Comprobar respuesta",correct:"Correcto.",lookAgain:"Inténtalo de nuevo.",fallbackHint:"Observa lo que el problema te pide encontrar.",start:"Comenzar lección",resume:"Continuar lección",review:"Repasar lección",complete:"Completada",nextLesson:"Próxima lección",reviewVisualGap:"Repasar la diferencia visual",reviewModel:"Repasar el modelo",restartLesson:"Reiniciar lección",newAttempt:"Intentar de nuevo (respuestas nuevas)",completed:"Completada",inProgress:"En progreso",listen:"Escuchar",hearNumber:"Escuchar número",stopAudio:"Detener audio",audioUnavailable:"Audio no disponible",choice:"Opción",addDot:"Agregar un punto",removeDot:"Quitar un punto",checkGroup:"Comprobar mis puntos",groupCount:"Puntos en tu recuadro"}
};
function copy(){ return COPY[language]; }
function el(id){ return document.getElementById(id); }
function pct(){ return Math.round(index/(lesson.screens.length-1)*100); }
function current(){ return lesson.screens[index]; }
function screenStateKey(){ return current()?.id || String(index); }
function currentState(){
  lessonRecord.screenStates ||= {};
  const key=screenStateKey();
  const revision=current()?.revision || 1;
  if(lessonRecord.screenStates[key] && revision>1 && lessonRecord.screenStates[key].revision!==revision){
    lessonRecord.screenStates[key]={selected:null,hintIndex:0,hintHtml:"",feedback:null,submittedCorrect:false,revision};
  }
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
function hasNextLesson(){
  return !!nextTeachingOption(lesson,lessonSelect.options,lessonSelect.selectedIndex);
}
function refreshLessonOptions(){
  const records=new Map(getAllLessonRecords().map(record=>[record.path,record]));
  for(const option of lessonSelect.options){
    const baseLabel=option.dataset[language] || option.dataset.en || option.textContent;
    const status=records.get(option.value)?.status;
    const suggestion=option.dataset.review && reviewSuggested(records.get(option.dataset.reviewSource || "../../curriculum/lessons/lesson000p.json"),records.get(option.value));
    option.textContent=baseLabel+(suggestion?(language==="es"?" — Para hoy":" — Ready today"):status==="completed"?` — ${copy().completed}`:status==="in_progress"?` — ${copy().inProgress}`:"");
  }
  el("newAttemptBtn").hidden = lessonRecord?.status!=="completed";
}
function goToNextLesson(){ const next=nextTeachingOption(lesson,lessonSelect.options,lessonSelect.selectedIndex); if(next){ persist(); lessonSelect.value=next.value; loadLesson(next.value); } }
function reviewVisualGap(){
  stopCountingAudio();
  let target = lesson.screens.findIndex(screen => screen.visual && screen.visual.revealGap === true);
  if(target < 0) target = lesson.screens.findIndex(screen => screen.type === "observe" && screen.visual);
  index = target >= 0 ? target : Math.max(0, lesson.screens.length - 2);
  lessonRecord.index = index;
  emit("review_visual_gap", {target:index});
  render();
  focusLesson();
}
function focusLesson(){ root.focus({preventScroll:true}); }
function numberOnlyAudio(){ return lesson?.metadata?.audioStrategy==="number_words_only"; }
function shortGuidanceAudio(){ return lesson?.metadata?.audioStrategy==="short_guidance"; }
function isNumberModel(screen){ return screen?.type==="observe" && screen.visual?.kind==="countingDots" && Number.isInteger(screen.visual.count) && (screen.visual.numbered || screen.visual.count===0); }
function audioButton(screen){
  if(numberOnlyAudio() && !isNumberModel(screen) && !recordedNarrationUrl(screen,language,import.meta.url)) return "";
  const label=numberOnlyAudio() && isNumberModel(screen)?copy().hearNumber:copy().listen;
  return `<button class="btn listenBtn" type="button" id="listenBtn" aria-pressed="false">🔊 ${label}</button>`;
}
function base(screen){ const progress=pct(); return `<div class="screenTools"><span class="badge">${screen.label || screen.stage || copy().lesson}</span>${audioButton(screen)}</div><p id="audioStatus" role="status" hidden></p><div class="progress" role="progressbar" aria-label="${copy().progressBar}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="width:${progress}%"></span></div><h1 id="screenTitle">${screen.title}</h1>`; }
const NUMBER_WORDS={en:["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen","twenty"],es:["cero","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez","once","doce","trece","catorce","quince","dieciséis","diecisiete","dieciocho","diecinueve","veinte"]};
function reportAudioError(){
  resetListenButton();
  const status=el("audioStatus");
  if(status){status.hidden=false;status.textContent=language==="es"
    ?"No se pudo reproducir el audio. Toca Escuchar para intentarlo de nuevo."
    :"Audio could not play. Tap Listen to try again.";}
  const countStatus=el("countSpeech");
  if(countStatus) countStatus.textContent=language==="es"?"No se pudo reproducir el audio.":"Audio could not play.";
}
function playSpeech(text,numberOnly=false){
  narration.stop();
  const status=el("audioStatus");if(status) status.hidden=true;
  const button=el("listenBtn");
  if(button){button.textContent=`■ ${copy().stopAudio}`;button.setAttribute("aria-pressed","true");}
  const clips=bundledAudioUrls([text],language,import.meta.url);
  if(clips){speech.stop();void narration.play(clips,resetListenButton,reportAudioError);return;}
  speech.play(text,language,{numberOnly,onFinish:resetListenButton,onError:reportAudioError});
}
function screenSpeechText(screen){
  if(numberOnlyAudio() && isNumberModel(screen)) return NUMBER_WORDS[language][screen.visual.count];
  if(shortGuidanceAudio()){
    const support=[el("hintBox"),el("feedback")].filter(node=>node&&node.style.display==="block").map(node=>node.textContent.trim());
    return [screen.audio,...support].filter(Boolean).join(". ");
  }
  const parts=[screen.audio || [screen.title,screen.body,screen.prompt,screen.visual?.message,screen.hook].filter(Boolean).join(". ")];
  if(screen.choices?.length) parts.push(screen.choices.map((choice,index)=>`${copy().choice} ${index+1}: ${choice.text}`).join(". "));
  const visibleSupport=[el("hintBox"),el("feedback")].filter(node=>node&&node.style.display==="block").map(node=>node.textContent.trim()).filter(Boolean);
  return [...parts,...visibleSupport].filter(Boolean).join(". ");
}
function resetListenButton(){
  const button=el("listenBtn");
  if(!button) return;
  button.textContent=`🔊 ${numberOnlyAudio() && isNumberModel(lesson?.screens[index])?copy().hearNumber:copy().listen}`;
  button.setAttribute("aria-pressed","false");
}
function bindScreenAudio(screen){
  const button=el("listenBtn");
  if(!button) return;
  const recording=recordedNarrationUrl(screen,language,import.meta.url);
  const clipsForScreen=()=>numberOnlyAudio()&&isNumberModel(screen)
    ?bundledAudioUrls([NUMBER_WORDS[language][screen.visual.count]],language,import.meta.url)
    :shortGuidanceAudio()?bundledAudioUrls(countingAudioParts(screen,currentState()),language,import.meta.url):null;
  if(recording||clipsForScreen()){
    button.onclick=()=>{
      if(narration.playing){ narration.stop(); resetListenButton(); return; }
      stopCountingAudio();
      const status=el("audioStatus");if(status) status.hidden=true;
      button.textContent=`■ ${copy().stopAudio}`;
      button.setAttribute("aria-pressed","true");
      narration.play(recording?[recording]:clipsForScreen(),resetListenButton,()=>{
        reportAudioError();
      });
    };
    return;
  }
  const canSpeak="speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  if(!canSpeak){
    button.disabled=true;
    reportAudioError();
    button.textContent=copy().audioUnavailable;
    const status=el("audioStatus");if(status) status.textContent=language==="es"?"El audio no está disponible en este navegador.":"Audio is unavailable in this browser.";
    return;
  }
  button.onclick=()=>{
    if(speech.playing){
      narration.stop();
      speech.stop();
      resetListenButton();
      return;
    }
    button.textContent=`■ ${copy().stopAudio}`;
    button.setAttribute("aria-pressed","true");
    playSpeech(screenSpeechText(screen),numberOnlyAudio());
  };
}
function bindCountingAudio(){
  const taps=[...root.querySelectorAll(".countTap")];
  if(!taps.length) return;
  let nextNumber=1;
  const canSpeak="speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  if(!canSpeak&&!bundledAudioUrls([NUMBER_WORDS[language][0]],language,import.meta.url)) el("countSpeech").textContent=language==="es"?"Toca un punto para ver su número.":"Tap a dot to see its number.";
  for(const tap of taps){
    const number=Number(tap.dataset.count);
    const word=NUMBER_WORDS[language][number];
    tap.setAttribute("aria-label",`${number}, ${word}`);
    tap.onclick=()=>{
      if(number===1 && nextNumber>taps.length){
        for(const button of taps) button.classList.remove("heard");
        nextNumber=1;
      }
      if(number!==nextNumber){
        const expected=NUMBER_WORDS[language][nextNumber];
        el("countSpeech").textContent=language==="es"?`Sigue con ${nextNumber} — ${expected}.`:`Next, tap ${nextNumber} — ${expected}.`;
        return;
      }
      tap.classList.add("heard");
      nextNumber++;
      const complete=nextNumber>taps.length;
      el("countSpeech").textContent=complete
        ? language==="es"?number===1?"1 — uno. Hay un punto.":`${number} — ${word}. Hay ${word} puntos.`
          :number===1?"1 — one. There is one dot.":`${number} — ${word}. There are ${word} dots.`
        : `${number} — ${word}`;
      resetListenButton();
      playSpeech(word,true);
    };
  }
}
function stopCountingAudio(){ narration.stop(); speech.stop(); }

function buildCount(state,limit){
  return Number.isInteger(state.builtCount)?Math.min(limit,Math.max(0,state.builtCount)):0;
}
function buildLimit(target){ return Math.min(20,Math.max(10,target+2)); }
function renderBuildGroup(screen){
  const state=currentState(), limit=buildLimit(screen.targetCount), count=buildCount(state,limit);
  state.builtCount=count;
  const finished=state.submittedCorrect===true;
  const visual={kind:"countingDots",count,grouped:true,layout:count>10?"tenRows":undefined,firstLabel:language==="es"?"Primeros diez":"First ten",moreLabel:language==="es"?"Más puntos":"More dots",ariaLabel:`${copy().groupCount}: ${count}`,message:`${copy().groupCount}: ${count}`};
  root.innerHTML=base(screen)+renderConceptVisual(visual,screen.title)+
    `<div class="toolbar"><button class="btn secondary" type="button" id="removeDot" ${count===0||finished?"disabled":""}>${copy().removeDot}</button><button class="btn secondary" type="button" id="addDot" ${count===limit||finished?"disabled":""}>${copy().addDot}</button></div>`+
    `<div class="toolbar"><button class="btn secondary" type="button" id="hintBtn" ${finished?"disabled":""}>${copy().hint}</button><button class="btn primary" type="button" id="checkGroup">${finished?copy().continue:copy().checkGroup}</button></div>`+
    `<div class="hint" id="hintBox" role="note" aria-live="polite"></div><div class="feedback" id="feedback" role="status" aria-live="polite" aria-atomic="true"></div>`;
  bindScreenAudio(screen);
  if(state.hintShown){const box=el("hintBox");box.style.display="block";box.textContent=screen.hints?.[Math.min(Math.max((state.hintIndex||1)-1,0),screen.hints.length-1)]||"";}
  if(state.feedback){const box=el("feedback");box.style.display="block";box.className=`feedback ${finished?"success":"warn"}`;const detail=finished?screen.correctFeedback:count>screen.targetCount?(screen.tooManyFeedback||screen.wrongFeedback):count<screen.targetCount?(screen.tooFewFeedback||screen.wrongFeedback):screen.wrongFeedback;box.textContent=`${finished?copy().correct:copy().lookAgain} ${detail}`;}
  el("removeDot").onclick=()=>changeBuildGroup(-1);
  el("addDot").onclick=()=>changeBuildGroup(1);
  el("hintBtn").onclick=()=>{
    const step=Math.min(state.hintIndex||0,screen.hints.length-1);
    state.hintIndex=(state.hintIndex||0)+1;state.hintShown=true;
    persist();emit("hint",{hint:screen.hints[step]});renderBuildGroup(screen);
    el("hintBtn").focus();
    if(shortGuidanceAudio()) playSpeech(screen.hints[step]);
  };
  el("checkGroup").onclick=()=>{
    if(finished){next();return;}
    const good=count===screen.targetCount;
    state.feedback={kind:good?"success":"warning"};state.submittedCorrect=good;
    emit("submit",{correct:good,evidence:good?"constructed_group":null});
    renderBuildGroup(screen);el("checkGroup").focus();
    if(shortGuidanceAudio()){
      const detail=good?screen.correctFeedback:count>screen.targetCount?(screen.tooManyFeedback||screen.wrongFeedback):
        count<screen.targetCount?(screen.tooFewFeedback||screen.wrongFeedback):screen.wrongFeedback;
      if(detail) playSpeech(detail);
    }
  };
}
function changeBuildGroup(delta){
  const screen=current(),state=currentState();
  if(state.submittedCorrect) return;
  const limit=buildLimit(screen.targetCount);
  const count=buildCount(state,limit),nextCount=Math.min(limit,Math.max(0,count+delta));
  if(count===nextCount) return;
  state.builtCount=nextCount;state.feedback=null;persist();emit("build_group",{count:nextCount});
  renderBuildGroup(screen);
  const control=el(delta>0?"addDot":"removeDot");
  (control.disabled?el(delta>0?"removeDot":"addDot"):control).focus();
  resetListenButton();
  playSpeech(NUMBER_WORDS[language][nextCount],true);
}

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
  el("newAttemptBtn").textContent=copy().newAttempt;
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
  stopCountingAudio();
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
  if(state.hintShown && el("supportModel")) el("supportModel").hidden=false;
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
    bindScreenAudio(screen);
    el("nextBtn").onclick = next; return;
  }
  if(screen.type==="observe"){
    root.innerHTML = base(screen)+renderConceptVisual(screen.visual,screen.title)+`<div class="toolbar"><button class="btn secondary" type="button" id="backBtn">${copy().back}</button><button class="btn primary" type="button" id="nextBtn">${screen.nextLabel || copy().next}</button></div>`;
    bindScreenAudio(screen);
    bindCountingAudio();
    el("backBtn").onclick = back; el("nextBtn").onclick = next; return;
  }
  if(screen.type==="buildGroup"){renderBuildGroup(screen);return;}
  if(["count","misconception","discover","symbol","guidedPractice","independentPractice","recall","transfer","reflection"].includes(screen.type)){
    const visual = screen.visual ? `${screen.prompt?`<p>${screen.prompt}</p>`:""}${renderConceptVisual(screen.visual,screen.title)}` : `<p>${screen.prompt || ""}</p>`;
    const support=screen.supportVisual?`<div id="supportModel" hidden>${renderConceptVisual(screen.supportVisual,screen.title)}</div>`:"";
    root.innerHTML = base(screen)+visual+support+renderChoiceScreen(screen,copy());
    bindScreenAudio(screen);
    bindChoiceScreen(screen); restoreChoiceState(screen); return;
  }
  if(screen.type==="language"){
    root.innerHTML = base(screen)+renderConceptVisual(screen.visual,screen.title)+renderLanguage(screen)+`<div class="coach" style="display:block">${screen.guidance}</div><div class="toolbar"><button class="btn secondary" type="button" id="backBtn">${copy().back}</button><button class="btn primary" type="button" id="nextBtn">${copy().next}</button></div>`;
    bindScreenAudio(screen);
    el("backBtn").onclick = back; el("nextBtn").onclick = next; return;
  }
  if(screen.type==="memoryHook"){
    const steps=screen.rebuildSteps?.length?`<ol>${screen.rebuildSteps.map(step=>`<li>${step}</li>`).join("")}</ol>`:"";
    const boundary=screen.boundary?`<p class="boundary"><strong>${screen.boundaryLabel||"Boundary"}:</strong> ${screen.boundary}</p>`:"";
    root.innerHTML = base(screen)+`<div class="coach" style="display:block"><strong>${screen.hook}</strong><br>${screen.body}${steps}${boundary}</div><div class="toolbar"><button class="btn secondary" type="button" id="backBtn">${copy().back}</button><button class="btn primary" type="button" id="nextBtn">${copy().next}</button></div>`;
    bindScreenAudio(screen);
    el("backBtn").onclick = back; el("nextBtn").onclick = next; return;
  }
  if(screen.type==="equationReveal"){
    root.innerHTML = base(screen)+renderConceptVisual(screen.visual,screen.title)+renderEquation(screen)+`<div class="toolbar"><button class="btn secondary" type="button" id="backBtn">${copy().back}</button><button class="btn primary" type="button" id="nextBtn">${copy().reflect}</button></div>`;
    bindScreenAudio(screen);
    el("backBtn").onclick = back; el("nextBtn").onclick = next; return;
  }
  if(screen.type==="complete"){
    markCompleted();
    const hasNext = hasNextLesson();
    const readiness=assessNextLessonReadiness(lesson,analytics.events());
    const completionCopy={...copy()};
    if(!lesson.screens.some(item=>item.visual?.revealGap === true)) completionCopy.reviewVisualGap=copy().reviewModel;
    const recommendation=readiness.ready
      ? recommendNext(lesson, analytics.summary(), screen, hasNext,language)
      : language==="es"
        ? "Terminaste la lección. Repasa y vuelve a intentarlo: las prácticas independiente, de recuerdo y de transferencia deben resolverse correctamente sin pistas ni intentos previos. Esto no prueba comprensión por sí solo."
        : "You finished the lesson. Review and try again: independent practice, recall, and transfer need correct first answers without hints. This alone does not prove understanding.";
    root.innerHTML = `<div class="screenTools">${audioButton()}</div><p id="audioStatus" role="status" hidden></p>`+renderComplete(screen,recommendation,hasNext&&readiness.ready,completionCopy);
    bindScreenAudio(screen);
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
      if(shortGuidanceAudio() && screen.speakChoices!==false){
        playSpeech(screen.choices[selected].text);
      }
      state.selected=selected;
      if(state.feedback?.kind==="warning"){state.feedback=null;el("feedback").style.display="none";}
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
    if(shortGuidanceAudio()&&choice.feedback) playSpeech(choice.feedback);
  } else {
    const h = screen.hints?.[Math.min(hintIndex, screen.hints.length-1)] || copy().fallbackHint;
    const diagnostic=choice.feedback || h;
    hintIndex++;
    state.hintIndex=hintIndex;
    fb.style.display = "block"; fb.className = "feedback warn";
    fb.innerHTML = `<strong>${copy().lookAgain}</strong><br>${diagnostic}`;
    state.wrongChoiceIndex=selected;
    state.feedbackHintIndex=Math.max(hintIndex-1,0);
    state.feedback={kind:"warning"};
    document.querySelectorAll(".choice").forEach(btn=>{ btn.disabled = false; btn.classList.remove("selected","correct"); btn.setAttribute("aria-checked","false"); });
    selected = null; state.selected=null; el("submit").disabled = true;
    lessonRecord.screenStates[screenStateKey()]=state; persist(); emit("guided_retry",{hint:h});
    if(shortGuidanceAudio()) playSpeech(diagnostic);
  }
}

function hint(screen){
  const state=currentState();
  const usedIndex=hintIndex;
  const h = screen.hints?.[Math.min(usedIndex, screen.hints.length-1)] || copy().fallbackHint;
  hintIndex++;
  state.hintIndex=hintIndex;
  const box = el("hintBox");
  if(el("supportModel")) el("supportModel").hidden=false;
  box.style.display = "block"; box.innerHTML = `<strong>${copy().hint}</strong><br>${h}`;
  state.hintShown=true;
  state.hintStep=usedIndex;
  state.hintHtml="";
  lessonRecord.screenStates[screenStateKey()]=state; persist(); emit("hint",{hint:h});
  if(shortGuidanceAudio()) playSpeech(h);
}

function next(){
  if(index < lesson.screens.length-1){
    stopCountingAudio();
    if(index===0 && lessonRecord.status!=="completed") lessonRecord.status="in_progress";
    index++; lessonRecord.index=index; persist(); refreshLessonOptions(); render(); focusLesson();
  }
}
function back(){ if(index > 0){ stopCountingAudio(); index--; lessonRecord.index=index; persist(); render(); focusLesson(); } }
function restart(){
  stopCountingAudio();
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
el("newAttemptBtn").onclick = restart;

window.addEventListener("beforeunload", persist);
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "hidden"){persist();stopCountingAudio();resetListenButton();} });

loadPreferences();
const savedLessonPath = getLastLessonPath();
if(savedLessonPath && [...lessonSelect.options].some(option => option.value === savedLessonPath)) lessonSelect.value = savedLessonPath;
loadLesson(lessonSelect.value,{focus:false});
