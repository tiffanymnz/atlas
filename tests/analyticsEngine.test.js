import test from "node:test";
import assert from "node:assert/strict";
import { createAnalytics } from "../engine/analytics-engine/analyticsEngine.js";

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
