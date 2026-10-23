import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {bundledAudioUrls} from "../engine/countingAudio.js";

test("number-audio screening refers to the exact clips delivered by the learner",()=>{
  const root=new URL("../",import.meta.url);
  const report=JSON.parse(readFileSync(new URL("curriculum/reviews/sprint18_number_audio_screening.json",root)));
  assert.equal(report.numbers.length,42);
  const seen=new Set();
  for(const row of report.numbers){
    const key=`${row.language}/${row.number}`;
    assert.ok(!seen.has(key));seen.add(key);
    assert.ok(["en","es"].includes(row.language)&&row.number>=0&&row.number<=20);
    const bytes=readFileSync(new URL(row.file,root));
    assert.equal(createHash("sha256").update(bytes).digest("hex"),row.sha256,`Stale recognition evidence: ${key}`);
    const urls=bundledAudioUrls([row.expected,String(row.number)],row.language,"https://atlas.test/engine/lessonEngine.js");
    assert.deepEqual(urls,[`https://atlas.test/${row.file}`,`https://atlas.test/${row.file}`]);
  }
  // Recognition mismatches remain review flags; this test does not grant approval.
});
