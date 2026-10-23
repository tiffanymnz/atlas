import test from "node:test";
import assert from "node:assert/strict";
import {createSpeechPlayback} from "../engine/speechPlayback.js";

function harness(){
  const queued=[],timers=new Map(),calls=[];
  const synthesis={paused:false,speaking:false,pending:false,getVoices:()=>[],
    speak:u=>{queued.push(u);calls.push("speak");},cancel:()=>calls.push("cancel"),resume:()=>calls.push("resume")};
  const player=createSpeechPlayback({synthesis,makeUtterance:text=>({text}),
    schedule:fn=>{const id=timers.size+1;timers.set(id,fn);return id;},unschedule:id=>timers.delete(id)});
  return {player,synthesis,queued,timers,calls};
}
test("speech resumes a paused device synchronously and keeps dot utterances active",()=>{
  const h=harness();h.synthesis.paused=true;
  h.player.play("one","en",{numberOnly:true});
  assert.deepEqual(h.calls,["resume","speak"]);
  assert.equal(h.player.playing,true);
  assert.equal(h.queued[0].text,"one");
  h.queued[0].onstart();assert.equal(h.timers.size,0);
  h.queued[0].onend();assert.equal(h.player.playing,false);
});
test("silent speech engines and thrown or reported failures notify the learner",()=>{
  const h=harness();let failures=0;
  h.player.play("two","en",{onError:()=>failures++});
  [...h.timers.values()][0]();assert.equal(failures,1);assert.equal(h.player.playing,false);
  h.player.play("three","en",{onError:()=>failures++});
  h.queued.at(-1).onerror();assert.equal(failures,2);
  h.synthesis.speak=()=>{throw new Error("unavailable");};
  h.player.play("four","en",{onError:()=>failures++});
  assert.equal(failures,3);assert.equal(h.timers.size,0);
});
test("late speech callbacks cannot change the next screen or next utterance",()=>{
  const h=harness();let failures=0;
  h.player.play("one","en",{onError:()=>failures++});
  const stale=h.queued[0].onerror;
  h.player.play("two","en");stale();
  assert.equal(failures,0);assert.equal(h.player.playing,true);
  h.player.stop();assert.equal(h.timers.size,0);assert.equal(h.queued.at(-1).onend,null);
});
