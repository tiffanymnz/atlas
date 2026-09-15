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
  const enginePath=resolve(dirname(learnerPath),source);
  assert.ok(existsSync(enginePath),`missing entry point: ${enginePath}`);

  const engine=readFileSync(enginePath,"utf8");
  for(const specifier of engine.matchAll(/from\s+"([^"]+)"/g)){
    const dependency=resolve(dirname(enginePath),specifier[1]);
    assert.ok(existsSync(dependency),`missing import: ${dependency}`);
  }
  assert.match(engine,/submit\.textContent="Continue"/,"correct answers expose a persistent Continue action");
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
