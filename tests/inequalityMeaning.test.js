import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {applyTranslation} from "../engine/i18n/lessonLocale.js";
import {renderConceptVisual} from "../sdk/components/lessonComponents.js";

const read=path=>JSON.parse(fs.readFileSync(new URL(`../${path}`,import.meta.url)));
const screen=(lesson,type)=>lesson.screens.find(item=>item.type===type);
const atLeast=read("curriculum/lessons/lesson010.json");
const noMore=read("curriculum/lessons/lesson011.json");

test("at least is built from an included minimum before the symbol",()=>{
  assert.equal(atLeast.concepts.primary_concept,"inequalities.at_least");
  assert.equal(screen(atLeast,"observe").visual.kind,"inequalityLine");
  assert.equal(screen(atLeast,"observe").visual.direction,"right");
  assert.equal(screen(atLeast,"observe").visual.inclusive,true);
  assert.match(screen(atLeast,"memoryHook").hook,/minimum counts.*more counts/i);
  assert.match(screen(atLeast,"equationReveal").equation,/≥/);
  assert.doesNotMatch(screen(atLeast,"intro").body,/≥/);
});

test("no more than is built from an included maximum before the symbol",()=>{
  assert.equal(noMore.concepts.primary_concept,"inequalities.no_more_than");
  assert.equal(screen(noMore,"observe").visual.direction,"left");
  assert.equal(screen(noMore,"observe").visual.inclusive,true);
  assert.match(screen(noMore,"memoryHook").hook,/maximum counts.*less counts/i);
  assert.match(screen(noMore,"equationReveal").equation,/≤/);
  assert.doesNotMatch(screen(noMore,"intro").body,/≤/);
});

test("the number-line component exposes direction and boundary accessibly",()=>{
  const html=renderConceptVisual(screen(atLeast,"observe").visual,"minimum model");
  assert.match(html,/role="img"/);
  assert.match(html,/closed point at 30/i);
  assert.match(html,/inequalityLine right/);
  assert.match(html,/inequalityPoint closed/);
});

test("Spanish inequality lessons preserve the inclusive-boundary reasoning",()=>{
  const atLeastEs=applyTranslation(atLeast,read("curriculum/translations/es/lesson010.json"));
  const noMoreEs=applyTranslation(noMore,read("curriculum/translations/es/lesson011.json"));
  assert.match(screen(atLeastEs,"memoryHook").hook,/mínimo cuenta/i);
  assert.match(screen(noMoreEs,"memoryHook").hook,/máximo cuenta/i);
  assert.match(screen(atLeastEs,"recall").choices.find(item=>item.correct).text,/igualdad/i);
  assert.match(screen(noMoreEs,"transfer").choices.find(item=>item.correct).text,/2,000.*1,850/);
});
