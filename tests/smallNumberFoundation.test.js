import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {applyTranslation} from "../engine/i18n/lessonLocale.js";

const read=path=>JSON.parse(fs.readFileSync(new URL(`../${path}`,import.meta.url)));
const lesson=read("curriculum/lessons/lesson000p.json");
const spanish=applyTranslation(lesson,read("curriculum/translations/es/lesson000p.json"));

test("return sessions cover every number 4–20 with bilingual counting and construction",()=>{
  const picker=fs.readFileSync(new URL("../apps/learner/index.html",import.meta.url),"utf8");
  for(const [suffix,start,end,source] of [["r4",4,6,"lesson000"],["r7",7,10,"lesson000"],["r11",11,15,"lesson000b"],["r16",16,20,"lesson000c"]]){
    const review=read(`curriculum/lessons/lesson000${suffix}.json`);
    const translated=applyTranslation(review,read(`curriculum/translations/es/lesson000${suffix}.json`));
    assert.ok(picker.includes(`lesson000${suffix}.json" data-concept="counting" data-review="true" data-review-source="../../curriculum/lessons/${source}.json"`));
    assert.ok(review.screens.length<=12);
    for(const localized of [review,translated]){
      assert.ok(localized.screens.every(screen=>screen.audio));
      for(let number=start;number<=end;number++){
        const check=localized.screens.find(screen=>screen.visual?.count===number);
        assert.equal(check.visual.numbered,undefined);
        assert.equal(check.visual.interactive,undefined);
        assert.equal(check.choices.filter(choice=>choice.correct).length,1);
        assert.equal(check.choices.find(choice=>choice.correct).text,String(number));
        assert.equal(new Set(check.choices.map(choice=>choice.text)).size,3);
        const build=localized.screens.find(screen=>screen.targetCount===number);
        assert.ok(build.tooFewFeedback);
        if(number<20) assert.ok(build.tooManyFeedback);
      }
    }
  }
});

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

test("each number from four through ten returns in a changed arrangement",()=>{
  const next=read("curriculum/lessons/lesson000.json");
  const translated=applyTranslation(next,read("curriculum/translations/es/lesson000.json"));
  assert.equal(next.screens.filter(screen=>screen.visual?.count===0 && screen.choices).length,2,"zero must be revisited after its first check");
  for(const number of [4,5,6,7,8,9,10]){
    const checks=next.screens.filter(screen=>screen.visual?.count===number && screen.choices);
    assert.ok(checks.length>=2,`${number} needs an immediate check and later practice`);
    assert.ok(checks.some(screen=>screen.visual.layout==="scattered"),`${number} needs a changed arrangement`);
    assert.ok(translated.screens.some(screen=>screen.visual?.count===number && screen.visual.layout==="scattered"));
  }
  assert.deepEqual(next.screens.filter(screen=>screen.type==="buildGroup").map(screen=>screen.targetCount),[4,5,7,8,10]);
  assert.deepEqual(translated.screens.filter(screen=>screen.type==="buildGroup").map(screen=>screen.targetCount),[4,5,7,8,10]);
});

test("each number from eleven through twenty is checked again without printed count labels",()=>{
  for(const [filename,start,end] of [["lesson000b.json",11,15],["lesson000c.json",16,20]]){
    const next=read(`curriculum/lessons/${filename}`);
    const translated=applyTranslation(next,read(`curriculum/translations/es/${filename}`));
    for(let number=start;number<=end;number++){
      const checks=next.screens.filter(screen=>screen.visual?.count===number && screen.choices);
      assert.ok(checks.length>=2,`${number} needs later practice`);
      assert.ok(checks.some(screen=>screen.visual.layout==="scattered" && !screen.visual.numbered),`${number} needs an unlabeled changed arrangement`);
      assert.ok(translated.screens.some(screen=>screen.visual?.count===number && screen.visual.layout==="scattered"));
    }
  }
});

test("a separate return lesson practices small numbers without using the original attempt",()=>{
  const review=read("curriculum/lessons/lesson000r.json");
  const translated=applyTranslation(review,read("curriculum/translations/es/lesson000r.json"));
  assert.notEqual(review.metadata.id,lesson.metadata.id);
  assert.deepEqual(review.screens.filter(screen=>screen.type==="buildGroup").map(screen=>screen.targetCount),[3,2,1]);
  for(const number of [1,2,3]){
    assert.ok(review.screens.some(screen=>screen.visual?.count===number && screen.choices),`count ${number} on return`);
    assert.ok(review.screens.some(screen=>screen.type==="recall" && screen.choices.some(choice=>choice.correct && choice.text===String(number))),`hear and recognize ${number} on return`);
  }
  assert.ok(review.screens.some(screen=>screen.visual?.count===2 && screen.visual.layout==="staggered"));
  assert.ok(review.screens.every(screen=>screen.audio));
  assert.deepEqual(translated.screens.map(screen=>screen.id),review.screens.map(screen=>screen.id));
  for(const screen of review.screens.filter(screen=>screen.type==="buildGroup")){
    assert.ok(screen.tooManyFeedback && screen.tooFewFeedback);
  }
});
