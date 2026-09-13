export function createAnalytics(initialEvents=[]){
  const events=[...initialEvents];
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

export function showAnalytics(lesson,analytics,index,progress,lessonRecords=[]){
  const s=analytics.summary();
  const completedAttempts=lessonRecords.reduce((total,record)=>total+(record.priorCompletedAttempts?.length||0)+(record.currentAttempt?.completed?1:0),0);
  document.getElementById("analyticsSummary").innerHTML=
    `<div class="analyticsMetric"><strong>${progress}%</strong><span>Lesson complete</span></div>`+
    `<div class="analyticsMetric"><strong>${completedAttempts}</strong><span>Completed attempts</span></div>`+
    `<div class="analyticsMetric"><strong>${s.correct}</strong><span>Correct answers</span></div>`+
    `<div class="analyticsMetric"><strong>${s.wrong}</strong><span>Retries</span></div>`+
    `<div class="analyticsMetric"><strong>${s.hints}</strong><span>Hints used</span></div>`+
    `<div class="analyticsMetric"><strong>${s.accuracy}%</strong><span>Accuracy</span></div>`;
  const identifiedGap=s.events.some(e=>e.payload?.evidence==="identified_gap");
  const choseEquation=s.events.some(e=>e.payload?.evidence==="subtraction_as_comparison");
  const lines=[`Lesson: ${lesson.metadata.title}`,"","Understanding"];
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
