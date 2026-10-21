import test from "node:test";
import assert from "node:assert/strict";
import {createRecordedNarration,recordedNarrationUrl} from "../engine/recordedNarration.js";

test("recordings resolve under the repository and require the requested language",()=>{
  const screen={audioFiles:{en:"assets/audio/en/intro.mp3"}};
  assert.equal(recordedNarrationUrl(screen,"en","https://example.com/atlas/engine/lessonEngine.js"),"https://example.com/atlas/assets/audio/en/intro.mp3");
  assert.equal(recordedNarrationUrl(screen,"es","https://example.com/atlas/engine/lessonEngine.js"),null);
  assert.equal(recordedNarrationUrl({audioFiles:{en:"assets/audio/../../secret.mp3"}},"en","https://example.com/engine/lessonEngine.js"),null);
});

test("changing clips stops the old clip and ignores its late failure",async()=>{
  const clips=[];let rejectFirst;let errors=0,finished=0;
  const player=createRecordedNarration(src=>{
    const clip={src,paused:false,pause(){this.paused=true;},play(){return src==="first"?new Promise((_,reject)=>{rejectFirst=reject;}):Promise.resolve();}};
    clips.push(clip);return clip;
  });
  const pending=player.play("first",()=>finished++,()=>errors++);
  await player.play("second",()=>finished++,()=>errors++);
  assert.equal(clips[0].paused,true);
  rejectFirst(new Error("late failure"));await pending;
  assert.equal(errors,0);assert.equal(player.playing,true);
  clips[1].onended();
  assert.equal(finished,1);assert.equal(player.playing,false);
});

test("unavailable recordings report an error and remain replayable",async()=>{
  let errors=0;
  const player=createRecordedNarration(()=>({pause(){},play(){return Promise.reject(new Error("missing"));}}));
  await player.play("missing",()=>assert.fail("unexpected completion"),()=>errors++);
  assert.equal(player.playing,false);assert.equal(errors,1);
  await player.play("missing",null,()=>errors++);
  assert.equal(errors,2);
});
