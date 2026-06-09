import type {
  AcademicEligibilityState,
  GraduationReadiness,
  PlanTrack,
  ProgramCode,
  RegGraduationStatus
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
    academicEligibility: "not_eligible",
    pendingCourseCodes: [],
    pendingGradeCodes: [],
    summary: "ยังไม่ยื่นจบ เพราะผ่านโครงงานวิจัยแล้วแต่รายวิชาปกติยังไม่ครบ"
  }
];

export function getGoldenCase(caseId: GoldenCaseId) {
  return APS_GOLDEN_CASES.find((goldenCase) => goldenCase.caseId === caseId);
}
