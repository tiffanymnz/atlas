import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {applyTranslation} from "../engine/i18n/lessonLocale.js";

const names=["lesson005.json","lesson006.json","lesson007.json","lesson008.json","lesson009.json","lesson010.json","lesson011.json"];
const read=path=>JSON.parse(fs.readFileSync(new URL(`../${path}`,import.meta.url)));
const get=(lesson,type)=>lesson.screens.find(screen=>screen.type===type);

test("lesson001 teaches the comparison action before naming it",()=>{
  const lesson=read("curriculum/lessons/lesson001.json");
  const intro=get(lesson,"intro");
  assert.match(intro.body,/pair one item/i);
  assert.match(intro.body,/count the items left/i);
  assert.doesNotMatch(intro.body,/\bgap\b|\bcomparison\b|\bamount\b/i);

  const firstQuestion=get(lesson,"misconception");
  const correct=firstQuestion.choices.find(choice=>choice.correct);
  assert.doesNotMatch(correct.text,/\bgap\b|\brelationship\b|\bamount\b/i);
  assert.match(correct.feedback,/pair .*8 stickers/i);

  const language=get(lesson,"language");
  assert.deepEqual(language.phrases,["How many more?"]);
  assert.match(language.guidance,/“In all” or “altogether”/i);

  for(const type of ["misconception","discover","symbol","guidedPractice","independentPractice","recall","transfer","reflection"]){
    const screen=get(lesson,type);
    assert.ok(screen.hints.length>=2,`${type} needs a worked second hint`);
    assert.ok(screen.hints.some(hint=>/pair|count|subtract|calculate|blocks were paired/i.test(hint)),`${type} hints must tell the learner what action to take`);
  }
});

test("lesson001 keeps the same plain-language scaffolding in Spanish",()=>{
  const english=read("curriculum/lessons/lesson001.json");
  const spanish=applyTranslation(english,read("curriculum/translations/es/lesson001.json"));
  assert.match(get(spanish,"intro").body,/Forma una pareja/i);
  assert.doesNotMatch(get(spanish,"intro").body,/\bdiferencia\b|\bcomparar\b|\bcantidad\b/i);
  assert.deepEqual(get(spanish,"language").phrases,["¿Cuántos más?"]);
  for(const type of ["misconception","discover","symbol","guidedPractice","independentPractice","recall","transfer","reflection"]){
    assert.ok(get(spanish,type).hints.length>=2,`${type} needs two Spanish hints`);
  }
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
