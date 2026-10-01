import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {applyTranslation} from "../engine/i18n/lessonLocale.js";

const read=path=>JSON.parse(fs.readFileSync(new URL(`../${path}`,import.meta.url)));
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
