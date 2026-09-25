import test from "node:test";
import assert from "node:assert/strict";
import {assessNextLessonReadiness} from "../engine/recommendation-engine/readiness.js";
import {renderComplete} from "../sdk/components/lessonComponents.js";

const lesson={screens:[{type:"intro"},{type:"independentPractice"},{type:"recall"},{type:"transfer"}]};
const answer=(screen,correct)=>({type:"submit",screen,payload:{correct}});

test("completion alone does not show readiness to continue",()=>{
  const result=assessNextLessonReadiness(lesson,[answer(1,true),answer(2,true)]);
  assert.deepEqual(result,{ready:false,needsPractice:["transfer"]});
  const html=renderComplete({title:"Done",body:"Finished"},"Review and try again",false);
  assert.match(html,/Review and try again/);
  assert.doesNotMatch(html,/id="nextLessonBtn"/);
});

test("wrong first answer or a hint prevents unassisted readiness even after correction",()=>{
  const events=[answer(1,false),answer(1,true),{type:"hint",screen:2},answer(2,true),answer(3,true)];
  assert.deepEqual(assessNextLessonReadiness(lesson,events).needsPractice,["independentPractice","recall"]);
});

test("first unassisted correct responses in all three contexts support moving on",()=>{
  const events=[answer(1,true),answer(2,true),answer(3,true)];
  assert.equal(assessNextLessonReadiness(lesson,events).ready,true);
  assert.match(renderComplete({title:"Done",body:"Finished"},"Continue",true),/id="nextLessonBtn"/);
});
