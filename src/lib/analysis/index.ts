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
import {
  evaluateAcademicEligibility,
  evaluateGraduationReadiness,
  evaluateRegGraduationStatus
} from "@/lib/analysis/graduation-readiness";
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
import type { AnalysisResult, PlanTrack, ProgramCode, RiskStatus, TranscriptCourse } from "@/lib/types";

export function analyzeAcademicPlan(
  programCode: ProgramCode = getDefaultDemoProgramCode(),
  transcriptCourses: TranscriptCourse[] = demoTranscriptCourses,
  track: PlanTrack = "research"
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
  const audit = auditCurriculum(programCode, transcriptCourses, demoData, track);
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
  const graduationForecast = buildGraduationForecast(programCode, audit.courseStatuses, demoData);
  const academicEligibility = evaluateAcademicEligibility({
    courseStatuses: audit.courseStatuses,
    graduationForecast,
    trackRequirement: audit.trackRequirement
  });
  const regGraduationStatus = evaluateRegGraduationStatus();
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
    graduationForecast,
    trackRequirement: audit.trackRequirement,
    academicEligibility,
    regGraduationStatus,
    graduationReadiness: evaluateGraduationReadiness({
      courseStatuses: audit.courseStatuses,
      graduationForecast,
      trackRequirement: audit.trackRequirement
    }),
    readiness: checkReadiness(audit.program, audit.courseStatuses, audit.earnedCredits, gpax)
  };
  const riskStatus = mergeRiskStatus(summarizeRisk({ missingCredits: audit.missingCredits, prerequisiteImpacts }), proStatus.tone);
  const result = { ...partial, riskStatus };

  return {
    ...result,
    recommendations: buildRecommendations(result)
  };
}

export async function analyzeAcademicPlanFromDatabase(programCode: ProgramCode, userId?: number, track: PlanTrack = "research"): Promise<AnalysisResult> {
  const resolvedUserId = userId ?? (await getDemoUserId());
  const data = await getAnalysisData(resolvedUserId, programCode);

  if (data.transcriptCourses.length === 0 && data.transcriptSummaries.length === 0) {
    return buildEmptyAnalysisResult();
  }

  const audit = auditCurriculum(programCode, data.transcriptCourses, data, track);
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
  const graduationForecast = buildGraduationForecast(programCode, audit.courseStatuses, data);
  const academicEligibility = evaluateAcademicEligibility({
    courseStatuses: audit.courseStatuses,
    graduationForecast,
    trackRequirement: audit.trackRequirement
  });
  const regGraduationStatus = evaluateRegGraduationStatus();
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
    graduationForecast,
    trackRequirement: audit.trackRequirement,
    academicEligibility,
    regGraduationStatus,
    graduationReadiness: evaluateGraduationReadiness({
      courseStatuses: audit.courseStatuses,
      graduationForecast,
      trackRequirement: audit.trackRequirement
    }),
    readiness: checkReadiness(audit.program, audit.courseStatuses, audit.earnedCredits, gpax)
  };
  const riskStatus = mergeRiskStatus(summarizeRisk({ missingCredits: audit.missingCredits, prerequisiteImpacts }), proStatus.tone);
  const result = { ...partial, riskStatus };

  return {
    ...result,
    recommendations: buildRecommendations(result)
  };
}

export async function analyzeAndPersistAcademicPlan(programCode: ProgramCode, userId?: number, track: PlanTrack = "research") {
  const resolvedUserId = userId ?? (await getDemoUserId());
  const analysis = await analyzeAcademicPlanFromDatabase(programCode, resolvedUserId, track);
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
      condition: "blocked",
      conditionLabel: "ยังคาดการณ์ไม่ได้",
      conditionDetail: "ยังไม่มี transcript ที่ยืนยันแล้ว ระบบจึงยังคาดการณ์เทอมจบไม่ได้",
      remainingCredits: 0,
      pendingCredits: 0,
      plannedCredits: 0,
      terms: [],
      pendingCourses: [],
      blockedCourses: [],
      notes: ["กรุณาอัปโหลดและยืนยัน transcript ก่อนใช้งานการคาดการณ์แผนจบ"]
    },
    trackRequirement: buildEmptyTrackRequirement(),
    academicEligibility: {
      state: "not_eligible",
      label: "ยังไม่เข้าเงื่อนไขจบ",
      detail: "ยังไม่มี transcript ที่ยืนยันแล้ว ระบบจึงยังประเมินแนวโน้มจบจากผลการเรียนไม่ได้",
      tone: "watch",
      pendingCourseCodes: [],
      trackRequirement: buildEmptyTrackRequirement()
    },
    regGraduationStatus: {
      status: "not_found",
      label: "ไม่พบสถานะ",
      detail: "ระบบยังไม่มีข้อมูลจาก REG หรือข้อมูลที่ผู้ดูแลยืนยันเรื่องการยื่นจบ",
      note: "สถานะ REG ขึ้นเมื่อยื่นจบกับกองบริหารงานวิชาการเท่านั้น",
      source: "missing"
    },
    graduationReadiness: {
      state: "not_ready",
      label: "ยังไม่พร้อมยื่นจบ",
      detail: "ยังไม่มี transcript ที่ยืนยันแล้ว ระบบจึงยังประเมินความพร้อมจบไม่ได้",
      tone: "watch",
      pendingCourseCodes: []
    },
    readiness: [],
    recommendations: []
  };
}

function getDefaultDemoProgramCode() {
  return demoPrograms[0]?.code ?? "";
}

function buildEmptyTrackRequirement() {
  return {
    track: "research" as const,
    label: "สายโครงงานวิจัย",
    state: "missing" as const,
    isSatisfied: false,
    requiredCourses: [],
    missingCourseCodes: [],
    pendingCourseCodes: [],
    detail: "ยังไม่มี transcript ที่ยืนยันแล้ว ระบบจึงยังตรวจเงื่อนไขของสายไม่ได้"
  };
}

function mergeRiskStatus(current: RiskStatus, proTone: RiskStatus): RiskStatus {
  const order: Record<RiskStatus, number> = { normal: 0, watch: 1, urgent: 2 };
  return order[proTone] > order[current] ? proTone : current;
}
