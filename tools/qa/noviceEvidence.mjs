import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL("../..",import.meta.url));
export function evaluateFirstExposure(protocol,records){
  const errors=[],seen=new Set();
  if(records.protocol_id!==protocol.id) errors.push("protocol ID mismatch");
  for(const s of records.sessions||[]){
    if(!s.code||seen.has(s.code)) errors.push("missing or duplicate participant code");seen.add(s.code);
    if(!protocol.claimed_locales.includes(s.locale)||s.prior_exposure!==false||s.can_already_solve!==false||s.coached!==false||s.critical_barrier!==false||s.consent!==true) errors.push(`${s.code}: ineligible or coached`);
    for(const check of protocol.checks){
      const result=s.checks?.[check.id];
      if(!result||result.passed!==true||result.first_response_correct!==true||result.hint_used!==false||!result.explanation?.trim()||(check.id==="delayed"&&(!Number.isFinite(result.hours_since_lesson)||result.hours_since_lesson<24))) errors.push(`${s.code}: ${check.id} lacks uncoached evidence`);
    }
  }
  for(const locale of protocol.claimed_locales){const count=(records.sessions||[]).filter(s=>s.locale===locale).length;if(count<protocol.minimum_independent_learners_per_locale) errors.push(`${locale}: ${count}/${protocol.minimum_independent_learners_per_locale} sessions`);}
  return {ready:errors.length===0,errors};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const protocol=JSON.parse(await readFile(resolve(root,"curriculum/reviews/comparison_first_exposure_protocol_v1.json")));
  const records=JSON.parse(await readFile(resolve(root,"curriculum/reviews/comparison_first_exposure_records_v1.json")));
  const result=evaluateFirstExposure(protocol,records);
  if(result.ready) console.log("First-exposure evidence gate passed.");
  else {console.error(`First-exposure gate pending:\n${result.errors.join("\n")}`);process.exitCode=1;}
}
