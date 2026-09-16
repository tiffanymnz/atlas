import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const readJson=relative=>JSON.parse(fs.readFileSync(new URL(relative,import.meta.url)));
const research=readJson("../curriculum/research/math_p0_research_cards_v1.json");
const sources=readJson("../curriculum/research/source_registry_v1.json");
const crosswalk=readJson("../curriculum/knowledge-graph/core_math_p0_crosswalk_v1.json");

test("every planned Math P0 concept has one research card",()=>{
  const planned=crosswalk.mappings.filter(({implementation_status})=>implementation_status==="planned").map(({source_concept_id})=>source_concept_id).sort();
  const cardConcepts=research.cards.map(({source_concept_id})=>source_concept_id).sort();
  assert.deepEqual(cardConcepts,planned);
  assert.equal(new Set(research.cards.map(({id})=>id)).size,research.cards.length);
});

test("research cards enforce meaning before memory",()=>{
  for(const card of research.cards){
    assert.ok(card.concept_meaning.length>=20,card.id);
    assert.ok(card.concept_purpose.length>=20,card.id);
    assert.ok(card.memory_mechanism.length>=20,card.id);
    assert.ok(card.reconstruction_steps.length>=3,card.id);
    assert.ok(card.common_misuse.length>=1,card.id);
    assert.notEqual(card.recall_prompt,card.transfer_check.prompt,card.id);
    assert.ok(card.transfer_check.expected_evidence.length>=10,card.id);
  }
});

test("every evidence reference resolves and uses an official HTTPS source",()=>{
  const sourceById=new Map(sources.sources.map(source=>[source.id,source]));
  for(const card of research.cards){
    assert.ok(card.source_ids.length>0,card.id);
    for(const id of card.source_ids){
      const source=sourceById.get(id);
      assert.ok(source,`${card.id}: ${id}`);
      assert.match(source.url,/^https:\/\//);
      assert.ok(["GED Testing Service","Institute of Education Sciences, What Works Clearinghouse"].includes(source.publisher));
    }
  }
});

test("adult evidence limits and unresolved decisions remain explicit",()=>{
  for(const card of research.cards){
    assert.equal(card.review_status,"draft",card.id);
    assert.ok(card.adult_evidence_limit.length>=10,card.id);
    assert.ok(card.unresolved_questions.length>=1,card.id);
    assert.ok(["B","C"].includes(card.evidence_level),card.id);
  }
});

test("the next prototype cluster builds equal sharing into fractions and percent",()=>{
  const decision=research.cluster_decision;
  assert.equal(decision.status,"prototype_next");
  assert.deepEqual(decision.recommended_order,[
    "division.shared_equally",
    "fractions.numerator_denominator",
    "percent.basics"
  ]);
  assert.ok(decision.release_gate.includes("adult-facing"));
});
