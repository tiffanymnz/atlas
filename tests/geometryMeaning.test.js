import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {applyTranslation} from "../engine/i18n/lessonLocale.js";

const read=path=>JSON.parse(fs.readFileSync(new URL(`../${path}`,import.meta.url)));
const screen=(lesson,type)=>lesson.screens.find(item=>item.type===type);
const area=read("curriculum/lessons/lesson008.json");
const perimeter=read("curriculum/lessons/lesson009.json");

test("area meaning precedes its formula and uses square-unit coverage",()=>{
  assert.equal(area.concepts.primary_concept,"geometry.area");
  assert.equal(screen(area,"observe").visual.kind,"areaGrid");
  assert.match(screen(area,"language").definitions.find(item=>item.term==="area").meaning,/square units/i);
  assert.match(screen(area,"memoryHook").hook,/covering the inside/i);
  assert.match(screen(area,"equationReveal").equation,/15 square units/);
  assert.doesNotMatch(screen(area,"intro").body,/length\s*[×x*]\s*width/i);
});

test("perimeter meaning precedes its shortcut and contrasts boundary with coverage",()=>{
  assert.equal(perimeter.concepts.primary_concept,"geometry.perimeter");
  assert.equal(screen(perimeter,"observe").visual.kind,"perimeterPath");
  assert.match(screen(perimeter,"language").definitions.find(item=>item.term==="perimeter").meaning,/complete path around/i);
  assert.match(screen(perimeter,"memoryHook").hook,/trip around the outside/i);
  assert.match(screen(perimeter,"transfer").prompt,/area 24 square units/i);
  assert.match(screen(perimeter,"transfer").choices.find(item=>item.correct).text,/22 units.*20 units/i);
});

test("Spanish geometry lessons preserve units, meaning, and sequence",()=>{
  const areaEs=applyTranslation(area,read("curriculum/translations/es/lesson008.json"));
  const perimeterEs=applyTranslation(perimeter,read("curriculum/translations/es/lesson009.json"));
  assert.match(screen(areaEs,"memoryHook").hook,/unidades cuadradas/i);
  assert.match(screen(perimeterEs,"memoryHook").hook,/vuelta completa/i);
  assert.match(screen(perimeterEs,"transfer").choices.find(item=>item.correct).text,/22 unidades.*20 unidades/i);
  assert.equal(areaEs.screens.length,perimeterEs.screens.length);
});
