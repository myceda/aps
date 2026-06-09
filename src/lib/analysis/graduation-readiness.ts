import type {
  AcademicEligibilityResult,
  CourseStatus,
  GraduationForecast,
  GraduationReadinessResult,
  RegGraduationStatus,
  RegGraduationStatusResult,
  RiskStatus,
  TrackRequirementResult
} from "@/lib/types";

type GraduationStatusInput = {
  courseStatuses: CourseStatus[];
  graduationForecast: GraduationForecast;
  trackRequirement: TrackRequirementResult;
  regStatus?: RegGraduationStatus;
};

export function evaluateAcademicEligibility({
  courseStatuses,
  graduationForecast,
  trackRequirement
}: GraduationStatusInput): AcademicEligibilityResult {
  const pendingCourses = getPendingCourses(courseStatuses);
  const pendingCourseCodes = uniqueCourseCodes([...pendingCourses.map((course) => course.courseCode), ...trackRequirement.pendingCourseCodes]);
  const pendingCredits = courseStatuses
    .filter((course) => pendingCourseCodes.includes(course.courseCode))
    .reduce((sum, course) => sum + course.credits, 0);
  const hasOnlyPendingGradesLeft =
    pendingCourseCodes.length > 0 &&
    trackRequirement.missingCourseCodes.length === 0 &&
    graduationForecast.remainingCredits <= pendingCredits;

  if (!trackRequirement.isSatisfied && trackRequirement.pendingCourseCodes.length === 0) {
    return buildAcademicEligibility({
      state: "not_eligible",
      label: `ยังไม่ครบเงื่อนไข${trackRequirement.label}`,
      detail: trackRequirement.detail,
      tone: "urgent",
      graduationForecast,
      pendingCourseCodes,
      trackRequirement
    });
  }

  if (hasOnlyPendingGradesLeft) {
    return buildAcademicEligibility({
      state: "eligible_if_pending_passed",
      label: "เรียนครบแล้ว รอผลเกรด",
      detail: buildPendingDetail(graduationForecast, pendingCourseCodes),
      tone: "watch",
      graduationForecast,
      pendingCourseCodes,
      trackRequirement
    });
  }

  if (graduationForecast.canGraduate && graduationForecast.remainingCredits === 0 && trackRequirement.isSatisfied) {
    return buildAcademicEligibility({
      state: "eligible_now",
      label: "เรียนครบตามเงื่อนไขแล้ว",
      detail: buildForecastDetail(graduationForecast, "ตามข้อมูลผลการเรียน นักศึกษาเรียนครบและผ่านเงื่อนไขหลักแล้ว"),
      tone: "normal",
      graduationForecast,
      pendingCourseCodes,
      trackRequirement
    });
  }

  if (graduationForecast.canGraduate) {
    return buildAcademicEligibility({
      state: "forecast_eligible",
      label: "มีแนวโน้มจบได้ตามแผน",
      detail: buildForecastDetail(
        graduationForecast,
        "ตามข้อมูลผลการเรียนและแผนรายเทอม นักศึกษามีแนวโน้มจบได้ถ้าผ่านรายวิชาที่เหลือตามแผน"
      ),
      tone: "watch",
      graduationForecast,
      pendingCourseCodes,
      trackRequirement
    });
  }

  return buildAcademicEligibility({
    state: "not_eligible",
    label: "ยังไม่เข้าเงื่อนไขจบ",
    detail: "ตามข้อมูลผลการเรียน ยังมีหน่วยกิต รายวิชา หรือเงื่อนไขหลักสูตรที่ต้องจัดแผนให้ครบก่อน",
    tone: graduationForecast.blockedCourses.length > 0 ? "urgent" : "watch",
    graduationForecast,
    pendingCourseCodes,
    trackRequirement
  });
}

export function evaluateRegGraduationStatus(status: RegGraduationStatus = "not_found"): RegGraduationStatusResult {
  const note = "สถานะ REG ไม่ได้คำนวณจากระบบ APS แต่เป็นข้อมูลจากการยื่นจบกับกองบริหารงานวิชาการเท่านั้น";

  if (status === "approved") {
    return {
      status,
      label: "อนุมัติปริญญา",
      detail: "ข้อมูล REG ระบุว่าอนุมัติปริญญาแล้ว",
      note,
      source: "reg"
    };
  }

  if (status === "applied") {
    return {
      status,
      label: "ยื่นจบ",
      detail: "ข้อมูล REG ระบุว่านักศึกษายื่นจบแล้ว ต้องรอผลรายวิชาและการตรวจจบขั้นสุดท้าย",
      note,
      source: "reg"
    };
  }

  return {
    status: "not_found",
    label: "ไม่พบสถานะ",
    detail: "ยังไม่มีข้อมูล REG หรือข้อมูลที่ผู้ดูแลยืนยันเรื่องการยื่นจบ",
    note,
    source: "missing"
  };
}

export function evaluateGraduationReadiness(input: GraduationStatusInput): GraduationReadinessResult {
  const academicEligibility = evaluateAcademicEligibility(input);
  const regGraduationStatus = evaluateRegGraduationStatus(input.regStatus);
  const pendingCourseCodes = academicEligibility.pendingCourseCodes;

  if (regGraduationStatus.status === "approved") {
    return buildReadiness({
      state: "approved",
      label: "อนุมัติจบแล้ว",
      detail: `${academicEligibility.detail} | สถานะ REG: ${regGraduationStatus.label}`,
      tone: "normal",
      academicEligibility
    });
  }

  if (regGraduationStatus.status === "applied") {
    return buildReadiness({
      state: "applied_pending_result",
      label: "ยื่นจบแล้ว รอตรวจผล",
      detail: `${academicEligibility.detail} | ถ้ารายวิชาที่เหลือไม่ผ่าน การยื่นจบอาจเป็นโมฆะและต้องวางแผนใหม่`,
      tone: "watch",
      academicEligibility
    });
  }

  if (academicEligibility.state === "eligible_if_pending_passed") {
    return buildReadiness({
      state: "pending_incomplete_grade",
      label: "รอผลเกรด",
      detail: `${academicEligibility.detail} | สถานะ REG: ${regGraduationStatus.label}`,
      tone: "watch",
      academicEligibility
    });
  }

  if (academicEligibility.state === "eligible_now") {
    return buildReadiness({
      state: "ready_to_apply",
      label: "พร้อมยื่นจบตามผลการเรียน",
      detail: `${academicEligibility.detail} | สถานะ REG: ${regGraduationStatus.label}`,
      tone: "normal",
      academicEligibility
    });
  }

  return buildReadiness({
    state: "not_ready",
    label: academicEligibility.label,
    detail: `${academicEligibility.detail} | สถานะ REG: ${regGraduationStatus.label}`,
    tone: academicEligibility.tone,
    academicEligibility,
    pendingCourseCodes
  });
}

function getPendingCourses(courseStatuses: CourseStatus[]) {
  return courseStatuses.filter((course) => course.status === "incomplete");
}

function buildAcademicEligibility({
  state,
  label,
  detail,
  tone,
  graduationForecast,
  pendingCourseCodes,
  trackRequirement
}: {
  state: AcademicEligibilityResult["state"];
  label: string;
  detail: string;
  tone: RiskStatus;
  graduationForecast: GraduationForecast;
  pendingCourseCodes: string[];
  trackRequirement: TrackRequirementResult;
}): AcademicEligibilityResult {
  return {
    state,
    label,
    detail,
    tone,
    pendingCourseCodes,
    trackRequirement,
    expectedAcademicYear: graduationForecast.expectedAcademicYear,
    expectedSemester: graduationForecast.expectedSemester
  };
}

function uniqueCourseCodes(courseCodes: string[]) {
  return Array.from(new Set(courseCodes));
}

function buildReadiness({
  state,
  label,
  detail,
  tone,
  academicEligibility,
  pendingCourseCodes = academicEligibility.pendingCourseCodes
}: {
  state: GraduationReadinessResult["state"];
  label: string;
  detail: string;
  tone: RiskStatus;
  academicEligibility: AcademicEligibilityResult;
  pendingCourseCodes?: string[];
}): GraduationReadinessResult {
  return {
    state,
    label,
    detail,
    tone,
    pendingCourseCodes,
    expectedAcademicYear: academicEligibility.expectedAcademicYear,
    expectedSemester: academicEligibility.expectedSemester
  };
}

function buildPendingDetail(graduationForecast: GraduationForecast, pendingCourseCodes: string[]) {
  const pendingText = pendingCourseCodes.join(", ");
  const expectedText =
    graduationForecast.expectedAcademicYear && graduationForecast.expectedSemester
      ? formatExpectedTerm(graduationForecast.expectedAcademicYear, graduationForecast.expectedSemester)
      : "เทอมที่ระบบคาดการณ์";

  return `เรียนครบตามแผนแล้ว รอผลเกรด ${pendingText} ถ้า ${pendingText} ผ่าน คาดว่าจบได้ภายใน${expectedText} ถ้าไม่ผ่าน ต้องลงซ้ำหรือวางแผนใหม่`;
}

function buildForecastDetail(graduationForecast: GraduationForecast, fallback: string) {
  if (!graduationForecast.expectedAcademicYear || !graduationForecast.expectedSemester) {
    return fallback;
  }

  return `${fallback} ${formatExpectedTerm(graduationForecast.expectedAcademicYear, graduationForecast.expectedSemester)}`;
}

function formatExpectedTerm(academicYear: number, semester: number) {
  if (semester === 3) return `เทอม 3/ภาคฤดูร้อน ${academicYear}`;
  if (semester === 2) return `เทอม 2/ภาคปลาย ${academicYear}`;
  return `เทอม 1/ภาคต้น ${academicYear}`;
}
