import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname,resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createAnalytics,summarizeLearningHistory } from "../engine/analytics-engine/analyticsEngine.js";
import { applyTranslation } from "../engine/i18n/lessonLocale.js";
import { archiveCompletedAttempt,ensureLessonRecord,newLessonAttempt,saveLessonRecord } from "../engine/state-store/stateStore.js";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const lessonNames=["lesson001.json","lesson002.json","lesson003.json","lesson004.json","lesson005.json","lesson006.json","lesson007.json"];
const readJson=async path=>JSON.parse(await readFile(resolve(root,path),"utf8"));

class MemoryStorage{
  constructor(){ this.values=new Map(); }
  getItem(key){ return this.values.has(key)?this.values.get(key):null; }
  setItem(key,value){ this.values.set(key,String(value)); }
}

for(const language of ["en","es"]){
  test(`all seven lessons complete and restart end to end in ${language}`,async()=>{
    globalThis.localStorage=new MemoryStorage();
    const completed=[];
    for(const name of lessonNames){
      const base=await readJson(`curriculum/lessons/${name}`);
      const lesson=language==="es"?applyTranslation(base,await readJson(`curriculum/translations/es/${name}`)):base;
      const ids=lesson.screens.map(screen=>screen.id);
      assert.equal(new Set(ids).size,ids.length,"screen ids must remain unique");
      assert.equal(lesson.screens.at(-1).type,"complete");
      if(language==="es") assert.notEqual(lesson.metadata.title,base.metadata.title);

      let record=ensureLessonRecord(lesson,name);
      const analytics=createAnalytics();
      for(const [index,screen] of lesson.screens.entries()){
        record.index=index;
        record.screenId=screen.id;
        if(Array.isArray(screen.choices)){
          const selected=screen.choices.findIndex(choice=>choice.correct===true);
          assert.notEqual(selected,-1,`${lesson.metadata.id}/${screen.id} needs a correct choice`);
          record.screenStates[screen.id]={selected,submittedCorrect:true,hintIndex:0};
          analytics.record({type:"submit",screen:index,payload:{correct:true,evidence:screen.choices[selected].evidence||null}});
        }
      }
      record.currentAttempt.events=analytics.events();
      record.status="completed";
      record=archiveCompletedAttempt(record,analytics.summary());
      saveLessonRecord(lesson.metadata.id,record);
      completed.push(record);

      const completedId=record.currentAttempt.id;
      record=newLessonAttempt(record);
      assert.equal(record.status,"not_started");
      assert.equal(record.index,0);
      assert.equal(record.priorCompletedAttempts.length,1);
      assert.equal(record.priorCompletedAttempts[0].id,completedId);
      assert.equal(record.currentAttempt.completed,false);
      assert.notEqual(record.currentAttempt.id,completedId);
    }
    const history=summarizeLearningHistory(completed);
    assert.equal(history.completedAttempts,7);
    assert.ok(history.correct>0);
    assert.equal(history.wrong,0);
    assert.equal(history.accuracy,100);
  });
}

test("language changes preserve the same lesson attempt and screen",async()=>{
  globalThis.localStorage=new MemoryStorage();
  const base=await readJson("curriculum/lessons/lesson001.json");
  const spanish=applyTranslation(base,await readJson("curriculum/translations/es/lesson001.json"));
  const record=ensureLessonRecord(base,"lesson001.json");
  record.index=4;
  record.screenId=base.screens[4].id;
  record.screenStates[record.screenId]={selected:1,hintIndex:2};
  saveLessonRecord(base.metadata.id,record);
  const restored=ensureLessonRecord(spanish,"lesson001.json");
  assert.equal(restored.currentAttempt.id,record.currentAttempt.id);
  assert.equal(restored.screenId,record.screenId);
  assert.deepEqual(restored.screenStates[record.screenId],{selected:1,hintIndex:2});
  assert.equal(restored.title,spanish.metadata.title);
});
