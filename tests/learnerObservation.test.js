import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {createObservationRecord,finalizeObservationRecord,summarizeObservationRecords,validateObservationRecord} from "../engine/review/observationRecord.js";

const protocol=JSON.parse(fs.readFileSync(new URL("../curriculum/reviews/learner_observation_protocol_v1.json",import.meta.url)));
const complete=(cluster,participant)=>{
  const record=createObservationRecord(protocol,cluster);
  record.participant={code:participant,adult_confirmed:true,recent_study:false,consent_confirmed:true};
  record.context={language:"en",device:"iPhone Safari",observer_code:"OBS-1"};
  record.conduct={uncoached_confirmed:true,intervention_count:0};
  record.evidence={
    own_words:"The learner explained the idea without repeating the displayed hook.",
    new_example:"The learner rebuilt a different example and described every step.",
    wrong_answer_reasoning:"The learner explained why the plausible distractor used the wrong relationship.",
    transfer_reasoning:"The learner applied the idea in a new context and justified the result.",
    undefined_or_abrupt:"The learner reported that no wording felt undefined or abrupt in this attempt.",
    hesitations_and_changes:"The learner paused at the visual, then continued without changing the answer.",
    interventions:""
  };
  return finalizeObservationRecord(record,protocol);
};

test("protocol defines three independent clusters and never grants automatic approval",()=>{
  assert.equal(protocol.schema_version,"1.0");
  assert.equal(protocol.minimum_sessions_per_cluster,2);
  assert.deepEqual(protocol.clusters.map(cluster=>cluster.lesson_ids),[["lesson005","lesson006","lesson007"],["lesson008","lesson009"],["lesson010","lesson011"]]);
  assert.match(protocol.facilitator_rules.join(" "),/Do not mark a cluster approved/i);
});

test("records reject coached, ineligible, thin, or unexplained intervention evidence",()=>{
  const record=createObservationRecord(protocol,"division_fraction_percent");
  record.participant.recent_study=true;
  record.conduct.intervention_count=1;
  const result=validateObservationRecord(record,protocol);
  assert.equal(result.valid,false);
  assert.ok(result.errors.some(error=>/recently studied/i.test(error)));
  assert.ok(result.errors.some(error=>/intervention/i.test(error)));
  assert.ok(result.errors.some(error=>/substantive/i.test(error)));
});

test("two distinct complete sessions make evidence reviewable, not approved",()=>{
  const records=[complete("area_perimeter","P-001"),complete("area_perimeter","P-002")];
  const area=summarizeObservationRecords(records,protocol).find(item=>item.cluster_id==="area_perimeter");
  assert.equal(area.evidence_complete,true);
  assert.equal(area.distinct_participants,2);
  assert.equal(area.approval,"human_curriculum_review_required");
});

test("duplicate participant codes do not satisfy the independent-session gate",()=>{
  const records=[complete("inclusive_inequalities","P-001"),complete("inclusive_inequalities","p-001")];
  const inequality=summarizeObservationRecords(records,protocol).find(item=>item.cluster_id==="inclusive_inequalities");
  assert.equal(inequality.complete_sessions,2);
  assert.equal(inequality.distinct_participants,1);
  assert.equal(inequality.evidence_complete,false);
});

test("a blocking issue routes evidence to revision rather than approval",()=>{
  const record=complete("division_fraction_percent","P-009");
  record.findings={blocking_issue:true,issue_tags:["undefined_prerequisite"],notes:"The learner could not continue until an undeclared operation was explained."};
  const finalized=finalizeObservationRecord(record,protocol);
  assert.equal(finalized.disposition,"revision_required");
  const summary=summarizeObservationRecords([finalized],protocol)[0];
  assert.equal(summary.revision_required,true);
  assert.equal(summary.approval,"human_curriculum_review_required");
});
