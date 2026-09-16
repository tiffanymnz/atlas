import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const graphPath=path.join(root,"curriculum/knowledge-graph/core_math_p0_v1.json");
const crosswalkPath=path.join(root,"curriculum/knowledge-graph/core_math_p0_crosswalk_v1.json");
const appGraphPath=path.join(root,"curriculum/knowledge-graph/knowledge_graph_v1.json");

const readJson=file=>JSON.parse(fs.readFileSync(file,"utf8"));
const graph=readJson(graphPath);
const crosswalk=readJson(crosswalkPath);
const appGraph=readJson(appGraphPath);
const errors=[];

const groups=["concepts","language_traps","misconceptions","memory_hooks","visuals","standards","assessments","edges","adaptive_rules"];
for(const group of groups){
  if(!Array.isArray(graph[group])) errors.push(`${group} must be an array`);
}

const nodes=groups
  .filter(group=>!["edges","adaptive_rules"].includes(group))
  .flatMap(group=>(graph[group]||[]).map(node=>({group,id:node.id})));
const ids=new Set();
for(const node of nodes){
  if(typeof node.id!=="string"||!node.id) errors.push(`${node.group} contains a node without an id`);
  else if(ids.has(node.id)) errors.push(`duplicate node id ${node.id}`);
  else ids.add(node.id);
}

const edgeIds=new Set();
for(const edge of graph.edges||[]){
  if(edgeIds.has(edge.id)) errors.push(`duplicate edge id ${edge.id}`);
  edgeIds.add(edge.id);
  if(!ids.has(edge.source)) errors.push(`${edge.id} has unknown source ${edge.source}`);
  if(!ids.has(edge.target)) errors.push(`${edge.id} has unknown target ${edge.target}`);
  if(!Number.isInteger(edge.weight)||edge.weight<1||edge.weight>5) errors.push(`${edge.id} has invalid weight ${edge.weight}`);
}

const conceptIds=new Set((graph.concepts||[]).map(({id})=>id));
const misconceptionIds=new Set((graph.misconceptions||[]).map(({id})=>id));
const hookIds=new Set((graph.memory_hooks||[]).map(({id})=>id));
const visualIds=new Set((graph.visuals||[]).map(({id})=>id));
for(const conceptId of conceptIds){
  if(!(graph.edges||[]).some(edge=>edge.source===conceptId)) errors.push(`${conceptId} has no outgoing edge`);
}
for(const assessment of graph.assessments||[]){
  if(!conceptIds.has(assessment.concept_id)) errors.push(`${assessment.id} has unknown concept ${assessment.concept_id}`);
  if(!misconceptionIds.has(assessment.misconception_id)) errors.push(`${assessment.id} has unknown misconception ${assessment.misconception_id}`);
}
for(const hook of graph.memory_hooks||[]){
  if(!hook.english?.trim()||!hook.spanish?.trim()) errors.push(`${hook.id} must include English and Spanish text`);
}
for(const rule of graph.adaptive_rules||[]){
  for(const id of rule.misconception_ids||[]) if(!misconceptionIds.has(id)) errors.push(`${rule.id} has unknown misconception ${id}`);
  for(const id of rule.visual_ids||[]) if(!visualIds.has(id)) errors.push(`${rule.id} has unknown visual ${id}`);
  for(const id of rule.hook_ids||[]) if(!hookIds.has(id)) errors.push(`${rule.id} has unknown hook ${id}`);
}

if(graph.concepts?.length!==10) errors.push(`expected 10 starter concepts, found ${graph.concepts?.length??0}`);
if(graph.edges?.length!==40) errors.push(`expected 40 curated edges, found ${graph.edges?.length??0}`);

const mappings=crosswalk.mappings||[];
const mappedSourceIds=new Set();
const appConceptIds=new Set((appGraph.concepts||[]).map(({id})=>id));
for(const mapping of mappings){
  if(mappedSourceIds.has(mapping.source_concept_id)) errors.push(`duplicate crosswalk mapping ${mapping.source_concept_id}`);
  mappedSourceIds.add(mapping.source_concept_id);
  if(!conceptIds.has(mapping.source_concept_id)) errors.push(`crosswalk has unknown source ${mapping.source_concept_id}`);
  if(!Array.isArray(mapping.atlas_concept_ids)||mapping.atlas_concept_ids.length===0) errors.push(`${mapping.source_concept_id} has no Atlas concept id`);
  if(mapping.implementation_status==="implemented"){
    for(const id of mapping.atlas_concept_ids||[]) if(!appConceptIds.has(id)) errors.push(`${mapping.source_concept_id} claims missing implemented concept ${id}`);
    if(!Array.isArray(mapping.lesson_ids)||mapping.lesson_ids.length===0) errors.push(`${mapping.source_concept_id} is implemented without a lesson`);
  }
}
for(const conceptId of conceptIds){
  if(!mappedSourceIds.has(conceptId)) errors.push(`${conceptId} is missing from the application crosswalk`);
}

if(errors.length){
  console.error(`Knowledge graph validation failed with ${errors.length} error(s):`);
  for(const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Knowledge graph valid: ${graph.concepts.length} P0 concepts, ${nodes.length} nodes, ${graph.edges.length} edges, ${mappings.length} crosswalk mappings.`);
