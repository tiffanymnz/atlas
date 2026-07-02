export function recommendNext(lesson, summary, screen, hasNext){
  if(summary.wrong > 1) return "Review the visual gap before moving on.";
  if(hasNext) return screen.nextRecommendation || "Continue to the next lesson";
  return screen.nextRecommendation || "Lesson complete.";
}
