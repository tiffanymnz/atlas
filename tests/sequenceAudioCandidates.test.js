import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {bundledAudioUrls} from "../engine/countingAudio.js";

test("sequence candidates cover every number without replacing active learner clips",()=>{
  const root=new URL("../",import.meta.url);
  const manifest=JSON.parse(readFileSync(new URL("assets/audio/candidates/manifest.json",root)));
  assert.equal(manifest.status,"unapproved candidate");
  for(const language of ["en","es"]){
    const entry=manifest.languages[language];
    assert.equal(entry.numbers.length,21);
    const full=readFileSync(new URL(entry.fullSequence,root));
    assert.equal(createHash("sha256").update(full).digest("hex"),entry.fullSha256);
    let previousEnd=0;
    for(const [number,clip] of entry.numbers.entries()){
      assert.equal(clip.number,number);
      assert.ok(clip.startSample>=previousEnd&&clip.endSample>clip.startSample);
      assert.ok(clip.endSample<=entry.fullSampleCount);
      previousEnd=clip.endSample;
      const bytes=readFileSync(new URL(clip.file,root));
      assert.ok(bytes.length>1000);
      assert.equal(createHash("sha256").update(bytes).digest("hex"),clip.sha256);
      const active=bundledAudioUrls([clip.word],language,"https://atlas.test/engine/lessonEngine.js");
      assert.ok(active);
      assert.notEqual(active[0],`https://atlas.test/${clip.file}`);
    }
  }
});
