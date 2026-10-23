import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {bundledAudioUrls,countingAudioParts} from "../engine/countingAudio.js";
import {applyTranslation} from "../engine/i18n/lessonLocale.js";

const root=new URL("../",import.meta.url);
const read=path=>JSON.parse(readFileSync(new URL(path,root)));

test("every short counting prompt, hint, choice and feedback has matching-language bundled audio",()=>{
  for(const name of readdirSync(new URL("curriculum/lessons/",root)).filter(n=>/^lesson000.*\.json$/.test(n))){
    const base=read(`curriculum/lessons/${name}`);
    for(const language of ["en","es"]){
      const lesson=language==="en"?base:applyTranslation(base,read(`curriculum/translations/es/${name}`));
      for(const screen of lesson.screens){
        const parts=[screen.audio,...screen.hints||[],...screen.choices?.flatMap(c=>[c.text,c.feedback])||[],
          screen.correctFeedback,screen.wrongFeedback,screen.tooManyFeedback,screen.tooFewFeedback].filter(Boolean);
        if(!parts.length) continue;
        const urls=bundledAudioUrls(parts,language,"https://atlas.test/engine/lessonEngine.js");
        assert.ok(urls,`${name}/${language}/${screen.id} has missing narration`);
        assert.ok(urls.every(url=>url.includes(`/assets/audio/${language}/`)));
      }
    }
  }
  assert.equal(bundledAudioUrls(["unrecorded text"],"en",root),null);
});

test("screen audio uses the active hint and diagnostic rather than HTML labels or another choice",()=>{
  const screen={audio:"Prompt",hints:["First","Second"],choices:[{feedback:"Wrong"},{feedback:"Right"}]};
  assert.deepEqual(countingAudioParts(screen,{hintShown:true,hintStep:1,feedback:{},wrongChoiceIndex:0}),["Prompt","Second","Wrong"]);
  assert.deepEqual(countingAudioParts(screen,{submittedCorrect:true,selected:1,feedback:{}}),["Prompt","Right"]);
  const builder={audio:"Make dots",type:"buildGroup",targetCount:2,wrongFeedback:"Count again",tooManyFeedback:"Remove a dot",correctFeedback:"Two dots"};
  assert.deepEqual(countingAudioParts(builder,{builtCount:3,feedback:{}}),["Make dots","Remove a dot"]);
});
