import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");

test("learner entry point and lesson-engine imports resolve",()=>{
  const learnerPath=resolve(root,"apps/learner/index.html");
  const html=readFileSync(learnerPath,"utf8");
  const source=html.match(/<script type="module" src="([^"]+)"/)?.[1];
  assert.ok(source,"module entry point is present");
  const enginePath=resolve(dirname(learnerPath),source.split("?")[0]);
  assert.ok(existsSync(enginePath),`missing entry point: ${enginePath}`);

  const engine=readFileSync(enginePath,"utf8");
  for(const specifier of engine.matchAll(/from\s+"([^"]+)"/g)){
    const dependency=resolve(dirname(enginePath),specifier[1].split("?")[0]);
    assert.ok(existsSync(dependency),`missing import: ${dependency}`);
  }
  assert.match(engine,/submit\.textContent=copy\(\)\.continue/,"correct answers expose a localized persistent Continue action");
  assert.doesNotMatch(engine,/setTimeout\(next/,"progress does not depend on a transient timer");
});

test("every learner lesson option resolves to a curriculum file",()=>{
  const learnerPath=resolve(root,"apps/learner/index.html");
  const html=readFileSync(learnerPath,"utf8");
  const options=[...html.matchAll(/<option value="([^"]+\.json)"/g)].map(match=>match[1]);
  assert.ok(options.length>0,"at least one lesson option is present");
  for(const option of options){
    assert.ok(existsSync(resolve(dirname(learnerPath),option)),`missing lesson option: ${option}`);
  }
});

test("the learner links to the generated memory-practice hub",()=>{
  const learnerPath=resolve(root,"apps/learner/index.html");
  const html=readFileSync(learnerPath,"utf8");
  const href=html.match(/id="memoryAssetsLink" href="([^"]+)"/)?.[1];
  assert.ok(href,"memory-practice link is present");
  assert.ok(existsSync(resolve(dirname(learnerPath),href,"index.html")),"memory-practice hub resolves");
});

test("the learner-observation entry point and imports resolve",()=>{
  const reviewPath=resolve(root,"apps/review/index.html");
  const html=readFileSync(reviewPath,"utf8");
  const source=html.match(/<script type="module" src="([^"]+)"/)?.[1];
  assert.ok(source,"review module entry point is present");
  const scriptPath=resolve(dirname(reviewPath),source);
  assert.ok(existsSync(scriptPath),`missing review entry point: ${scriptPath}`);
  const script=readFileSync(scriptPath,"utf8");
  for(const specifier of script.matchAll(/from\s+"([^"]+)"/g)){
    const dependency=resolve(dirname(scriptPath),specifier[1]);
    assert.ok(existsSync(dependency),`missing review import: ${dependency}`);
  }
  assert.match(html,/Evidence capture, not automatic approval/);
  assert.match(script,/human curriculum review/i);
});
