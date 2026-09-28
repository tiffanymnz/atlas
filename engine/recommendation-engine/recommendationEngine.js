export function recommendNext(lesson, summary, screen, hasNext,language="en"){
  if(summary.wrong > 1) return language==="es"?"Repasa la diferencia visual antes de continuar.":"Review the visual gap before moving on.";
  if(hasNext) return screen.nextRecommendation || (language==="es"?"Continúa a la próxima lección":"Continue to the next lesson");
  if(lesson?.concepts?.primary_concept==="counting") return screen.nextRecommendation;
  return language==="es"?"Elige otro tema en la lista de lecciones.":"Choose another topic from the lesson picker.";
}
