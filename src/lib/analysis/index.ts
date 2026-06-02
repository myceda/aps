import {
  demoCourses,
  demoPrerequisites,
  demoPrograms,
  demoStudyPlan,
  demoTranscriptCourses,
  demoTranscriptSummaries,
  gradeMappings,
  summerOfferings
} from "@/data/demo-data";
import { auditCurriculum, summarizeRisk } from "@/lib/analysis/curriculum-audit";
import { buildGraduationForecast } from "@/lib/analysis/graduation-forecast";
import { analyzePrerequisiteImpact, buildCourseDependencies } from "@/lib/analysis/prerequisite-impact";
import { evaluateProStatus } from "@/lib/analysis/pro-status";
import { buildRecommendations } from "@/lib/analysis/recommendation";
import { checkReadiness } from "@/lib/analysis/rule-checker";
import {
  calculateGpax,
  calculateLatestTermGpa,
  createGradeMap,
  getLatestTranscriptSummary
} from "@/lib/analysis/status";
import { getAnalysisData, getDemoUserId, saveAnalysisResult } from "@/lib/db/repository";
import type { AnalysisResult, ProgramCode, RiskStatus, TranscriptCourse } from "@/lib/types";

export function analyzeAcademicPlan(
  programCode: ProgramCode = getDefaultDemoProgramCode(),
  transcriptCourses: TranscriptCourse[] = demoTranscriptCourses
): AnalysisResult {
  const demoData = {
    courses: demoCourses,
    prerequisites: demoPrerequisites,
    studyPlan: demoStudyPlan,
    gradeMappings,
    summerOfferings,
    transcriptCourses,
    transcriptSummaries: demoTranscriptSummaries
  };
  const audit = auditCurriculum(programCode, transcriptCourses);
  const prerequisiteImpacts = analyzePrerequisiteImpact(programCode, transcriptCourses, demoData);
  const calculated = calculateGpax(transcriptCourses);
  const latestSummary = getLatestTranscriptSummary(demoTranscriptSummaries);
  const latestSemesterGpa = calculateLatestTermGpa(transcriptCourses);
  const gpax = latestSummary?.gpax ?? calculated.gpax;
  const latestGpa = latestSummary?.gpa && latestSummary.gpa > 0 ? latestSummary.gpa : latestSemesterGpa || gpax;
  const proStatus = evaluateProStatus({
    gpax,
    latestGpa,
    earnedCredits: audit.earnedCredits,
    totalCreditsMin: audit.program.totalCreditsMin,
    courseStatuses: audit.courseStatuses,
    prerequisiteImpacts
  });
  const partial = {
    gpax,
    latestGpa,
    earnedCredits: audit.earnedCredits,
    totalCreditsMin: audit.program.totalCreditsMin,
    missingCredits: audit.missingCredits,
    riskStatus: "normal" as const,
    proStatus,
    categoryProgress: audit.categoryProgress,
    courseStatuses: audit.courseStatuses,
    prerequisiteImpacts,
    courseDependencies: buildCourseDependencies(programCode, audit.courseStatuses, demoData),
    graduationForecast: buildGraduationForecast(programCode, audit.courseStatuses, demoData),
    readiness: checkReadiness(audit.program, audit.courseStatuses, audit.earnedCredits, gpax)
  };
  const riskStatus = mergeRiskStatus(summarizeRisk({ missingCredits: audit.missingCredits, prerequisiteImpacts }), proStatus.tone);
  const result = { ...partial, riskStatus };

  return {
    ...result,
    recommendations: buildRecommendations(result)
  };
}

export async function analyzeAcademicPlanFromDatabase(programCode: ProgramCode, userId?: number): Promise<AnalysisResult> {
  const resolvedUserId = userId ?? (await getDemoUserId());
  const data = await getAnalysisData(resolvedUserId, programCode);

  if (data.transcriptCourses.length === 0 && data.transcriptSummaries.length === 0) {
    return buildEmptyAnalysisResult();
  }

  const audit = auditCurriculum(programCode, data.transcriptCourses, data);
  const prerequisiteImpacts = analyzePrerequisiteImpact(programCode, data.transcriptCourses, data);
  const gradeMap = createGradeMap(data.gradeMappings);
  const calculated = calculateGpax(data.transcriptCourses, gradeMap);
  const latestSummary = getLatestTranscriptSummary(data.transcriptSummaries);
  const latestSemesterGpa = calculateLatestTermGpa(data.transcriptCourses, gradeMap);
  const gpax = latestSummary?.gpax ?? calculated.gpax;
  const latestGpa = latestSummary?.gpa && latestSummary.gpa > 0 ? latestSummary.gpa : latestSemesterGpa || gpax;
  const proStatus = evaluateProStatus({
    gpax,
    latestGpa,
    earnedCredits: audit.earnedCredits,
    totalCreditsMin: audit.program.totalCreditsMin,
    courseStatuses: audit.courseStatuses,
    prerequisiteImpacts
  });
  const partial = {
    gpax,
    latestGpa,
    earnedCredits: audit.earnedCredits,
    totalCreditsMin: audit.program.totalCreditsMin,
    missingCredits: audit.missingCredits,
    riskStatus: "normal" as const,
    proStatus,
    categoryProgress: audit.categoryProgress,
    courseStatuses: audit.courseStatuses,
    prerequisiteImpacts,
    courseDependencies: buildCourseDependencies(programCode, audit.courseStatuses, data),
    graduationForecast: buildGraduationForecast(programCode, audit.courseStatuses, data),
    readiness: checkReadiness(audit.program, audit.courseStatuses, audit.earnedCredits, gpax)
  };
  const riskStatus = mergeRiskStatus(summarizeRisk({ missingCredits: audit.missingCredits, prerequisiteImpacts }), proStatus.tone);
  const result = { ...partial, riskStatus };

  return {
    ...result,
    recommendations: buildRecommendations(result)
  };
}

export async function analyzeAndPersistAcademicPlan(programCode: ProgramCode, userId?: number) {
  const resolvedUserId = userId ?? (await getDemoUserId());
  const analysis = await analyzeAcademicPlanFromDatabase(programCode, resolvedUserId);
  await saveAnalysisResult(
    resolvedUserId,
    analysis.riskStatus,
    `GPAX ${analysis.gpax.toFixed(2)}, ผ่านแล้ว ${analysis.earnedCredits}/${analysis.totalCreditsMin} หน่วยกิต`,
    analysis.recommendations
  );

  return analysis;
}

function buildEmptyAnalysisResult(): AnalysisResult {
  return {
    gpax: 0,
    latestGpa: 0,
    earnedCredits: 0,
    totalCreditsMin: 0,
    missingCredits: 0,
    riskStatus: "normal",
    proStatus: {
      level: "normal",
      label: "ปกติ",
      tone: "normal",
      summary: "ยังไม่มี transcript ที่ยืนยันแล้ว ระบบจึงยังประเมินสถานะโปรไม่ได้",
      reasons: [
        {
          title: "ยังไม่มีข้อมูลผลการเรียน",
          detail: "กรุณาอัปโหลดและยืนยัน transcript ก่อนให้ระบบประเมินสถานะโปร",
          severity: "normal"
        }
      ],
      nextActions: ["อัปโหลด transcript และตรวจข้อมูลรายวิชาก่อนยืนยัน"]
    },
    categoryProgress: [],
    courseStatuses: [],
    prerequisiteImpacts: [],
    courseDependencies: [],
    graduationForecast: {
      canGraduate: false,
      remainingCredits: 0,
      plannedCredits: 0,
      terms: [],
      blockedCourses: [],
      notes: ["กรุณาอัปโหลดและยืนยัน transcript ก่อนใช้งานการคาดการณ์แผนจบ"]
    },
    readiness: [],
    recommendations: []
  };
}

function getDefaultDemoProgramCode() {
  return demoPrograms[0]?.code ?? "";
}

function mergeRiskStatus(current: RiskStatus, proTone: RiskStatus): RiskStatus {
  const order: Record<RiskStatus, number> = { normal: 0, watch: 1, urgent: 2 };
  return order[proTone] > order[current] ? proTone : current;
}
