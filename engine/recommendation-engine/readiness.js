// Completion records that a learner reached the end. Readiness asks whether the
// three later checks were answered correctly before any answer or hint was given.
const CHECKS=["independentPractice","recall","transfer"];

export function assessNextLessonReadiness(lesson,events=[]){
  const missing=[];
  for(const type of CHECKS){
    const screenIndex=lesson.screens.findIndex(screen=>screen.type===type);
    if(screenIndex<0){ missing.push(type); continue; }
    const attempts=events.filter(event=>event?.screen===screenIndex &&
      ["submit","hint","guided_retry"].includes(event.type));
    if(attempts[0]?.type!=="submit" || attempts[0]?.payload?.correct!==true) missing.push(type);
  }
  return {ready:missing.length===0,needsPractice:missing};
}
