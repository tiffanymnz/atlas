// Exercise the actual learner DOM and click handlers. Device audio and layout
// still require browser/device checks; speech here is an observable test double.
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {Window} from "happy-dom";
import {applyTranslation} from "../engine/i18n/lessonLocale.js";

const root=new URL("../",import.meta.url);
const html=await readFile(new URL("apps/learner/index.html",root),"utf8");
let bootId=0;
async function ready(document){
  for(let i=0;i<300;i++){
    if(document.getElementById("lessonRoot").getAttribute("aria-busy")==="false") return;
    await new Promise(resolve=>setTimeout(resolve,2));
  }
  throw new Error("Lesson did not finish loading");
}
async function boot(language="en",storage,practice="runtime"){
  const window=new Window({url:`https://atlas.test/apps/learner/?practice=${practice}`,
    settings:{disableJavaScriptFileLoading:true,disableJavaScriptEvaluation:true,disableCSSFileLoading:true}});
  const spoken=[];
  window.speechSynthesis={paused:false,speaking:false,pending:false,getVoices:()=>[],cancel(){},resume(){},
    speak(utterance){spoken.push(utterance.text);utterance.onstart?.();queueMicrotask(()=>utterance.onend?.());}};
  window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  window.document.write(html);
  const localStorage=storage||window.localStorage;
  if(!storage) localStorage.setItem("atlas.preferences.v1",JSON.stringify({language}));
  const fetcher=async input=>{
    const path=new URL(String(input),window.location.href).pathname.slice(1);
    const body=await readFile(new URL(path,root),"utf8");
    return {ok:true,json:async()=>JSON.parse(body)};
  };
  Object.assign(globalThis,{window,document:window.document,localStorage,location:window.location,
    SpeechSynthesisUtterance:window.SpeechSynthesisUtterance,fetch:fetcher});
  await import(`../engine/lessonEngine.js?runtime=${++bootId}`);
  await ready(window.document);
  return {window,document:window.document,spoken,storage:localStorage};
}
function click(document,selector){
  const node=document.querySelector(selector);
  assert.ok(node,`Missing control ${selector}`);
  assert.equal(node.disabled,false,`Disabled control ${selector}`);
  node.click();
}

test("every picker lesson renders and completes through actual controls in both languages",async()=>{
  let screensChecked=0,lessonsChecked=0;
  for(const language of ["en","es"]){
    const {window,document,spoken}=await boot(language);
    const picker=document.getElementById("lessonSelect");
    const paths=Array.from(picker.options,option=>option.value);
    for(const path of paths){
      picker.value=path;picker.dispatchEvent(new window.Event("change"));await ready(document);
      const base=JSON.parse(await readFile(new URL(path.replace("../../",""),root),"utf8"));
      const lesson=language==="es"?applyTranslation(base,JSON.parse(await readFile(new URL(path.replace("../../","").replace("/lessons/","/translations/es/"),root),"utf8"))):base;
      for(const screen of lesson.screens){
        const title=document.querySelector("#screenTitle, #lessonRoot h1");
        assert.equal(title?.textContent,screen.title,`${language}/${path}/${screen.id}`);
        assert.equal(document.querySelectorAll('.choice[aria-checked="true"]').length,0,`Fresh screen has a selected answer: ${path}/${screen.id}`);
        if(screen.audio && document.getElementById("listenBtn")){
          const before=spoken.length;click(document,"#listenBtn");
          assert.equal(spoken.length,before+1,`Listen did not request speech: ${path}/${screen.id}`);
          assert.ok(spoken.at(-1).trim());await Promise.resolve();
        }
        if(screen.visual?.interactive){
          for(const dot of document.querySelectorAll(".countTap")) dot.click();
          assert.ok(document.querySelectorAll(".countTap.heard").length>0);
        }
        if(screen.choices){
          assert.equal(document.getElementById("submit").disabled,true);
          if(screen.hints?.length) click(document,"#hintBtn");
          const wrong=screen.choices.findIndex(choice=>!choice.correct);
          if(wrong>=0){
            click(document,`.choice[data-i="${wrong}"]`);click(document,"#submit");
            assert.equal(document.querySelectorAll('.choice[aria-checked="true"]').length,0);
            assert.equal(document.getElementById("submit").disabled,true);
          }
          const correct=screen.choices.findIndex(choice=>choice.correct);
          click(document,`.choice[data-i="${correct}"]`);click(document,"#submit");
          assert.equal(document.querySelectorAll(".choice.correct").length,1);
          assert.equal(document.getElementById("submit").disabled,false);
          click(document,"#submit");
        }else if(screen.type==="buildGroup"){
          let count=0;
          if(screen.targetCount===0){click(document,"#addDot");count=1;}
          click(document,"#checkGroup");
          assert.match(document.getElementById("feedback").className,/warn/);
          while(count<screen.targetCount){click(document,"#addDot");count++;}
          while(count>screen.targetCount){click(document,"#removeDot");count--;}
          click(document,"#checkGroup");
          assert.match(document.getElementById("feedback").className,/success/);
          click(document,"#checkGroup");
        }else if(screen.type!=="complete") click(document,"#nextBtn");
        screensChecked++;
      }
      click(document,"#analyticsBtn");
      const details=document.getElementById("analyticsDetails").textContent;
      if(lesson.concepts.primary_concept==="counting") assert.doesNotMatch(details,/subtraction|resta|Identified the gap/);
      click(document,"#closeAnalytics");
      click(document,"#newAttemptBtn");
      assert.equal(document.querySelector("#screenTitle").textContent,lesson.screens[0].title);
      lessonsChecked++;
    }
    await window.happyDOM.close();
  }
  assert.equal(lessonsChecked,68);
  assert.ok(screensChecked>800,`Only ${screensChecked} screens checked`);
});

test("refresh and language switching restore only the current attempt; new preview starts empty",async()=>{
  let app=await boot();
  click(app.document,"#nextBtn");click(app.document,"#nextBtn");
  click(app.document,'.choice[data-i="1"]');click(app.document,"#submit");
  const saved=app.storage;
  app=await boot("en",saved);
  assert.equal(app.document.querySelectorAll(".choice.correct").length,1);
  click(app.document,"#languageBtn");await ready(app.document);
  assert.equal(app.document.querySelectorAll(".choice.correct").length,1);
  assert.equal(app.document.documentElement.lang,"es");
  await app.window.happyDOM.close();
  app=await boot("es",saved,"another-run");
  assert.equal(app.document.querySelectorAll(".choice.correct").length,0);
  assert.match(app.document.getElementById("screenTitle").textContent,/1.*2.*3/);
  await app.window.happyDOM.close();
});

test("the actual Listen control reports speech failure and allows a successful retry",async()=>{
  const {window,document}=await boot();
  window.speechSynthesis.speak=()=>{throw new Error("device refused speech");};
  click(document,"#listenBtn");
  assert.equal(document.getElementById("audioStatus").hidden,false);
  assert.match(document.getElementById("audioStatus").textContent,/could not play/);
  assert.equal(document.getElementById("listenBtn").getAttribute("aria-pressed"),"false");
  window.speechSynthesis.speak=u=>{u.onstart?.();u.onend?.();};
  click(document,"#listenBtn");
  assert.equal(document.getElementById("audioStatus").hidden,true);
  assert.equal(document.getElementById("listenBtn").disabled,false);
  await window.happyDOM.close();
});
