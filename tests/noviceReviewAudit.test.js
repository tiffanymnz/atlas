import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=path=>JSON.parse(fs.readFileSync(new URL(`../${path}`,import.meta.url)));
const audit=read("curriculum/reviews/sprint11_internal_novice_audit_v1.json");
const lessonNames=Array.from({length:7},(_,index)=>`lesson${String(index+5).padStart(3,"0")}`);

test("Sprint 11 audit covers every post-V1 prototype without claiming human approval",()=>{
  assert.equal(audit.schema_version,"1.0");
  assert.equal(audit.review_mode,"internal_first_exposure_audit");
  assert.equal(audit.decision,"retain_adult_review_required");
  assert.equal(audit.human_observation.status,"pending");
  assert.ok(audit.human_observation.minimum_sessions_per_cluster>=2);
  assert.deepEqual(audit.scope,lessonNames);
  assert.deepEqual(audit.records.map(record=>record.lesson_id),lessonNames);
  assert.equal(new Set(audit.records.map(record=>record.concept)).size,lessonNames.length);
  for(const record of audit.records){
    assert.ok(record.finding.length>=80,`${record.lesson_id} needs a substantive finding`);
    assert.ok(record.action,`${record.lesson_id} needs an action`);
    assert.ok(record.residual_risk.length>=60,`${record.lesson_id} needs an explicit residual risk`);
    const lesson=read(`curriculum/lessons/${record.lesson_id}.json`);
    assert.equal(lesson.metadata.review_status,"adult_review_required");
  }
});

test("Lesson 007 no longer relies on undeclared fraction operations",()=>{
  const english=fs.readFileSync(new URL("../curriculum/lessons/lesson007.json",import.meta.url),"utf8");
  const spanish=fs.readFileSync(new URL("../curriculum/translations/es/lesson007.json",import.meta.url),"utf8");
  for(const [language,source] of [["English",english],["Spanish",spanish]]){
    assert.doesNotMatch(source,/simplif/i,`${language} still asks novices to simplify fractions`);
    assert.doesNotMatch(source,/1\/4\s*[×x]\s*\$80/i,`${language} still assumes fraction multiplication`);
    assert.match(source,/four equal groups of 25%|cuatro grupos iguales de 25%/i);
    assert.match(source,/five groups of 20%|cinco grupos de 20%/i);
  }
  const lesson=JSON.parse(english);
  const language=lesson.screens.find(screen=>screen.type==="language");
  assert.ok(language.definitions.some(definition=>definition.term==="equivalent"));
  const symbol=lesson.screens.find(screen=>screen.type==="symbol");
  assert.match(symbol.choices.find(choice=>choice.correct).feedback,/rebuild 100%/i);
});
