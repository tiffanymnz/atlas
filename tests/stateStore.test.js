import test from "node:test";
import assert from "node:assert/strict";
import {
  archiveCompletedAttempt,
  ensureLessonRecord,
  getAllLessonRecords,
  getLastLessonPath,
  getPreferences,
  newLessonAttempt,
  recoverLearningState,
  resolveLessonPosition,
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
  savePreferences({dark:true,big:true,reduce:true,language:"es"});
  assert.deepEqual(getPreferences(),{dark:true,big:true,reduce:true,language:"es"});
});

test("malformed preferences cannot accidentally enable accessibility modes",()=>{
  localStorage.setItem("atlas.preferences.v1",JSON.stringify({dark:"false",big:1,reduce:null}));
  assert.deepEqual(getPreferences(),{dark:false,big:false,reduce:false,language:"en"});
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

test("malformed saved lesson data is repaired without losing the lesson",()=>{
  localStorage.setItem("atlas.learning.v1",JSON.stringify({
    version:1,
    lessons:{one:{status:"unexpected",index:"3.9",screenStates:{0:"bad",1:{selected:2}},currentAttempt:{events:null},priorCompletedAttempts:"bad"}}
  }));
  const record=ensureLessonRecord(lesson("one"),"one.json");
  assert.equal(record.status,"not_started");
  assert.equal(record.index,3);
  assert.deepEqual(record.screenStates,{1:{selected:2}});
  assert.deepEqual(record.currentAttempt.events,[]);
  assert.deepEqual(record.priorCompletedAttempts,[]);
});

test("legacy array records migrate into the current version",()=>{
  assert.deepEqual(recoverLearningState({version:0,records:[{lessonId:"one",index:2},{lessonId:"two",index:4}]}),{
    version:1,
    lessons:{one:{lessonId:"one",index:2},two:{lessonId:"two",index:4}}
  });
});

test("future-version lesson records are recovered without discarding progress",()=>{
  localStorage.setItem("atlas.learning.v1",JSON.stringify({
    version:99,
    lessons:{one:{status:"in_progress",index:5,screenId:"recall",currentAttempt:{id:"future",events:[{type:"hint"},null,"bad"]}}}
  }));
  const record=ensureLessonRecord(lesson("one"),"one.json");
  assert.equal(record.index,5);
  assert.equal(record.screenId,"recall");
  assert.deepEqual(record.currentAttempt.events,[{type:"hint"}]);
  assert.equal(JSON.parse(localStorage.getItem("atlas.learning.v1")).version,1);
});

test("duplicate and malformed completed attempts are removed during recovery",()=>{
  localStorage.setItem("atlas.learning.v1",JSON.stringify({
    version:1,
    lessons:{one:{
      currentAttempt:{id:"current",completed:true,events:[]},
      priorCompletedAttempts:[
        {id:"current",completed:true,events:[]},
        {id:"prior",completed:true,events:[null,{type:"submit",payload:{correct:true}}]},
        {id:"prior",completed:true,events:[]},
        {id:"unfinished",completed:false,events:[]}
      ]
    }}
  }));
  const record=ensureLessonRecord(lesson("one"),"one.json");
  assert.equal(record.priorCompletedAttempts.length,1);
  assert.equal(record.priorCompletedAttempts[0].id,"prior");
  assert.equal(record.priorCompletedAttempts[0].events.length,1);
});

test("a completed attempt repairs a stale status to completed",()=>{
  localStorage.setItem("atlas.learning.v1",JSON.stringify({
    version:1,
    lessons:{one:{status:"in_progress",currentAttempt:{id:"done",completed:true,events:[]}}}
  }));
  assert.equal(ensureLessonRecord(lesson("one"),"one.json").status,"completed");
});

test("stable screen ids preserve position when curriculum screens are inserted",()=>{
  const record={index:2,screenId:"practice",screenStates:{practice:{selected:1}}};
  const revised={screens:[{id:"intro"},{id:"hook"},{id:"model"},{id:"practice"}]};
  assert.equal(resolveLessonPosition(record,revised),3);
  assert.equal(record.screenId,"practice");
  assert.deepEqual(record.screenStates.practice,{selected:1});
});

test("a revised lesson starts at its new introduction without losing an earlier completion",()=>{
  const old={metadata:{id:"one",title:"Lesson one"},screens:[{id:"intro"},{id:"old-question"}]};
  const record=ensureLessonRecord(old,"one.json");
  record.index=1; record.screenId="old-question"; record.screenStates["old-question"]={selected:1};
  record.currentAttempt.completed=true;
  saveLessonRecord("one",record);
  const revised={metadata:{...old.metadata,contentRevision:2},screens:[{id:"intro"},{id:"count"},{id:"old-question"}]};
  const restored=ensureLessonRecord(revised,"one.json");
  assert.equal(resolveLessonPosition(restored,revised),0);
  assert.equal(restored.screenId,"intro");
  assert.equal(restored.currentAttempt.completed,true);
  assert.equal(restored.screenStates["old-question"].selected,1);
  assert.equal(ensureLessonRecord(revised,"one.json").index,0);
});

test("legacy numeric positions migrate through explicit legacy indexes",()=>{
  const record={index:1,screenId:null,screenStates:{1:{hintIndex:2}}};
  const revised={screens:[{id:"intro",legacyIndex:0},{id:"new"},{id:"observe",legacyIndex:1}]};
  assert.equal(resolveLessonPosition(record,revised),2);
  assert.equal(record.screenId,"observe");
  assert.deepEqual(record.screenStates.observe,{hintIndex:2});
});

test("legacy state for every visited screen migrates without index collisions",()=>{
  const record={index:2,screenId:null,screenStates:{1:{hintIndex:1},2:{selected:2},3:{feedback:{html:"saved"}}}};
  const revised={screens:[
    {id:"intro",legacyIndex:0},
    {id:"misconception"},
    {id:"observe",legacyIndex:1},
    {id:"discover",legacyIndex:2},
    {id:"language",legacyIndex:3}
  ]};
  assert.equal(resolveLessonPosition(record,revised),3);
  assert.deepEqual(record.screenStates,{
    observe:{hintIndex:1},
    discover:{selected:2},
    language:{feedback:{html:"saved"}}
  });
});
