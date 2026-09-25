export const RECORD_SCHEMA_VERSION="1.0";

const clean=value=>String(value??"").trim();

export function createObservationRecord(protocol,clusterId){
  const cluster=protocol.clusters.find(item=>item.id===clusterId);
  if(!cluster) throw new Error(`Unknown observation cluster: ${clusterId}`);
  return {
    schema_version:RECORD_SCHEMA_VERSION,
    protocol_id:protocol.protocol_id,
    session_id:globalThis.crypto?.randomUUID?.()??`session-${Date.now()}`,
    recorded_at:new Date().toISOString(),
    cluster_id:cluster.id,
    lesson_ids:[...cluster.lesson_ids],
    participant:{code:"",adult_confirmed:false,recent_study:false,consent_confirmed:false},
    context:{language:"en",device:"",observer_code:""},
    conduct:{uncoached_confirmed:false,intervention_count:0},
    evidence:{own_words:"",new_example:"",wrong_answer_reasoning:"",transfer_reasoning:"",undefined_or_abrupt:"",hesitations_and_changes:"",interventions:""},
    findings:{blocking_issue:false,issue_tags:[],notes:""},
    disposition:"incomplete"
  };
}

export function validateObservationRecord(record,protocol){
  const errors=[];
  const cluster=protocol.clusters.find(item=>item.id===record?.cluster_id);
  if(record?.schema_version!==RECORD_SCHEMA_VERSION) errors.push("Unsupported record schema.");
  if(record?.protocol_id!==protocol.protocol_id) errors.push("Record protocol does not match.");
  if(!cluster) errors.push("Select a valid cluster.");
  if(!clean(record?.participant?.code)) errors.push("Participant code is required.");
  if(!record?.participant?.adult_confirmed) errors.push("Confirm that the participant is an adult.");
  if(record?.participant?.recent_study) errors.push("A participant who recently studied the material is not eligible for first-exposure evidence.");
  if(!record?.participant?.consent_confirmed) errors.push("Confirm observation consent.");
  if(!clean(record?.context?.observer_code)) errors.push("Observer code is required.");
  if(!clean(record?.context?.device)) errors.push("Device and browser are required.");
  if(!record?.conduct?.uncoached_confirmed) errors.push("Confirm that the attempt was uncoached.");
  for(const [key,label] of Object.entries({
    own_words:"own-words explanation",
    new_example:"new example",
    wrong_answer_reasoning:"wrong-answer reasoning",
    transfer_reasoning:"transfer reasoning",
    undefined_or_abrupt:"undefined or abrupt content response",
    hesitations_and_changes:"hesitations and answer changes"
  })) if(clean(record?.evidence?.[key]).length<12) errors.push(`Record a substantive ${label}.`);
  const count=Number(record?.conduct?.intervention_count);
  if(!Number.isInteger(count)||count<0) errors.push("Intervention count must be a non-negative whole number.");
  if(count>0&&!clean(record?.evidence?.interventions)) errors.push("Describe every facilitator intervention.");
  if(record?.findings?.blocking_issue&&!clean(record?.findings?.notes)) errors.push("Describe the blocking issue.");
  return {valid:errors.length===0,errors};
}

export function finalizeObservationRecord(record,protocol){
  const validation=validateObservationRecord(record,protocol);
  return {
    ...record,
    recorded_at:new Date().toISOString(),
    disposition:validation.valid?(record.findings.blocking_issue?"revision_required":"ready_for_human_review"):"incomplete"
  };
}

export function summarizeObservationRecords(records,protocol){
  return protocol.clusters.map(cluster=>{
    const eligible=records.filter(record=>record.cluster_id===cluster.id&&validateObservationRecord(record,protocol).valid);
    const participants=new Set(eligible.map(record=>clean(record.participant.code).toLowerCase()));
    const revisionRequired=eligible.some(record=>record.findings.blocking_issue||record.disposition==="revision_required");
    return {
      cluster_id:cluster.id,
      title:cluster.title,
      complete_sessions:eligible.length,
      distinct_participants:participants.size,
      minimum_sessions:protocol.minimum_sessions_per_cluster,
      evidence_complete:eligible.length>=protocol.minimum_sessions_per_cluster&&participants.size>=protocol.minimum_sessions_per_cluster,
      revision_required:revisionRequired,
      approval:"human_curriculum_review_required"
    };
  });
}
