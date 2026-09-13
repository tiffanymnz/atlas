import test from "node:test";
import assert from "node:assert/strict";
import {
  archiveCompletedAttempt,
  ensureLessonRecord,
  getAllLessonRecords,
  getLastLessonPath,
  getPreferences,
  newLessonAttempt,
  saveLastLessonPath,
  saveLessonRecord,
  savePreferences
} from "../engine/state-store/stateStore.js";

class MemoryStorage {
  constructor(){ this.values=new Map(); }
  getItem(key){ return this.values.has(key)?this.values.get(key):null; }
  setItem(key,value){ this.values.set(key,String(value)); }
  clear(){ this.values.clear(); }
}

const lesson=id=>({metadata:{id,title:`Lesson ${id}`}});

test.beforeEach(()=>{ globalThis.localStorage=new MemoryStorage(); });

test("accessibility preferences survive a reload",()=>{
  savePreferences({dark:true,big:true,reduce:true});
  assert.deepEqual(getPreferences(),{dark:true,big:true,reduce:true});
});

test("each lesson restores its own screen and attempt state",()=>{
  const first=ensureLessonRecord(lesson("one"),"one.json");
  first.index=3;
  first.status="in_progress";
  first.screenStates[3]={selected:1,hintIndex:2};
  first.currentAttempt.events.push({type:"hint"});
  saveLessonRecord("one",first);

  const second=ensureLessonRecord(lesson("two"),"two.json");
  second.index=1;
  saveLessonRecord("two",second);

  const restored=ensureLessonRecord(lesson("one"),"one.json");
  assert.equal(restored.index,3);
  assert.equal(restored.status,"in_progress");
  assert.deepEqual(restored.screenStates[3],{selected:1,hintIndex:2});
  assert.equal(restored.currentAttempt.events.length,1);
  assert.equal(getAllLessonRecords().length,2);
});

test("completed attempts remain separate from a fresh current attempt",()=>{
  let record=ensureLessonRecord(lesson("one"),"one.json");
  const completedId=record.currentAttempt.id;
  record.currentAttempt.events.push({type:"submit",payload:{correct:true}});
  record=archiveCompletedAttempt(record,{accuracy:100});
  record.status="completed";
  saveLessonRecord("one",record);

  record=newLessonAttempt(record);
  assert.equal(record.priorCompletedAttempts.length,1);
  assert.equal(record.priorCompletedAttempts[0].id,completedId);
  assert.equal(record.priorCompletedAttempts[0].summary.accuracy,100);
  assert.notEqual(record.currentAttempt.id,completedId);
  assert.equal(record.currentAttempt.completed,false);
  assert.deepEqual(record.currentAttempt.events,[]);
  assert.equal(record.status,"not_started");
});

test("the selected lesson survives reopen",()=>{
  saveLastLessonPath("lesson002.json");
  assert.equal(getLastLessonPath(),"lesson002.json");
});
