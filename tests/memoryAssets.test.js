import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { buildMemoryAssets } from "../tools/build/generate_memory_assets.mjs";

const digest=value=>createHash("sha256").update(value).digest("hex");

test("memory assets are deterministic, bilingual, and traceable",async()=>{
  const first=await buildMemoryAssets();
  const second=await buildMemoryAssets();
  assert.deepEqual(first,second);
  assert.deepEqual(Object.keys(first).sort(),[
    "en/flashcards.html","en/quiz.html","en/worksheet.html",
    "es/flashcards.html","es/quiz.html","es/worksheet.html",
    "index.html","manifest.json","memory-assets.json"
  ]);
  const data=JSON.parse(first["memory-assets.json"]);
  assert.equal(data.locales.en.length,9);
  assert.equal(data.locales.es.length,9);
  assert.notEqual(data.locales.en[0].title,data.locales.es[0].title);
  for(const locale of ["en","es"]){
    for(const lesson of data.locales[locale]){
      assert.match(lesson.lessonId,/^MATH-(?:NS-COMP-000[1-4]|NS-DIV-0005|NS-FRAC-0006|NS-PCT-0007|GEO-AREA-0008|GEO-PERIM-0009)$/);
      assert.ok(lesson.conceptId);
      assert.ok(lesson.memoryHook.hook);
      assert.ok(lesson.independent.answer);
      assert.ok(lesson.recall.answer);
      assert.ok(lesson.transfer.answer);
    }
  }
  const manifest=JSON.parse(first["manifest.json"]);
  assert.equal(manifest.sources.length,18);
  assert.equal(manifest.lessonIds.length,9);
  for(const [path,hash] of Object.entries(manifest.outputs)) assert.equal(hash,digest(first[path]));
});

test("printable assets contain every lesson and no unresolved values",async()=>{
  const outputs=await buildMemoryAssets();
  for(const locale of ["en","es"]){
    for(const type of ["flashcards","worksheet","quiz"]){
      const html=outputs[`${locale}/${type}.html`];
      for(const id of ["MATH-NS-COMP-0001","MATH-NS-COMP-0002","MATH-NS-COMP-0003","MATH-NS-COMP-0004","MATH-NS-DIV-0005","MATH-NS-FRAC-0006","MATH-NS-PCT-0007","MATH-GEO-AREA-0008","MATH-GEO-PERIM-0009"]) assert.match(html,new RegExp(id));
      assert.doesNotMatch(html,/undefined|null/);
    }
  }
});

test("asset language links preserve the current activity and quiz keys vary",async()=>{
  const outputs=await buildMemoryAssets();
  assert.match(outputs["en/worksheet.html"],/href="\.\.\/es\/worksheet\.html"/);
  assert.match(outputs["es/quiz.html"],/href="\.\.\/en\/quiz\.html"/);
  const answerLetters=[...outputs["en/quiz.html"].matchAll(/<p>\d+\. ([A-C])\./g)].map(match=>match[1]);
  assert.ok(new Set(answerLetters).size>1,"quiz answers should not use one predictable position");
});
