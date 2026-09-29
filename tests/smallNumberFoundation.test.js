import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {applyTranslation} from "../engine/i18n/lessonLocale.js";

const read=path=>JSON.parse(fs.readFileSync(new URL(`../${path}`,import.meta.url)));
const lesson=read("curriculum/lessons/lesson000p.json");
const spanish=applyTranslation(lesson,read("curriculum/translations/es/lesson000p.json"));

test("small numbers precede the existing 0–20 route and are each revisited",()=>{
  const picker=fs.readFileSync(new URL("../apps/learner/index.html",import.meta.url),"utf8");
  assert.ok(picker.indexOf("lesson000p.json")<picker.indexOf("lesson000.json"));
  assert.deepEqual(lesson.learning.assumed_prior_knowledge,[]);
  for(const number of [1,2,3]){
    const checks=lesson.screens.filter(screen=>screen.visual?.count===number && screen.choices);
    assert.ok(checks.length>=2,`${number} needs more than an immediate question`);
    assert.ok(checks.some(screen=>screen.visual.layout==="scattered" || screen.type==="recall"),`${number} needs a changed context`);
    assert.ok(lesson.screens.some(screen=>screen.visual?.count===number && screen.visual.interactive));
    assert.ok(spanish.screens.some(screen=>screen.visual?.count===number && screen.visual.interactive));
  }
  assert.deepEqual(lesson.screens.filter(screen=>screen.type==="buildGroup").map(screen=>screen.targetCount),[2,3]);
  assert.ok(lesson.screens.every(screen=>typeof screen.audio==="string" && screen.audio.length>0));
  assert.equal(lesson.metadata.audioStrategy,"short_guidance");
  assert.deepEqual(spanish.screens.map(screen=>screen.id),lesson.screens.map(screen=>screen.id));
});

test("audio has replayable short prompts and speaks choices without reading a long screen",()=>{
  const engine=fs.readFileSync(new URL("../engine/lessonEngine.js",import.meta.url),"utf8");
  assert.match(engine,/function shortGuidanceAudio\(\)/);
  assert.match(engine,/return \[screen\.audio,\.\.\.support\]/);
  assert.match(engine,/screen\.choices\[selected\]\.text/);
  assert.match(engine,/numberOnlyAudio\(\) && !isNumberModel\(screen\)/);
});
