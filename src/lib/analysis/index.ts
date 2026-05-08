import { demoTranscriptCourses, demoTranscriptSummaries } from "@/data/demo-data";
import { auditCurriculum, summarizeRisk } from "@/lib/analysis/curriculum-audit";
import { analyzePrerequisiteImpact, buildCourseDependencies } from "@/lib/analysis/prerequisite-impact";
import { buildRecommendations } from "@/lib/analysis/recommendation";
import { checkReadiness } from "@/lib/analysis/rule-checker";
import {
  calculateGpax,
  calculateLatestTermGpa,
  createGradeMap,
  getLatestTranscriptSummary
} from "@/lib/analysis/status";
import { getAnalysisData, getDemoUserId, saveAnalysisResult } from "@/lib/db/repository";
import type { AnalysisResult, ProgramCode, TranscriptCourse } from "@/lib/types";

export function analyzeAcademicPlan(
  programCode: ProgramCode = "CS2565",
  transcriptCourses: TranscriptCourse[] = demoTranscriptCourses
): AnalysisResult {
  const audit = auditCurriculum(programCode, transcriptCourses);
  const prerequisiteImpacts = analyzePrerequisiteImpact(programCode, transcriptCourses);
  const calculated = calculateGpax(transcriptCourses);
  const latestSummary = getLatestTranscriptSummary(demoTranscriptSummaries);
  const latestSemesterGpa = calculateLatestTermGpa(transcriptCourses);
  const gpax = latestSummary?.gpax ?? calculated.gpax;
  const latestGpa = latestSummary?.gpa && latestSummary.gpa > 0 ? latestSummary.gpa : latestSemesterGpa || gpax;
  const partial = {
    gpax,
    latestGpa,
    earnedCredits: audit.earnedCredits,
    totalCreditsMin: audit.program.totalCreditsMin,
    missingCredits: audit.missingCredits,
    riskStatus: "normal" as const,
    categoryProgress: audit.categoryProgress,
    courseStatuses: audit.courseStatuses,
    prerequisiteImpacts,
    courseDependencies: buildCourseDependencies(programCode, audit.courseStatuses),
    readiness: checkReadiness(audit.program, audit.courseStatuses, audit.earnedCredits, gpax)
  };
  const riskStatus = summarizeRisk({ missingCredits: audit.missingCredits, prerequisiteImpacts });
  const result = { ...partial, riskStatus };

  return {
    ...result,
    recommendations: buildRecommendations(result)
  };
}

export async function analyzeAcademicPlanFromDatabase(programCode: ProgramCode = "CS2565", userId?: number): Promise<AnalysisResult> {
  const resolvedUserId = userId ?? (await getDemoUserId());
  const data = await getAnalysisData(resolvedUserId, programCode);

  if (data.transcriptCourses.length === 0 && data.transcriptSummaries.length === 0) {
    return {
      gpax: 0,
      latestGpa: 0,
      earnedCredits: 0,
      totalCreditsMin: 0,
      missingCredits: 0,
      riskStatus: "normal",
      categoryProgress: [],
      courseStatuses: [],
      prerequisiteImpacts: [],
      courseDependencies: [],
      readiness: [],
      recommendations: []
    };
  }

  const audit = auditCurriculum(programCode, data.transcriptCourses, data);
  const prerequisiteImpacts = analyzePrerequisiteImpact(programCode, data.transcriptCourses, data);
  const calculated = calculateGpax(data.transcriptCourses, createGradeMap(data.gradeMappings));
  const latestSummary = getLatestTranscriptSummary(data.transcriptSummaries);
  const latestSemesterGpa = calculateLatestTermGpa(data.transcriptCourses, createGradeMap(data.gradeMappings));
  const gpax = latestSummary?.gpax ?? calculated.gpax;
  const latestGpa = latestSummary?.gpa && latestSummary.gpa > 0 ? latestSummary.gpa : latestSemesterGpa || gpax;
  const partial = {
    gpax,
    latestGpa,
    earnedCredits: audit.earnedCredits,
    totalCreditsMin: audit.program.totalCreditsMin,
    missingCredits: audit.missingCredits,
    riskStatus: "normal" as const,
    categoryProgress: audit.categoryProgress,
    courseStatuses: audit.courseStatuses,
    prerequisiteImpacts,
    courseDependencies: buildCourseDependencies(programCode, audit.courseStatuses, data),
    readiness: checkReadiness(audit.program, audit.courseStatuses, audit.earnedCredits, gpax)
  };
  const riskStatus = summarizeRisk({ missingCredits: audit.missingCredits, prerequisiteImpacts });
  const result = { ...partial, riskStatus };

  return {
    ...result,
    recommendations: buildRecommendations(result)
  };
}

export async function analyzeAndPersistAcademicPlan(programCode: ProgramCode = "CS2565", userId?: number) {
  const resolvedUserId = userId ?? (await getDemoUserId());
  const analysis = await analyzeAcademicPlanFromDatabase(programCode, resolvedUserId);
  await saveAnalysisResult(
    resolvedUserId,
    analysis.riskStatus,
    `GPAX ${analysis.gpax.toFixed(2)}, earned ${analysis.earnedCredits}/${analysis.totalCreditsMin} credits`,
    analysis.recommendations
  );

  return analysis;
}
