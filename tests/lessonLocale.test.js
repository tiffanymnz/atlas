import test from "node:test";
import assert from "node:assert/strict";
import { applyTranslation } from "../engine/i18n/lessonLocale.js";

test("translation overlays replace strings without changing lesson structure",()=>{
  const base={metadata:{title:"Difference",id:"fixed"},screens:[{title:"Start",count:12,correct:true}]};
  const translation={metadata:{title:"Diferencia"},screens:[{title:"Comienza",count:99,correct:false}]};
  assert.deepEqual(applyTranslation(base,translation),{
    metadata:{title:"Diferencia",id:"fixed"},
    screens:[{title:"Comienza",count:12,correct:true}]
  });
});
