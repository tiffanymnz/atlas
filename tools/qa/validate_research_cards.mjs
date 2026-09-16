import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const readJson=relative=>JSON.parse(fs.readFileSync(path.join(root,relative),"utf8"));
const cardsFile=readJson("curriculum/research/math_p0_research_cards_v1.json");
const schema=readJson("curriculum/research/research_card_schema_v1.json");
const registry=readJson("curriculum/research/source_registry_v1.json");
const crosswalk=readJson("curriculum/knowledge-graph/core_math_p0_crosswalk_v1.json");
const errors=[];

const required=schema.required||[];
const cards=cardsFile.cards||[];
const cardIds=new Set();
const sourceConceptIds=new Set();
const sourceIds=new Set((registry.sources||[]).map(({id})=>id));
const mappingBySource=new Map((crosswalk.mappings||[]).map(mapping=>[mapping.source_concept_id,mapping]));
const plannedMappings=(crosswalk.mappings||[]).filter(({implementation_status})=>implementation_status==="planned");

for(const source of registry.sources||[]){
  if(!source.id||sourceIds.size!==(registry.sources||[]).length) errors.push("source registry ids must be present and unique");
  if(!/^https:\/\//.test(source.url||"")) errors.push(`${source.id} must use an HTTPS source URL`);
}

for(const card of cards){
  for(const key of required){
    if(!(key in card)) errors.push(`${card.id||"unknown card"} is missing ${key}`);
  }
  if(cardIds.has(card.id)) errors.push(`duplicate research card id ${card.id}`);
  cardIds.add(card.id);
  if(sourceConceptIds.has(card.source_concept_id)) errors.push(`duplicate source concept card ${card.source_concept_id}`);
  sourceConceptIds.add(card.source_concept_id);

  const mapping=mappingBySource.get(card.source_concept_id);
  if(!mapping) errors.push(`${card.id} has no knowledge-graph crosswalk mapping`);
  else{
    if(mapping.implementation_status!=="planned") errors.push(`${card.id} must describe a planned concept`);
    if(!mapping.atlas_concept_ids.includes(card.atlas_concept_id)) errors.push(`${card.id} atlas concept does not match its crosswalk`);
  }

  if(!Array.isArray(card.reconstruction_steps)||card.reconstruction_steps.length<3) errors.push(`${card.id} needs at least three reconstruction steps`);
  if(!Array.isArray(card.common_misuse)||card.common_misuse.length===0) errors.push(`${card.id} needs at least one misuse boundary`);
  if(card.recall_prompt===card.transfer_check?.prompt) errors.push(`${card.id} recall and transfer prompts must differ`);
  if(!card.bilingual_notes?.english_term||!card.bilingual_notes?.spanish_term||!card.bilingual_notes?.translation_note) errors.push(`${card.id} has incomplete bilingual notes`);
  if(!["A","B","C","D"].includes(card.evidence_level)) errors.push(`${card.id} has invalid evidence level`);
  if(!card.adult_evidence_limit?.trim()) errors.push(`${card.id} must state the adult evidence limit`);
  if(!Array.isArray(card.source_ids)||card.source_ids.length===0) errors.push(`${card.id} has no evidence sources`);
  for(const id of card.source_ids||[]) if(!sourceIds.has(id)) errors.push(`${card.id} cites unknown source ${id}`);
  if(card.review_status==="approved"&&(card.evidence_level==="C"||card.evidence_level==="D"||card.unresolved_questions.length)) errors.push(`${card.id} cannot be approved with weak evidence or unresolved questions`);
}

const expectedPlannedIds=new Set(plannedMappings.map(({source_concept_id})=>source_concept_id));
if(cards.length!==expectedPlannedIds.size) errors.push(`expected ${expectedPlannedIds.size} planned-concept cards, found ${cards.length}`);
for(const id of expectedPlannedIds) if(!sourceConceptIds.has(id)) errors.push(`${id} is missing a research card`);

const decision=cardsFile.cluster_decision||{};
if(decision.status!=="prototype_next") errors.push("the selected cluster must remain prototype_next until research review closes");
for(const id of decision.source_concept_ids||[]) if(!sourceConceptIds.has(id)) errors.push(`cluster cites unknown research concept ${id}`);
const decisionAtlasIds=new Set((decision.source_concept_ids||[]).map(id=>mappingBySource.get(id)?.atlas_concept_ids?.[0]));
for(const id of decision.recommended_order||[]) if(!decisionAtlasIds.has(id)) errors.push(`cluster order contains unmapped concept ${id}`);
if((decision.recommended_order||[]).length!==decisionAtlasIds.size) errors.push("cluster order must include every selected concept exactly once");
if(!decision.release_gate?.trim()) errors.push("cluster decision must define a release gate");

if(errors.length){
  console.error(`Research-card validation failed with ${errors.length} error(s):`);
  for(const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Research cards valid: ${cards.length} planned concepts, ${registry.sources.length} evidence sources, next cluster ${decision.id}.`);
