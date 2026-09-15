import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname,resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderChoiceScreen,renderComparisonBlocks,renderComplete } from "../sdk/components/lessonComponents.js";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const read=path=>readFileSync(resolve(root,path),"utf8");

test("learner shell exposes landmarks, skip navigation, and modal semantics",()=>{
  const html=read("apps/learner/index.html");
  assert.match(html,/class="skip-link"[^>]+href="#lessonRoot"/);
  assert.match(html,/<main[^>]+id="lessonRoot"[^>]+tabindex="-1"[^>]+aria-busy="true"/);
  assert.match(html,/<label[^>]+for="lessonSelect"/);
  assert.match(html,/role="dialog" aria-modal="true" aria-labelledby="analyticsTitle"/);
  assert.match(html,/id="themeBtn"[^>]+aria-pressed="false"/);
});

test("dynamic lesson controls expose progress, live feedback, and localized visuals",()=>{
  const choice=renderChoiceScreen({choices:[{text:"Four"},{text:"Five"}]},{hint:"Hint",checkAnswer:"Check"});
  assert.match(choice,/role="radiogroup" aria-label="Answer choices"/);
  assert.match(choice,/type="button" role="radio"[^>]+aria-checked="false" tabindex="0"/);
  assert.match(choice,/aria-checked="false" tabindex="-1"/);
  assert.match(choice,/role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(choice,/role="note" aria-live="polite"/);
  const visual=renderComparisonBlocks({topCount:2,bottomCount:1},"Compara dos grupos");
  assert.match(visual,/role="img" aria-label="Compara dos grupos"/);
  assert.equal((visual.match(/aria-hidden="true"/g)||[]).length,3);
  assert.match(renderComplete({title:"Done",body:"Complete"},null,false),/<h1 id="screenTitle">/);
});

test("keyboard, focus, motion, contrast, and mobile safeguards remain wired",()=>{
  const engine=read("engine/lessonEngine.js");
  const css=read("sdk/components/components.css");
  assert.match(engine,/role="progressbar"/);
  assert.match(engine,/aria-valuenow/);
  assert.match(engine,/\["ArrowDown","ArrowRight","ArrowUp","ArrowLeft","Home","End"\]/);
  assert.match(engine,/event\.key==="Escape"/);
  assert.match(engine,/modalReturnFocus/);
  assert.match(engine,/focusLesson\(\)/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/@media\(forced-colors:active\)/);
  assert.match(css,/@media\(max-width:720px\)/);
  assert.match(css,/overflow-x:hidden/);
});
