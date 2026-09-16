import test from "node:test";
import assert from "node:assert/strict";
import { auditRelease } from "../tools/qa/release_audit.mjs";

test("V1 release routes, references, manifests, and metadata are complete",async()=>{
  const result=await auditRelease();
  assert.deepEqual(result.errors,[]);
  assert.equal(result.version,"1.0.0");
  assert.ok(result.checkedFiles>=30);
  assert.ok(result.internalReferences>=20);
  assert.equal(result.manifestOutputs,8);
});
