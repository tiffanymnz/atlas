import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {applyTranslation} from "../engine/i18n/lessonLocale.js";
import {renderCountingDots} from "../sdk/components/lessonComponents.js";

const names=["lesson005.json","lesson006.json","lesson007.json","lesson008.json","lesson009.json","lesson010.json","lesson011.json"];
const read=path=>JSON.parse(fs.readFileSync(new URL(`../${path}`,import.meta.url)));
const get=(lesson,type)=>lesson.screens.find(screen=>screen.type===type);

test("counting foundation establishes quantities and group before pairing",()=>{
  const f=read("curriculum/lessons/lesson000.json");
  assert.equal(f.screens.find(s=>s.id==="count-ten").visual.count,10);
  assert.deepEqual(
    f.screens.filter(s=>s.type==="observe"&&/^number-\d+$/.test(s.id)||s.id==="count-model"||s.id==="count-four-model"||s.id==="count-five-model"||s.id==="count-ten-model").map(s=>s.visual.count),
    [1,2,3,4,5,6,7,8,9,10]
  );
  assert.ok(f.screens.some(s=>s.visual?.interactive));
  assert.ok(f.screens.some(s=>s.visual?.grouped));
  assert.ok(!f.screens.some(s=>s.visual?.step==="pair"));
  assert.equal(f.concepts.primary_concept,"counting");
  const pair=read("curriculum/lessons/lesson000a.json");
  assert.equal(pair.concepts.primary_concept,"one_to_one_matching");
  assert.ok(pair.screens.find(s=>s.id==="one-pair").visual.topCount===1);
  assert.ok(pair.screens.some(s=>s.visual?.step==="pair"));
  assert.ok(f.screens.find(s=>s.id==="pair-model").visual.grouped);
  for(const screen of f.screens){
    assert.doesNotMatch(JSON.stringify(screen),/say one number|count outlines|touch each dot|tell how many|make pairs/i);
  }
});

test("counting model offers number audio plus full-screen read-aloud support",()=>{
  const lesson=read("curriculum/lessons/lesson000.json");
  assert.ok(lesson.screens.every(screen=>screen.audio),"every counting screen needs pre-reader narration");
  const html=renderCountingDots({kind:"countingDots",count:3,numbered:true,interactive:true,ariaLabel:"Three dots"});
  assert.equal((html.match(/class="countingDot countTap"/g)||[]).length,3);
  assert.match(html,/role="group" aria-label="Three dots"/);
  assert.match(html,/id="countSpeech" role="status" aria-live="polite"/);
  const engine=fs.readFileSync(new URL("../engine/lessonEngine.js",import.meta.url),"utf8");
  assert.match(engine,/SpeechSynthesisUtterance/);
  assert.match(engine,/speechSynthesis\.cancel/);
  assert.match(engine,/id="listenBtn"/);
  assert.match(engine,/screen\.choices\.map/);
  assert.match(engine,/audioUnavailable/);
});

test("lesson001 moves from counting to formed pairs, difference language, and subtraction",()=>{
  const lesson=read("curriculum/lessons/lesson001.json");
  const screens=lesson.screens;
  assert.deepEqual(screens.slice(0,7).map(screen=>screen.type),["intro","count","count","observe","discover","language","memoryHook"]);
  assert.match(screens[0].body,/count two groups of dots/i);
  assert.equal(lesson.learning.assumed_prior_knowledge.length,2);
  assert.equal(screens[0].callout,undefined);
  assert.deepEqual(screens.filter(screen=>screen.type==="count").map(screen=>screen.choices.find(c=>c.correct).text),["6","4"]);
  assert.equal(get(lesson,"observe").visual.step,"pair");
  assert.equal(get(lesson,"discover").visual.step,"reveal");
  assert.deepEqual(get(lesson,"language").phrases,["How many more?","What is the difference?"]);
  assert.match(get(lesson,"memoryHook").body,/6 − 4 = 2/);
  assert.match(get(lesson,"reflection").choices.find(c=>c.correct).text,/how many more blue dots/i);
  assert.ok(screens.indexOf(get(lesson,"misconception"))>screens.indexOf(get(lesson,"observe")));
  for(const screen of screens.filter(screen=>screen.choices)){
    assert.equal(screen.revision,4);
    for(const hint of screen.hints||[]) assert.doesNotMatch(hint,/(?:the answer is|there are [234] extra|= [234]$)/i);
  }
  assert.equal(get(lesson,"guidedPractice").visual.kind,"comparisonButtons");
  assert.ok(screens.filter(screen=>screen.visual?.kind==="comparisonButtons"&&screen.id!=="misconception").every(screen=>screen.visual.topLabel==="Blue dots"));
  assert.ok(screens.every(screen=>!JSON.stringify(screen).includes("gold")));
});

test("lesson001 gives the same sequence and exam vocabulary in Spanish",()=>{
  const english=read("curriculum/lessons/lesson001.json");
  const spanish=applyTranslation(english,read("curriculum/translations/es/lesson001.json"));
  assert.deepEqual(spanish.screens.map(screen=>screen.id),english.screens.map(screen=>screen.id));
  assert.match(spanish.screens[0].body,/cuenta dos grupos de puntos/i);
  assert.equal(spanish.screens[0].callout,undefined);
  assert.notDeepEqual(spanish.learning.assumed_prior_knowledge,english.learning.assumed_prior_knowledge);
  assert.deepEqual(get(spanish,"language").phrases,["¿Cuántos más?","¿Cuál es la diferencia?"]);
  assert.match(get(spanish,"reflection").choices.find(c=>c.correct).text,/cuántos puntos azules más/i);
});

for(const name of ["lesson002.json","lesson003.json","lesson004.json"]){
  test(`${name} replaces abstract comparison hints with executable steps`,()=>{
    const lesson=read(`curriculum/lessons/${name}`);
    assert.match(get(lesson,"intro").body,/pair|subtract/i);
    for(const type of ["misconception","discover","symbol","guidedPractice","independentPractice","recall","transfer"]){
      const screen=get(lesson,type);
      assert.ok(screen.hints.length>=2,`${type} needs layered support`);
      assert.ok(screen.hints.some(hint=>/pair|count|subtract|remove|start|calculate/i.test(hint)),`${type} must give a concrete action`);
    }
  });

  test(`${name} preserves the concrete steps in Spanish`,()=>{
    const english=read(`curriculum/lessons/${name}`);
    const spanish=applyTranslation(english,read(`curriculum/translations/es/${name}`));
    assert.match(get(spanish,"intro").body,/pareja|resta/i);
    for(const type of ["misconception","discover","symbol","guidedPractice","independentPractice","recall","transfer"]){
      assert.ok(get(spanish,type).hints.length>=2,`${type} needs layered Spanish support`);
    }
  });
}

for(const name of names){
  test(`${name} is understandable as a first exposure`,()=>{
    const lesson=read(`curriculum/lessons/${name}`);
    assert.equal(lesson.metadata.prototype,true);
    assert.equal(lesson.metadata.review_status,"adult_review_required");
    assert.ok(lesson.learning.assumed_prior_knowledge.length<=2,"prototype must state minimal prerequisites");
    assert.ok(lesson.learning.novice_success_criteria.length>=3);
    assert.match(get(lesson,"intro").callout,/No .* assumed/i);

    const language=get(lesson,"language");
    assert.ok(language.definitions.length>=3,"new terms need plain-language definitions");
    for(const definition of language.definitions){
      assert.ok(definition.term.trim());
      assert.ok(definition.meaning.split(/\s+/).length>=5,`${definition.term} needs a usable definition`);
    }

    const hook=get(lesson,"memoryHook");
    assert.ok(hook.rebuildSteps.length>=4,"memory anchor must reconstruct the concept");
    assert.ok(hook.boundary.length>=40,"memory anchor must state where it stops working");

    for(const type of ["misconception","discover","symbol","guidedPractice","independentPractice","recall","transfer"]){
      const screen=get(lesson,type);
      assert.ok(screen.hints.length>=2,`${type} needs layered novice support`);
      const correct=screen.choices.find(choice=>choice.correct);
      assert.ok(correct.feedback.length>=45,`${type} feedback must explain why`);
      for(const wrong of screen.choices.filter(choice=>!choice.correct)) assert.ok(wrong.misconception,`${type} wrong answers must be diagnostic`);
    }
    const scored=lesson.screens.filter(screen=>screen.choices?.some(choice=>choice.correct));
    const correctPositions=scored.map(screen=>screen.choices.findIndex(choice=>choice.correct));
    const positionCounts=correctPositions.reduce((counts,position)=>counts.set(position,(counts.get(position)||0)+1),new Map());
    assert.equal(new Set(correctPositions).size,3,"correct answers must use all three positions");
    assert.ok(Math.max(...positionCounts.values())<=Math.ceil(scored.length/2),"one answer position must not dominate the lesson");
    const uniquelyLongest=scored.filter(screen=>{
      const lengths=screen.choices.map(choice=>choice.text.trim().split(/\s+/).length);
      const correctIndex=screen.choices.findIndex(choice=>choice.correct);
      return lengths[correctIndex]===Math.max(...lengths) && lengths.filter(length=>length===lengths[correctIndex]).length===1;
    });
    assert.ok(uniquelyLongest.length<=Math.floor(scored.length*0.4),"correct answers must not be identifiable by length");
    assert.notEqual(get(lesson,"recall").prompt,get(lesson,"transfer").prompt);
    assert.doesNotMatch(get(lesson,"transfer").prompt,new RegExp(hook.hook.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"i"));
  });

  test(`${name} preserves the novice contract in Spanish`,()=>{
    const english=read(`curriculum/lessons/${name}`);
    const spanish=applyTranslation(english,read(`curriculum/translations/es/${name}`));
    assert.notEqual(spanish.metadata.title,english.metadata.title);
    assert.notEqual(spanish.learning.big_idea,english.learning.big_idea);
    for(const type of ["intro","language","memoryHook","recall","transfer"]){
      const en=get(english,type),es=get(spanish,type);
      assert.notEqual(es.title,en.title,`${type} title remained English`);
    }
    assert.notEqual(get(spanish,"memoryHook").boundary,get(english,"memoryHook").boundary);
    for(const screen of spanish.screens.filter(screen=>screen.choices?.some(choice=>choice.correct))){
      const englishScreen=english.screens.find(item=>item.id===screen.id);
      const correctIndex=screen.choices.findIndex(choice=>choice.correct);
      const translatedText=screen.choices[correctIndex].text;
      const englishText=englishScreen.choices[correctIndex].text;
      assert.ok(translatedText!==englishText || !/[A-Za-z]/.test(englishText),`${screen.id} correct answer remained English`);
    }
    assert.deepEqual(spanish.screens.map(screen=>screen.id),english.screens.map(screen=>screen.id));
  });
}
