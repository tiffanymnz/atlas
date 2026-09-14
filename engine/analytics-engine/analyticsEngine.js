export function createAnalytics(initialEvents=[]){
  const events=Array.isArray(initialEvents)?[...initialEvents]:[];
  return {
    record(event){ events.push({...event,time:new Date().toISOString()}); },
    events(){ return [...events]; },
    summary(){
      const attempts=events.filter(e=>e.type==="submit").length;
      const correct=events.filter(e=>e.type==="submit"&&e.payload?.correct===true).length;
      const wrong=events.filter(e=>e.type==="submit"&&e.payload?.correct===false).length;
      const hints=events.filter(e=>e.type==="hint"||e.type==="guided_retry").length;
      return {attempts,correct,wrong,hints,accuracy:attempts?Math.round(correct/attempts*100):0,events:[...events]};
    }
  };
}

export function summarizeLearningHistory(lessonRecords=[]){
  const completedAttempts=[];
  for(const record of lessonRecords){
    if(Array.isArray(record?.priorCompletedAttempts)) completedAttempts.push(...record.priorCompletedAttempts.filter(attempt=>attempt?.completed));
    if(record?.currentAttempt?.completed) completedAttempts.push(record.currentAttempt);
  }
  const events=completedAttempts.flatMap(attempt=>Array.isArray(attempt.events)?attempt.events:[]);
  const correct=events.filter(event=>event.type==="submit"&&event.payload?.correct===true).length;
  const wrong=events.filter(event=>event.type==="submit"&&event.payload?.correct===false).length;
  const hints=events.filter(event=>event.type==="hint"||event.type==="guided_retry").length;
  const answers=correct+wrong;
  return {completedAttempts:completedAttempts.length,correct,wrong,hints,accuracy:answers?Math.round(correct/answers*100):0};
}

export function showAnalytics(lesson,analytics,index,progress,lessonRecords=[]){
  const s=analytics.summary();
  const history=summarizeLearningHistory(lessonRecords);
  document.getElementById("analyticsSummary").innerHTML=
    `<div class="analyticsMetric"><strong>${progress}%</strong><span>Lesson complete</span></div>`+
    `<div class="analyticsMetric"><strong>${history.completedAttempts}</strong><span>Completed attempts</span></div>`+
    `<div class="analyticsMetric"><strong>${history.correct}</strong><span>History correct</span></div>`+
    `<div class="analyticsMetric"><strong>${history.wrong}</strong><span>History retries</span></div>`+
    `<div class="analyticsMetric"><strong>${history.hints}</strong><span>History hints</span></div>`+
    `<div class="analyticsMetric"><strong>${history.accuracy}%</strong><span>History accuracy</span></div>`;
  const identifiedGap=s.events.some(e=>e.payload?.evidence==="identified_gap");
  const choseEquation=s.events.some(e=>e.payload?.evidence==="subtraction_as_comparison");
  const lines=[`Lesson: ${lesson.metadata.title}`,"","Understanding"];
  lines.push(`Current attempt: ${s.correct} correct, ${s.wrong} retries, ${s.hints} hints`);
  lines.push((index>=1?"✓":"□")+" Compared the two groups visually");
  lines.push((identifiedGap?"✓":"□")+" Identified the gap");
  lines.push((choseEquation?"✓":"□")+" Connected the gap to subtraction");
  lines.push("","Strength");
  lines.push(identifiedGap&&choseEquation?"You connected the visual model to the equation.":identifiedGap?"You identified the gap visually.":"Keep looking for what does not match.");
  lines.push("","Next Focus");
  lines.push(!identifiedGap?"Find the part of the longer row that does not have a match.":!choseEquation?"Practice choosing the equation that measures the gap.":"Move to the next comparison lesson.");
  document.getElementById("analyticsDetails").textContent=lines.join("\n");
  document.getElementById("analyticsModal").style.display="flex";
  document.getElementById("analyticsModal").setAttribute("aria-hidden","false");
}
