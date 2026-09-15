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

export function getUnderstandingSignals(lesson,events=[],index=0){
  const evidence=new Set((Array.isArray(events)?events:[]).map(event=>event?.payload?.evidence).filter(Boolean));
  const compared=index>=1;
  const equation=evidence.has("subtraction_as_comparison");
  if(lesson?.concepts?.primary_concept==="compare_unknown"){
    return {compared,concept:evidence.has("identified_compared_unknown"),equation,conceptLabel:"Identified the unknown compared amount"};
  }
  return {compared,concept:evidence.has("identified_gap"),equation,conceptLabel:"Identified the gap"};
}

const ANALYTICS_COPY={
  en:{lessonComplete:"Lesson complete",completedAttempts:"Completed attempts",historyCorrect:"History correct",historyRetries:"History retries",historyHints:"History hints",historyAccuracy:"History accuracy",lesson:"Lesson",understanding:"Understanding",currentAttempt:"Current attempt",correct:"correct",retries:"retries",hints:"hints",compared:"Compared the two groups visually",gap:"Identified the gap",unknown:"Identified the unknown compared amount",equation:"Connected the comparison to subtraction",strength:"Strength",connected:"You connected the visual model to the equation.",keepComparing:"Keep comparing the known information with what the question asks you to find.",nextFocus:"Next Focus",practice:"Practice",practiceEquation:"Practice choosing the subtraction equation that matches the comparison.",moveNext:"Move to the next comparison lesson."},
  es:{lessonComplete:"Lección completada",completedAttempts:"Intentos completados",historyCorrect:"Correctas anteriores",historyRetries:"Reintentos anteriores",historyHints:"Pistas anteriores",historyAccuracy:"Precisión anterior",lesson:"Lección",understanding:"Comprensión",currentAttempt:"Intento actual",correct:"correctas",retries:"reintentos",hints:"pistas",compared:"Comparó visualmente los dos grupos",gap:"Identificó la diferencia",unknown:"Identificó la cantidad comparada desconocida",equation:"Relacionó la comparación con la resta",strength:"Fortaleza",connected:"Relacionaste el modelo visual con la ecuación.",keepComparing:"Sigue comparando la información conocida con lo que la pregunta pide encontrar.",nextFocus:"Próximo enfoque",practice:"Practica",practiceEquation:"Practica cómo elegir la ecuación de resta que corresponde a la comparación.",moveNext:"Continúa a la próxima lección de comparación."}
};

export function showAnalytics(lesson,analytics,index,progress,lessonRecords=[],language="en"){
  const copy=ANALYTICS_COPY[language==="es"?"es":"en"];
  const s=analytics.summary();
  const history=summarizeLearningHistory(lessonRecords);
  document.getElementById("analyticsSummary").innerHTML=
    `<div class="analyticsMetric"><strong>${progress}%</strong><span>${copy.lessonComplete}</span></div>`+
    `<div class="analyticsMetric"><strong>${history.completedAttempts}</strong><span>${copy.completedAttempts}</span></div>`+
    `<div class="analyticsMetric"><strong>${history.correct}</strong><span>${copy.historyCorrect}</span></div>`+
    `<div class="analyticsMetric"><strong>${history.wrong}</strong><span>${copy.historyRetries}</span></div>`+
    `<div class="analyticsMetric"><strong>${history.hints}</strong><span>${copy.historyHints}</span></div>`+
    `<div class="analyticsMetric"><strong>${history.accuracy}%</strong><span>${copy.historyAccuracy}</span></div>`;
  const signals=getUnderstandingSignals(lesson,s.events,index);
  const conceptLabel=lesson?.concepts?.primary_concept==="compare_unknown"?copy.unknown:copy.gap;
  const lines=[`${copy.lesson}: ${lesson.metadata.title}`,"",copy.understanding];
  lines.push(`${copy.currentAttempt}: ${s.correct} ${copy.correct}, ${s.wrong} ${copy.retries}, ${s.hints} ${copy.hints}`);
  lines.push((signals.compared?"✓":"□")+` ${copy.compared}`);
  lines.push((signals.concept?"✓":"□")+` ${conceptLabel}`);
  lines.push((signals.equation?"✓":"□")+` ${copy.equation}`);
  lines.push("",copy.strength);
  lines.push(signals.concept&&signals.equation?copy.connected:signals.concept?conceptLabel+".":copy.keepComparing);
  lines.push("",copy.nextFocus);
  lines.push(!signals.concept?`${copy.practice}: ${conceptLabel}.`:!signals.equation?copy.practiceEquation:copy.moveNext);
  document.getElementById("analyticsDetails").textContent=lines.join("\n");
  document.getElementById("analyticsModal").style.display="flex";
  document.getElementById("analyticsModal").setAttribute("aria-hidden","false");
}
