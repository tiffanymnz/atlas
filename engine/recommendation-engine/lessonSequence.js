// Next-lesson shortcuts stay within a taught category. The counting and
// matching foundations are still incomplete, so they cannot automatically
// promote a learner to the next category. The picker supports independent
// review and test access.
const NEXT=new Map([
  ["comparison.more","comparison.fewer"],
  ["comparison.fewer","difference"],
  ["difference","compare_unknown"],
  ["division.shared_equally","fractions.numerator_denominator"],
  ["fractions.numerator_denominator","percent.basics"],
  ["geometry.area","geometry.perimeter"],
  ["inequalities.at_least","inequalities.no_more_than"]
]);

export function continuesConceptSequence(current,next){
  return NEXT.get(current?.concepts?.primary_concept)===next?.concepts?.primary_concept;
}

export function nextConceptId(current){ return NEXT.get(current?.concepts?.primary_concept) ?? null; }
