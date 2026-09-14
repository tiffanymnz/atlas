import test from "node:test";
import assert from "node:assert/strict";
import { createAnalytics, summarizeLearningHistory } from "../engine/analytics-engine/analyticsEngine.js";

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
