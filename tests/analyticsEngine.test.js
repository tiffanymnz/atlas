import test from "node:test";
import assert from "node:assert/strict";
import { createAnalytics, getUnderstandingSignals, getPracticeDetails, summarizeLearningHistory } from "../engine/analytics-engine/analyticsEngine.js";

test("analytics resumes from persisted current-attempt events",()=>{
  const analytics=createAnalytics([{type:"submit",payload:{correct:false}}]);
  analytics.record({type:"submit",payload:{correct:true}});
  analytics.record({type:"hint"});
  assert.deepEqual(analytics.summary(),{
    attempts:2,
    correct:1,
    wrong:1,
    hints:1,
    accuracy:50,
    events:analytics.events()
  });
});

test("analytics safely ignores malformed initial events",()=>{
  assert.deepEqual(createAnalytics(null).summary().events,[]);
});

test("learning history aggregates completed current and prior attempts",()=>{
  const submit=correct=>({type:"submit",payload:{correct}});
  const records=[{
    currentAttempt:{completed:true,events:[submit(true),{type:"hint"}]},
    priorCompletedAttempts:[{completed:true,events:[submit(false),{type:"guided_retry"},submit(true)]}]
  },{
    currentAttempt:{completed:false,events:[submit(false)]},
    priorCompletedAttempts:[]
  }];
  assert.deepEqual(summarizeLearningHistory(records),{
    completedAttempts:2,
    correct:2,
    wrong:1,
    hints:2,
    accuracy:67
  });
});

test("compare-unknown lessons report their own evidence instead of gap evidence",()=>{
  const lesson={concepts:{primary_concept:"compare_unknown"}};
  const events=[
    {payload:{evidence:"identified_compared_unknown"}},
    {payload:{evidence:"subtraction_as_comparison"}}
  ];
  assert.deepEqual(getUnderstandingSignals(lesson,events,2),{
    compared:true,
    concept:true,
    equation:true,
    conceptLabel:"Identified the unknown compared amount"
  });
});

test("counting summaries count actual successful screens without claiming comparison understanding",()=>{
  const lesson={concepts:{primary_concept:"counting"},screens:[
    {id:"model",type:"observe"},{id:"question",type:"count"},{id:"build",type:"buildGroup"}
  ]};
  const events=[{type:"select",screen:0,payload:{}},
    {type:"submit",screen:1,payload:{correct:false}},
    {type:"submit",screen:1,payload:{correct:true}},
    {type:"submit",screen:1,payload:{correct:true}},
    {type:"submit",screen:2,payload:{correct:true}}];
  const english=getPracticeDetails(lesson,events).join("\n");
  assert.match(english,/Questions answered correctly: 1/);
  assert.match(english,/Groups built correctly: 1/);
  assert.doesNotMatch(english,/subtraction|comparison|gap|master/i);
  assert.match(getPracticeDetails(lesson,[],"es").join("\n"),/Grupos creados correctamente: 0/);
});
