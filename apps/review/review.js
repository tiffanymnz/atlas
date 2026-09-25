import {createObservationRecord,finalizeObservationRecord,summarizeObservationRecords,validateObservationRecord} from "../../engine/review/observationRecord.js";

const STORAGE_KEY="atlas.observation.records.v1";
const protocol=await fetch("../../curriculum/reviews/learner_observation_protocol_v1.json").then(response=>{
  if(!response.ok) throw new Error("Observation protocol could not be loaded.");
  return response.json();
});
const byId=id=>document.getElementById(id);
const clusterSelect=byId("cluster");
const tagNames=["undefined_prerequisite","prompt_ambiguity","misleading_visual","accessibility_barrier","translation_problem","shortcut_without_understanding","transfer_failure","other"];

for(const cluster of protocol.clusters){
  const option=document.createElement("option"); option.value=cluster.id; option.textContent=cluster.title; clusterSelect.append(option);
}
for(const tag of tagNames){
  const label=document.createElement("label");
  const input=document.createElement("input"); input.type="checkbox"; input.value=tag;
  label.append(input,document.createTextNode(tag.replaceAll("_"," "))); byId("issueTags").append(label);
}

const loadRecords=()=>{try{const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");return Array.isArray(parsed)?parsed:[];}catch{return [];}};
const saveRecords=records=>localStorage.setItem(STORAGE_KEY,JSON.stringify(records));
const selectedCluster=()=>protocol.clusters.find(cluster=>cluster.id===clusterSelect.value);
const renderProtocol=()=>{
  const cluster=selectedCluster();
  byId("requiredPrompts").replaceChildren(...cluster.required_prompts.map(text=>Object.assign(document.createElement("li"),{textContent:text})));
  byId("watchFor").replaceChildren(...cluster.watch_for.map(text=>Object.assign(document.createElement("li"),{textContent:text})));
};
const renderSummary=()=>{
  const summaries=summarizeObservationRecords(loadRecords(),protocol);
  byId("summary").replaceChildren(...summaries.map(item=>{
    const card=document.createElement("article"); card.className="summary-item";
    const status=item.revision_required?"Revision required":item.evidence_complete?"Ready for human review":"More evidence required";
    card.innerHTML=`<strong></strong><p></p><p class="status"></p><small>Approval: human curriculum review required</small>`;
    card.querySelector("strong").textContent=item.title;
    card.querySelector("p").textContent=`${item.complete_sessions}/${item.minimum_sessions} complete sessions · ${item.distinct_participants} distinct participants`;
    const statusNode=card.querySelector(".status"); statusNode.textContent=status; statusNode.classList.add(item.evidence_complete&&!item.revision_required?"ready":"warning");
    return card;
  }));
};
const buildRecord=()=>{
  const record=createObservationRecord(protocol,clusterSelect.value);
  record.participant={code:byId("participantCode").value,adult_confirmed:byId("adultConfirmed").checked,recent_study:byId("recentStudy").checked,consent_confirmed:byId("consentConfirmed").checked};
  record.context={language:byId("language").value,device:byId("device").value,observer_code:byId("observerCode").value};
  record.conduct={uncoached_confirmed:byId("uncoachedConfirmed").checked,intervention_count:Number(byId("interventionCount").value)};
  record.evidence={own_words:byId("ownWords").value,new_example:byId("newExample").value,wrong_answer_reasoning:byId("wrongAnswer").value,transfer_reasoning:byId("transfer").value,undefined_or_abrupt:byId("undefined").value,hesitations_and_changes:byId("hesitations").value,interventions:byId("interventions").value};
  record.findings={blocking_issue:byId("blockingIssue").checked,issue_tags:[...byId("issueTags").querySelectorAll("input:checked")].map(input=>input.value),notes:byId("findingNotes").value};
  return record;
};
const resetForm=()=>{byId("recordForm").reset(); clusterSelect.value=protocol.clusters[0].id; byId("interventionCount").value="0"; byId("errors").hidden=true; renderProtocol();};

clusterSelect.addEventListener("change",renderProtocol);
byId("recordForm").addEventListener("submit",event=>{
  event.preventDefault();
  const draft=buildRecord(); const validation=validateObservationRecord(draft,protocol); const errors=byId("errors");
  if(!validation.valid){errors.hidden=false;errors.innerHTML=`<strong>Record is incomplete.</strong><ul>${validation.errors.map(error=>`<li>${error}</li>`).join("")}</ul>`;errors.focus();return;}
  const record=finalizeObservationRecord(draft,protocol); const records=loadRecords(); records.push(record); saveRecords(records);
  errors.hidden=false; errors.textContent=record.disposition==="revision_required"?"Saved locally. This record requires revision review.":"Saved locally. This record is ready for human curriculum review.";
  renderSummary();
});
byId("newButton").addEventListener("click",resetForm);
byId("exportButton").addEventListener("click",()=>{
  const records=loadRecords(); const payload={schema_version:"1.0",protocol_id:protocol.protocol_id,exported_at:new Date().toISOString(),records,summaries:summarizeObservationRecords(records,protocol)};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));
  const link=document.createElement("a"); link.href=url; link.download=`atlas-observation-records-${new Date().toISOString().slice(0,10)}.json`; link.click(); URL.revokeObjectURL(url);
});

resetForm(); renderSummary();
