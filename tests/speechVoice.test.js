import test from "node:test";
import assert from "node:assert/strict";
import {chooseSpeechVoice,configureSpeech} from "../engine/speechVoice.js";

test("enhanced matching voices outrank the generic default without crossing languages",()=>{
  const voices=[{name:"Default",lang:"en-US",default:true},{name:"Enhanced",lang:"en-US"},{name:"Natural",lang:"es-ES"}];
  assert.equal(chooseSpeechVoice(voices,"en"),voices[1]);
  assert.equal(chooseSpeechVoice(voices,"es"),voices[2]);
  assert.equal(chooseSpeechVoice(voices,"fr"),null);
});
test("speech checks the current voice inventory on every request",()=>{
  let voices=[];
  const synthesis={getVoices:()=>voices};
  const first=configureSpeech({},"en",synthesis);
  assert.equal(first.voice,undefined);
  voices=[{name:"Device voice",lang:"en_US",default:true}];
  assert.equal(configureSpeech({},"en",synthesis,true).voice,voices[0]);
  assert.equal(first.rate,0.95);
});
