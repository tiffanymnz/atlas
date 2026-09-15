export function recommendNext(lesson, summary, screen, hasNext,language="en"){
  if(summary.wrong > 1) return language==="es"?"Repasa la diferencia visual antes de continuar.":"Review the visual gap before moving on.";
  if(hasNext) return screen.nextRecommendation || (language==="es"?"Continúa a la próxima lección":"Continue to the next lesson");
  return screen.nextRecommendation || (language==="es"?"Lección completada.":"Lesson complete.");
}
