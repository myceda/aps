import { gradeMappings } from "@/data/demo-data";
import { createGradeMap, getGradeMapping } from "@/lib/analysis/status";
import type { GradeMapping, SimulationCourseInput, SimulationResult, TranscriptCourse, TranscriptSummary } from "@/lib/types";

export function simulateGpax(
  transcriptCourses: TranscriptCourse[],
  selectedCourses: SimulationCourseInput[],
  targetGpax: number,
  mappings: GradeMapping[] = gradeMappings,
  currentSummary?: TranscriptSummary
): SimulationResult {
  const gradeMap = createGradeMap(mappings);
  let currentCredits = currentSummary?.creditAttempt ?? 0;
  let currentGradePoints = currentSummary?.gradePoint ?? 0;

  if (!currentSummary) {
    for (const course of transcriptCourses) {
      const grade = getGradeMapping(course.gradeChar, gradeMap);
      if (!grade.isAttempt) continue;
      currentCredits += course.credits;
      currentGradePoints += course.credits * grade.gradePoint;
    }
  }

  let simulatedCredits = currentCredits;
  let simulatedGradePoints = currentGradePoints;

  for (const course of selectedCourses) {
    const grade = getGradeMapping(course.expectedGradeChar, gradeMap);
    simulatedCredits += course.credits;
    simulatedGradePoints += course.credits * grade.gradePoint;
  }

  const currentGpax = currentSummary?.gpax ?? (currentCredits === 0 ? 0 : Number((currentGradePoints / currentCredits).toFixed(2)));
  const simulatedGpax = simulatedCredits === 0 ? 0 : Number((simulatedGradePoints / simulatedCredits).toFixed(2));

  return {
    currentGpax,
    targetGpax,
    simulatedGpax,
    reachesTarget: simulatedGpax >= targetGpax,
    requiredAverageForRemaining: selectedCourses.length === 0 ? undefined : targetGpax
  };
}
