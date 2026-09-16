import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const graph=JSON.parse(fs.readFileSync(new URL("../curriculum/knowledge-graph/core_math_p0_v1.json",import.meta.url)));
const crosswalk=JSON.parse(fs.readFileSync(new URL("../curriculum/knowledge-graph/core_math_p0_crosswalk_v1.json",import.meta.url)));
const appGraph=JSON.parse(fs.readFileSync(new URL("../curriculum/knowledge-graph/knowledge_graph_v1.json",import.meta.url)));

const nodeGroups=["concepts","language_traps","misconceptions","memory_hooks","visuals","standards","assessments"];
const allNodes=nodeGroups.flatMap(group=>graph[group]);
const nodeIds=new Set(allNodes.map(({id})=>id));

test("the curated Math P0 starter graph contains ten unique concepts",()=>{
  assert.equal(graph.concepts.length,10);
  assert.equal(new Set(graph.concepts.map(({id})=>id)).size,10);
  assert.ok(graph.concepts.every(concept=>concept.priority==="P0"&&concept.status==="Ready"));
});

test("all knowledge-graph edges resolve to unique nodes",()=>{
  assert.equal(nodeIds.size,allNodes.length);
  assert.equal(new Set(graph.edges.map(({id})=>id)).size,graph.edges.length);
  assert.equal(graph.edges.length,40);
  for(const edge of graph.edges){
    assert.ok(nodeIds.has(edge.source),`${edge.id} source ${edge.source}`);
    assert.ok(nodeIds.has(edge.target),`${edge.id} target ${edge.target}`);
  }
});

test("every memory hook is bilingual",()=>{
  for(const hook of graph.memory_hooks){
    assert.ok(hook.english.trim(),`${hook.id} English`);
    assert.ok(hook.spanish.trim(),`${hook.id} Spanish`);
  }
});

test("the crosswalk covers every source concept without claiming planned lessons exist",()=>{
  const sourceIds=new Set(graph.concepts.map(({id})=>id));
  assert.deepEqual(new Set(crosswalk.mappings.map(({source_concept_id})=>source_concept_id)),sourceIds);
  const implementedIds=new Set(appGraph.concepts.map(({id})=>id));
  for(const mapping of crosswalk.mappings){
    assert.ok(mapping.atlas_concept_ids.length>0);
    if(mapping.implementation_status==="implemented"){
      assert.ok(mapping.lesson_ids.length>0);
      for(const id of mapping.atlas_concept_ids) assert.ok(implementedIds.has(id),id);
    }else{
      assert.equal(mapping.implementation_status,"planned");
      assert.deepEqual(mapping.lesson_ids,[]);
    }
  }
});

test("diagnostic assessments resolve to concepts and misconceptions",()=>{
  const conceptIds=new Set(graph.concepts.map(({id})=>id));
  const misconceptionIds=new Set(graph.misconceptions.map(({id})=>id));
  for(const assessment of graph.assessments){
    assert.ok(conceptIds.has(assessment.concept_id),assessment.id);
    assert.ok(misconceptionIds.has(assessment.misconception_id),assessment.id);
    assert.ok(assessment.question&&assessment.answer);
  }
});
