import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {continuesConceptSequence,nextConceptId} from "../engine/recommendation-engine/lessonSequence.js";

const lessons=Array.from({length:11},(_,i)=>{
  const id=String(i+1).padStart(3,"0");
  return JSON.parse(fs.readFileSync(new URL(`../curriculum/lessons/lesson${id}.json`,import.meta.url)));
});
const picker=fs.readFileSync(new URL("../apps/learner/index.html",import.meta.url),"utf8");

test("the lesson picker identifies the concept actually taught by each option",()=>{
  const options=[...picker.matchAll(/<option[^>]+data-concept="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(options,lessons.map(lesson=>lesson.concepts.primary_concept));
  assert.match(picker,/data-en="Comparison 1 — How many more\?"/);
  assert.match(picker,/data-es="Comparación 1 — ¿Cuántos más\?"/);
});

test("next-lesson shortcuts stop at topic boundaries",()=>{
  for(const [from,to] of [[4,5],[7,8],[9,10]]){
    assert.equal(continuesConceptSequence(lessons[from-1],lessons[to-1]),false);
    assert.equal(nextConceptId(lessons[from-1]),null);
  }
  for(const [from,to] of [[1,2],[2,3],[3,4],[5,6],[6,7],[8,9],[10,11]]){
    assert.equal(continuesConceptSequence(lessons[from-1],lessons[to-1]),true);
  }
});
