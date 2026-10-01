import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {nextTeachingOption} from "../engine/recommendation-engine/lessonSequence.js";
import {assessNextLessonReadiness} from "../engine/recommendation-engine/readiness.js";
import {ensureLessonRecord,saveLessonRecord,archiveCompletedAttempt,newLessonAttempt} from "../engine/state-store/stateStore.js";
import {applyTranslation} from "../engine/i18n/lessonLocale.js";

const read=name=>JSON.parse(fs.readFileSync(new URL(`../curriculum/lessons/${name}.json`,import.meta.url)));
const picker=fs.readFileSync(new URL("../apps/learner/index.html",import.meta.url),"utf8");
const options=[...picker.matchAll(/<option value="([^"]+)"([^>]*)>/g)].map(([,value,attrs])=>({value,dataset:{concept:attrs.match(/data-concept="([^"]+)"/)?.[1],review:attrs.match(/data-review="([^"]+)"/)?.[1]}}));
const route=["lesson000p","lesson000t0","lesson000t4","lesson000t7","lesson000t9","lesson000t11","lesson000t13","lesson000t16","lesson000t18"];

test("the real picker advances through teaching parts and stops before pairing",()=>{
  let option=options[0];
  const visited=[];
  while(option){
    const name=option.value.split("/").at(-1).replace(".json","");
    visited.push(name);
    option=nextTeachingOption(read(name),options,options.indexOf(option));
    assert.ok(visited.length<=route.length,"route must terminate");
  }
  assert.deepEqual(visited,route);
  for(const name of route){
    const lesson=read(name);
    assert.equal(assessNextLessonReadiness(lesson,[]).ready,false);
    const events=lesson.screens.flatMap((screen,index)=>["independentPractice","recall","transfer"].includes(screen.type)?[{type:"submit",screen:index,payload:{correct:true}}]:[]);
    assert.equal(assessNextLessonReadiness(lesson,events).ready,true);
  }
});

test("upper teaching parts model every number immediately before a check in both languages",()=>{
  const numbers=[];
  for(const suffix of [11,13,16,18]){
    const lesson=read(`lesson000t${suffix}`);
    const translated=applyTranslation(lesson,JSON.parse(fs.readFileSync(new URL(`../curriculum/translations/es/lesson000t${suffix}.json`,import.meta.url))));
    for(const localized of [lesson,translated]){
      assert.ok(localized.screens.length<=13);
      localized.screens.forEach((screen,index)=>{
        if(screen.type==="observe" && screen.visual?.interactive){
          assert.equal(localized.screens[index+1].visual?.count,screen.visual.count);
          assert.ok(localized.screens[index+1].choices);
          if(localized===lesson) numbers.push(screen.visual.count);
        }
      });
    }
  }
  assert.deepEqual(numbers,Array.from({length:10},(_,i)=>i+11));
});

test("switching and reopening short parts preserve answers without altering full-lesson history",()=>{
  const values=new Map();
  globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  const original=read("lesson000b");
  const prior=ensureLessonRecord(original,"lesson000b.json");
  archiveCompletedAttempt(prior,{accuracy:100});
  const completionId=prior.currentAttempt.id;
  saveLessonRecord(original.metadata.id,prior);
  for(const name of route){
    const lesson=read(name);
    const record=ensureLessonRecord(lesson,`${name}.json`);
    record.index=2;record.screenId=lesson.screens[2].id;record.status="in_progress";
    record.screenStates[record.screenId]={selected:1,hintIndex:1};
    saveLessonRecord(lesson.metadata.id,record);
  }
  for(const name of route){
    const lesson=read(name);const record=ensureLessonRecord(lesson,`${name}.json`);
    assert.equal(record.screenId,lesson.screens[2].id);
    assert.equal(record.index,2);
    assert.deepEqual(record.screenStates[record.screenId],{selected:1,hintIndex:1});
  }
  const restored=ensureLessonRecord(original,"lesson000b.json");
  assert.equal(restored.currentAttempt.id,completionId);
  assert.equal(restored.currentAttempt.completed,true);
  newLessonAttempt(restored);
  assert.equal(restored.priorCompletedAttempts[0].id,completionId);
  assert.equal(restored.currentAttempt.completed,false);
});
