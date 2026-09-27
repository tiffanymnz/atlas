import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {evaluateFirstExposure} from "../tools/qa/noviceEvidence.mjs";
const read=name=>JSON.parse(fs.readFileSync(new URL(`../curriculum/reviews/${name}`,import.meta.url)));
const protocol=read("comparison_first_exposure_protocol_v1.json");
test("first-exposure understanding remains pending without learner evidence",()=>{
  const result=evaluateFirstExposure(protocol,read("comparison_first_exposure_records_v1.json"));
  assert.equal(result.ready,false);
  assert.match(result.errors.join(" "),/en: 0\/5/);
  assert.match(result.errors.join(" "),/es: 0\/5/);
});
test("a delayed or coached response cannot satisfy the gate",()=>{
  const session=(locale,code)=>({locale,code,prior_exposure:false,can_already_solve:false,coached:false,critical_barrier:false,consent:true,checks:Object.fromEntries(protocol.checks.map(({id})=>[id,{passed:true,first_response_correct:true,hint_used:false,explanation:"Learner paired items and explained the extra group.",...(id==="delayed"?{hours_since_lesson:25}:{})}]))});
  const sessions=[...Array.from({length:5},(_,i)=>session("en",`E${i}`)),...Array.from({length:5},(_,i)=>session("es",`S${i}`))];
  assert.equal(evaluateFirstExposure(protocol,{protocol_id:protocol.id,sessions}).ready,true);
  sessions[0].coached=true;
  assert.equal(evaluateFirstExposure(protocol,{protocol_id:protocol.id,sessions}).ready,false);
  sessions[0].coached=false;sessions[1].checks.delayed.hours_since_lesson=1;
  assert.equal(evaluateFirstExposure(protocol,{protocol_id:protocol.id,sessions}).ready,false);
});
