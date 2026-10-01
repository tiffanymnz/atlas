import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {applyTranslation} from "../engine/i18n/lessonLocale.js";
import {renderLanguage} from "../sdk/components/lessonComponents.js";

const read=path=>JSON.parse(fs.readFileSync(new URL(`../${path}`,import.meta.url)));
test("missing-amount language cards explain each statement separately in both languages",()=>{
  const lesson=read("curriculum/lessons/lesson004.json");
  const translated=applyTranslation(lesson,read("curriculum/translations/es/lesson004.json"));
  for(const localized of [lesson,translated]){
    const screen=localized.screens.find(screen=>screen.type==="language");
    assert.equal(screen.phraseMeanings.length,screen.phrases.length);
    assert.equal(new Set(screen.phraseMeanings).size,screen.phrases.length);
    const html=renderLanguage(screen);
    screen.phrases.forEach((phrase,index)=>assert.ok(html.includes(`${phrase}<span>${screen.phraseMeanings[index]}</span>`)));
    assert.doesNotMatch(screen.visual.message,/still missing|todavía falta/);
  }
  assert.match(renderLanguage({phrases:["How many more?"],phraseMeaning:"Find the difference."}),/Find the difference/);
});
test("count-up hints show the actual steps rather than assuming the strategy",()=>{
  const lesson=read("curriculum/lessons/lesson001.json");
  const independent=lesson.screens.find(screen=>screen.type==="independentPractice");
  const transfer=lesson.screens.find(screen=>screen.type==="transfer");
  assert.match(independent.hints[1],/6, 7, 8, 9/);
  assert.match(independent.hints[1],/4 steps/);
  assert.match(transfer.hints[1],/9: one step/);
  assert.match(transfer.hints[1],/10: two steps/);
});
test("comparison prerequisites and transfer arithmetic stay within the counting checkpoint",()=>{
  for(const n of ["001","002","003","004"]){
    const lesson=read(`curriculum/lessons/lesson${n}.json`);
    const es=applyTranslation(lesson,read(`curriculum/translations/es/lesson${n}.json`));
    assert.ok(lesson.metadata.contentRevision>=2);
    for(const localized of [lesson,es]){
      assert.ok(localized.learning.assumed_prior_knowledge.length>=2);
      const transfer=localized.screens.find(screen=>screen.type==="transfer");
      const numbers=(transfer.prompt.match(/\d+/g)||[]).map(Number);
      assert.ok(numbers.length>=2);
      assert.ok(numbers.every(number=>number<=20));
      assert.equal(transfer.choices.filter(choice=>choice.correct).length,1);
      assert.ok(transfer.choices.every(choice=>(choice.text.match(/\d+/g)||[]).every(number=>Number(number)<=20)));
    }
  }
});
test("comparison teaches subtraction symbols before asking for an equation",()=>{
  const lesson=read("curriculum/lessons/lesson001.json");
  const explanation=lesson.screens.findIndex(screen=>screen.id==="memory-hook");
  const question=lesson.screens.findIndex(screen=>screen.id==="choose-equation");
  assert.ok(explanation<question);
  assert.match(lesson.screens[explanation].body,/− means subtract/);
  assert.match(lesson.screens[explanation].body,/= means/);
  assert.doesNotMatch(JSON.stringify(lesson.screens.flatMap(screen=>screen.hints||[])),/say one number|outlined pair/);
});
