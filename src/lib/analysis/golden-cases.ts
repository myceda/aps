import { demoCourses, demoStudyPlan } from "@/data/demo-data";
import { getOtherTrackCourseCodes } from "@/lib/analysis/track-requirements";
import type {
  AcademicEligibilityState,
  GraduationReadiness,
  PlanTrack,
  ProgramCode,
  RegGraduationStatus,
  TranscriptCourse
} from "@/lib/types";

export type GoldenCaseId =
  | "IT_Sand"
  | "CS_F"
  | "CS_Nook"
  | "CS_Golf"
  | "CS_Neoi"
  | "CS_Minie"
  | "CS_Moss";

export type GoldenCaseExpectedResult = {
  caseId: GoldenCaseId;
  programCode: ProgramCode;
  track: PlanTrack;
  regStatus: RegGraduationStatus;
  readiness: GraduationReadiness;
  academicEligibility: AcademicEligibilityState;
  expectedAcademicYear?: number;
  expectedSemester?: number;
  pendingCourseCodes: string[];
  pendingGradeCodes: string[];
  summary: string;
  passOutcome?: string;
  failOutcome?: string;
};

export const APS_GOLDEN_CASES: GoldenCaseExpectedResult[] = [
  {
    caseId: "IT_Sand",
    programCode: "IT2565",
    track: "research",
    regStatus: "approved",
    readiness: "approved",
    academicEligibility: "eligible_now",
    expectedAcademicYear: 2568,
    expectedSemester: 2,
    pendingCourseCodes: [],
    pendingGradeCodes: [],
    summary: "ผ่านครบตามสายโครงงานวิจัย และ REG อนุมัติปริญญาในเทอม 2/2568"
  },
  {
    caseId: "CS_F",
    programCode: "CS2565",
    track: "research",
    regStatus: "applied",
    readiness: "applied_pending_result",
    academicEligibility: "eligible_if_pending_passed",
    expectedAcademicYear: 2568,
    expectedSemester: 3,
    pendingCourseCodes: ["517494"],
    pendingGradeCodes: [],
    summary: "ยื่นจบแล้ว รอโครงงานวิจัย 2 ในเทอม 3/2568",
    passOutcome: "ถ้า 517494 ผ่าน คาดว่าจบได้ภายในเทอม 3/2568",
    failOutcome: "ถ้า 517494 ไม่ผ่าน การยื่นจบเป็นโมฆะและต้องวางแผนใหม่ปี 2569"
  },
  {
    caseId: "CS_Nook",
    programCode: "CS2565",
    track: "research",
    regStatus: "applied",
    readiness: "applied_pending_result",
    academicEligibility: "eligible_if_pending_passed",
    expectedAcademicYear: 2568,
    expectedSemester: 3,
    pendingCourseCodes: ["517494"],
    pendingGradeCodes: [],
    summary: "ยื่นจบแล้ว รอโครงงานวิจัย 2 ในเทอม 3/2568",
    passOutcome: "ถ้า 517494 ผ่าน คาดว่าจบได้ภายในเทอม 3/2568",
    failOutcome: "ถ้า 517494 ไม่ผ่าน การยื่นจบเป็นโมฆะและต้องวางแผนใหม่ปี 2569"
  },
  {
    caseId: "CS_Golf",
    programCode: "CS2565",
    track: "research",
    regStatus: "applied",
    readiness: "applied_pending_result",
    academicEligibility: "eligible_if_pending_passed",
    expectedAcademicYear: 2568,
    expectedSemester: 3,
    pendingCourseCodes: ["517494"],
    pendingGradeCodes: [],
    summary: "ยื่นจบแล้ว รอโครงงานวิจัย 2 ในเทอม 3/2568",
    passOutcome: "ถ้า 517494 ผ่าน คาดว่าจบได้ภายในเทอม 3/2568",
    failOutcome: "ถ้า 517494 ไม่ผ่าน การยื่นจบเป็นโมฆะและต้องวางแผนใหม่ปี 2569"
  },
  {
    caseId: "CS_Neoi",
    programCode: "CS2565",
    track: "coop",
    regStatus: "applied",
    readiness: "applied_pending_result",
    academicEligibility: "eligible_if_pending_passed",
    expectedAcademicYear: 2568,
    expectedSemester: 3,
    pendingCourseCodes: ["517497"],
    pendingGradeCodes: ["517497"],
    summary: "ยื่นจบแล้ว เรียนครบตามแผนสหกิจ แต่รอเกรด I ของ 517497",
    passOutcome: "ถ้า 517497 ผ่าน คาดว่าจบได้ภายในเทอม 3/2568",
    failOutcome: "ถ้า 517497 ไม่ผ่าน ต้องลงซ้ำหรือวางแผนใหม่"
  },
  {
    caseId: "CS_Minie",
    programCode: "CS2565",
    track: "coop",
    regStatus: "applied",
    readiness: "applied_pending_result",
    academicEligibility: "eligible_if_pending_passed",
    expectedAcademicYear: 2568,
    expectedSemester: 3,
    pendingCourseCodes: ["517497"],
    pendingGradeCodes: ["517497"],
    summary: "ยื่นจบแล้ว เรียนครบตามแผนสหกิจ แต่รอเกรด I ของ 517497",
    passOutcome: "ถ้า 517497 ผ่าน คาดว่าจบได้ภายในเทอม 3/2568",
    failOutcome: "ถ้า 517497 ไม่ผ่าน ต้องลงซ้ำหรือวางแผนใหม่"
  },
  {
    caseId: "CS_Moss",
    programCode: "CS2565",
    track: "research",
    regStatus: "not_found",
    readiness: "not_ready",
    academicEligibility: "forecast_eligible",
    pendingCourseCodes: [],
    pendingGradeCodes: [],
    summary: "ยังไม่ยื่นจบ เพราะผ่านโครงงานวิจัยแล้วแต่รายวิชาปกติยังไม่ครบ"
  }
];

export function getGoldenCase(caseId: GoldenCaseId) {
  return APS_GOLDEN_CASES.find((goldenCase) => goldenCase.caseId === caseId);
}

export function buildGoldenCaseTranscript(goldenCase: GoldenCaseExpectedResult): TranscriptCourse[] {
  const config = getGoldenCaseTranscriptConfig(goldenCase.caseId);
  const missingCourseCodes = new Set(config.missingCourseCodes ?? []);
  const pendingGradeCodes = new Set(goldenCase.pendingGradeCodes);
  const pendingCourseCodes = new Set(goldenCase.pendingCourseCodes);
  const otherTrackCourseCodes = getOtherTrackCourseCodes(goldenCase.programCode, goldenCase.track);
  const seen = new Set<string>();
  const transcriptCourses: TranscriptCourse[] = [];

  for (const course of demoCourses) {
    if (course.programCode && course.programCode !== goldenCase.programCode) continue;
    if (otherTrackCourseCodes.has(course.code)) continue;
    if (missingCourseCodes.has(course.code)) continue;
    if (seen.has(course.code)) continue;

    seen.add(course.code);

    const plannedTerm = resolvePlannedTerm(goldenCase.programCode, goldenCase.track, course.code);
    const isPending = pendingCourseCodes.has(course.code) || pendingGradeCodes.has(course.code);

    transcriptCourses.push({
      courseCode: course.code,
      courseName: course.nameTh,
      credits: course.credits,
      gradeChar: isPending ? "I" : "C",
      semester: plannedTerm.semester,
      academicYear: plannedTerm.academicYear,
      sourceRow: `${goldenCase.caseId} fixture ${course.code}`
    });
  }

  return [...transcriptCourses, ...buildSupplementalCourses(goldenCase.caseId)];
}

function getGoldenCaseTranscriptConfig(caseId: GoldenCaseId) {
  if (caseId === "CS_Moss") {
    return {
      missingCourseCodes: ["520251"]
    };
  }

  return {};
}

function resolvePlannedTerm(programCode: ProgramCode, track: PlanTrack, courseCode: string) {
  const plan = demoStudyPlan.find(
    (item) =>
      item.programCode === programCode &&
      item.courseCode === courseCode &&
      (!item.track || item.track === track)
  );

  if (!plan) {
    return {
      academicYear: 2568,
      semester: 2
    };
  }

  return {
    academicYear: 2564 + plan.yearLevel,
    semester: plan.semester
  };
}

function buildSupplementalCourses(caseId: GoldenCaseId): TranscriptCourse[] {
  const supplemental = [
    { courseCode: "SU901", courseName: "Supplemental general education 1", credits: 3 },
    { courseCode: "SU902", courseName: "Supplemental general education 2", credits: 3 },
    { courseCode: "459901", courseName: "Supplemental free elective 1", credits: 3 },
    { courseCode: "459902", courseName: "Supplemental free elective 2", credits: 3 },
    { courseCode: "459903", courseName: "Supplemental free elective 3", credits: 3 },
    { courseCode: "459904", courseName: "Supplemental free elective 4", credits: 3 }
  ];

  return supplemental.map((course) => ({
    ...course,
    gradeChar: "C",
    semester: 2,
    academicYear: 2568,
    sourceRow: `${caseId} fixture ${course.courseCode}`
  }));
}
