import type {
  CourseOffering,
  CourseStatus,
  GraduationForecast,
  GraduationForecastCourse,
  GraduationForecastTerm,
  PrerequisiteRule,
  ProgramCode,
  StudyPlanItem,
  TranscriptCourse,
  TranscriptSummary
} from "@/lib/types";

type ForecastData = {
  prerequisites?: PrerequisiteRule[];
  studyPlan?: StudyPlanItem[];
  courseOfferings?: CourseOffering[];
  transcriptCourses?: TranscriptCourse[];
  transcriptSummaries?: TranscriptSummary[];
};

type ForecastOptions = {
  regularCreditLimit?: number;
  summerCreditLimit?: number;
  maxYearsToPlan?: number;
  startTerm?: AcademicTerm;
};

type AcademicTerm = {
  academicYear: number;
  semester: number;
};

const DEFAULT_REGULAR_CREDIT_LIMIT = 18;
const DEFAULT_SUMMER_CREDIT_LIMIT = 9;
const DEFAULT_MAX_YEARS_TO_PLAN = 8;
const SUPPORTED_SEMESTERS = [1, 2, 3];

export function buildGraduationForecast(
  programCode: ProgramCode,
  courseStatuses: CourseStatus[],
  data: ForecastData = {},
  options: ForecastOptions = {}
): GraduationForecast {
  const prerequisites = data.prerequisites ?? [];
  const studyPlan = data.studyPlan ?? [];
  const courseOfferings = data.courseOfferings ?? [];
  const regularCreditLimit = options.regularCreditLimit ?? DEFAULT_REGULAR_CREDIT_LIMIT;
  const summerCreditLimit = options.summerCreditLimit ?? DEFAULT_SUMMER_CREDIT_LIMIT;
  const maxTerms = (options.maxYearsToPlan ?? DEFAULT_MAX_YEARS_TO_PLAN) * SUPPORTED_SEMESTERS.length;

  const completedCourseCodes = new Set(
    courseStatuses.filter((course) => course.status === "passed" || course.status === "non_credit").map((course) => course.courseCode)
  );
  const pendingCourses = courseStatuses.filter((course) => course.status === "incomplete");
  const coursesToPlan = courseStatuses
    .filter(
      (course) =>
        course.status === "not_taken" ||
        course.status === "failed" ||
        course.status === "withdrawn"
    )
    .sort((a, b) => getStudyPlanOrder(programCode, studyPlan, a.courseCode) - getStudyPlanOrder(programCode, studyPlan, b.courseCode));
  const pendingForecastCourses = pendingCourses.map((course) =>
    toForecastCourse(course, "รอผลเกรดจากรายวิชาที่ลงไว้แล้ว ถ้าผ่านจะนำไปนับเงื่อนไขจบ")
  );
  const pendingTerm = getLatestCourseTermForStatuses(pendingCourses);
  const pendingResolutionTerm = getPendingResolutionTerm(pendingTerm);
  const latestTranscriptTerm = getLatestTranscriptTerm(data.transcriptSummaries ?? [], data.transcriptCourses ?? []);

  const plannedCourseCodes = new Set<string>();
  const blockedCourses = new Map<string, GraduationForecastCourse>();
  const terms: GraduationForecastTerm[] = [];
  let currentTerm = options.startTerm ?? getNextTermAfterLatestTranscript(data.transcriptSummaries ?? [], data.transcriptCourses ?? [], programCode, studyPlan);

  for (let index = 0; index < maxTerms && plannedCourseCodes.size < coursesToPlan.length; index += 1) {
    const creditLimit = currentTerm.semester === 3 ? summerCreditLimit : regularCreditLimit;
    const term: GraduationForecastTerm = {
      academicYear: currentTerm.academicYear,
      semester: currentTerm.semester,
      creditLimit,
      plannedCredits: 0,
      courses: []
    };
    const termCourseCodes: string[] = [];

    for (const course of coursesToPlan) {
      if (plannedCourseCodes.has(course.courseCode)) continue;
      if (term.plannedCredits + course.credits > creditLimit) continue;

      const missingPrerequisites = getMissingPrerequisites(course.courseCode, prerequisites, completedCourseCodes);
      if (missingPrerequisites.length > 0) {
        blockedCourses.set(course.courseCode, toForecastCourse(course, `รอผ่านวิชาบังคับก่อน ${missingPrerequisites.join(", ")}`));
        continue;
      }

      if (!isCourseOfferedInTerm(course.courseCode, currentTerm, programCode, studyPlan, courseOfferings)) {
        continue;
      }

      term.courses.push(toForecastCourse(course, buildPlanningReason(course.courseCode, currentTerm, programCode, studyPlan, courseOfferings)));
      term.plannedCredits += course.credits;
      plannedCourseCodes.add(course.courseCode);
      termCourseCodes.push(course.courseCode);
      blockedCourses.delete(course.courseCode);
    }

    if (term.courses.length > 0) {
      terms.push(term);
      for (const courseCode of termCourseCodes) {
        completedCourseCodes.add(courseCode);
      }
    }

    currentTerm = getNextTerm(currentTerm);
  }

  const unplannedCourses = coursesToPlan.filter((course) => !plannedCourseCodes.has(course.courseCode));
  for (const course of unplannedCourses) {
    if (!blockedCourses.has(course.courseCode)) {
      blockedCourses.set(course.courseCode, toForecastCourse(course, "ไม่พบข้อมูลเทอมที่เปิดสอนหรือแผนหลักสูตรภายในช่วงเวลาที่ระบบคาดการณ์"));
    }
  }

  const lastTerm = terms.at(-1);
  const plannedCredits = terms.reduce((total, term) => total + term.plannedCredits, 0);
  const notes = buildForecastNotes(regularCreditLimit, summerCreditLimit, courseOfferings.length > 0, unplannedCourses.length);
  const pendingCredits = pendingCourses.reduce((total, course) => total + course.credits, 0);
  const remainingCredits = coursesToPlan.reduce((total, course) => total + course.credits, 0) + pendingCredits;
  const condition = getForecastCondition(coursesToPlan.length, pendingCourses.length, unplannedCourses.length);
  const expectedTerm = getExpectedGraduationTerm(condition, pendingResolutionTerm, lastTerm, latestTranscriptTerm);

  return {
    canGraduate: unplannedCourses.length === 0,
    expectedAcademicYear: unplannedCourses.length === 0 ? expectedTerm?.academicYear : undefined,
    expectedSemester: unplannedCourses.length === 0 ? expectedTerm?.semester : undefined,
    condition,
    conditionLabel: buildConditionLabel(condition, expectedTerm),
    conditionDetail: buildConditionDetail(condition, pendingForecastCourses, unplannedCourses),
    remainingCredits,
    pendingCredits,
    plannedCredits,
    terms,
    pendingCourses: pendingForecastCourses,
    blockedCourses: Array.from(blockedCourses.values()),
    notes
  };
}

function getMissingPrerequisites(courseCode: string, prerequisites: PrerequisiteRule[], completedCourseCodes: Set<string>) {
  return prerequisites
    .filter((rule) => rule.courseCode === courseCode)
    .filter((rule) => !rule.isCorequisite)
    .filter((rule) => !completedCourseCodes.has(rule.prereqCourseCode))
    .map((rule) => rule.prereqCourseCode);
}

function isCourseOfferedInTerm(
  courseCode: string,
  term: AcademicTerm,
  programCode: ProgramCode,
  studyPlan: StudyPlanItem[],
  courseOfferings: CourseOffering[]
) {
  const offeringsForCourse = courseOfferings.filter((offering) => offering.courseCode === courseCode);
  if (offeringsForCourse.length > 0) {
    return offeringsForCourse.some(
      (offering) =>
        offering.semester === term.semester &&
        (offering.academicYear === term.academicYear || offering.academicYear <= term.academicYear)
    );
  }

  const plannedSemesters = getPlannedSemesters(programCode, studyPlan, courseCode);
  return plannedSemesters.size === 0 || plannedSemesters.has(term.semester);
}

function buildPlanningReason(
  courseCode: string,
  term: AcademicTerm,
  programCode: ProgramCode,
  studyPlan: StudyPlanItem[],
  courseOfferings: CourseOffering[]
) {
  const exactOffering = courseOfferings.some(
    (offering) => offering.courseCode === courseCode && offering.academicYear === term.academicYear && offering.semester === term.semester
  );
  const recurringOffering = courseOfferings.some(
    (offering) => offering.courseCode === courseCode && offering.semester === term.semester && offering.academicYear <= term.academicYear
  );

  if (exactOffering) return "ตรงกับข้อมูลรายวิชาที่เปิดสอนในปีและเทอมนี้";
  if (recurringOffering) return "ตรงกับรูปแบบเทอมที่เคยเปิดสอนในข้อมูลรายวิชาเปิด";
  if (getPlannedSemesters(programCode, studyPlan, courseCode).has(term.semester)) return "ตรงกับเทอมใน study plan ของหลักสูตร";
  return "ไม่มีข้อมูลเปิดสอนเฉพาะเทอม ระบบจึงจัดตามหน่วยกิตที่ยังลงได้";
}

function getPlannedSemesters(programCode: ProgramCode, studyPlan: StudyPlanItem[], courseCode: string) {
  return new Set(
    studyPlan
      .filter((plan) => plan.programCode === programCode && plan.courseCode === courseCode)
      .map((plan) => plan.semester)
  );
}

function getStudyPlanOrder(programCode: ProgramCode, studyPlan: StudyPlanItem[], courseCode: string) {
  const plan = studyPlan.find((item) => item.programCode === programCode && item.courseCode === courseCode);
  if (!plan) return Number.MAX_SAFE_INTEGER;
  return plan.yearLevel * 10 + plan.semester;
}

function getNextTermAfterLatestTranscript(
  summaries: TranscriptSummary[],
  courses: TranscriptCourse[],
  programCode: ProgramCode,
  studyPlan: StudyPlanItem[]
): AcademicTerm {
  const latestSummaryTerm = summaries.reduce<AcademicTerm | undefined>((latest, summary) => {
    return chooseLaterTerm(latest, { academicYear: summary.academicYear, semester: summary.semester });
  }, undefined);
  const latestCourseTerm = courses.reduce<AcademicTerm | undefined>((latest, course) => {
    return chooseLaterTerm(latest, { academicYear: course.academicYear, semester: course.semester });
  }, undefined);
  const latestTerm = chooseLaterTerm(latestSummaryTerm, latestCourseTerm);

  if (latestTerm) return getNextTerm(latestTerm);

  const firstPlan = studyPlan
    .filter((plan) => plan.programCode === programCode)
    .sort((a, b) => getStudyPlanOrder(programCode, studyPlan, a.courseCode ?? "") - getStudyPlanOrder(programCode, studyPlan, b.courseCode ?? ""))
    .at(0);

  return {
    academicYear: new Date().getFullYear() + 543,
    semester: firstPlan?.semester ?? 1
  };
}

function getLatestTranscriptTerm(summaries: TranscriptSummary[], courses: TranscriptCourse[]) {
  const latestSummaryTerm = summaries.reduce<AcademicTerm | undefined>((latest, summary) => {
    return chooseLaterTerm(latest, { academicYear: summary.academicYear, semester: summary.semester });
  }, undefined);
  const latestCourseTerm = courses.reduce<AcademicTerm | undefined>((latest, course) => {
    return chooseLaterTerm(latest, { academicYear: course.academicYear, semester: course.semester });
  }, undefined);

  return chooseLaterTerm(latestSummaryTerm, latestCourseTerm);
}

function getLatestCourseTermForStatuses(courseStatuses: CourseStatus[]) {
  return courseStatuses.reduce<AcademicTerm | undefined>((latest, course) => {
    const latestAttempt = course.attempts.at(-1);
    if (!latestAttempt) return latest;
    return chooseLaterTerm(latest, {
      academicYear: latestAttempt.academicYear,
      semester: latestAttempt.semester
    });
  }, undefined);
}

function getForecastCondition(coursesToPlanCount: number, pendingCourseCount: number, unplannedCourseCount: number): GraduationForecast["condition"] {
  if (unplannedCourseCount > 0) return "blocked";
  if (coursesToPlanCount > 0) return "planned_remaining_courses";
  if (pendingCourseCount > 0) return "pending_current_courses";
  return "completed";
}

function getExpectedGraduationTerm(
  condition: GraduationForecast["condition"],
  pendingResolutionTerm: AcademicTerm | undefined,
  lastPlannedTerm: AcademicTerm | undefined,
  latestTranscriptTerm: AcademicTerm | undefined
) {
  if (condition === "pending_current_courses") return pendingResolutionTerm ?? latestTranscriptTerm;
  if (condition === "planned_remaining_courses") return lastPlannedTerm;
  if (condition === "completed") return latestTranscriptTerm;
  return undefined;
}

function buildConditionLabel(condition: GraduationForecast["condition"], expectedTerm: AcademicTerm | undefined) {
  if (condition === "completed") return expectedTerm ? `จบได้${formatTermLabel(expectedTerm)}` : "เรียนครบตามข้อมูลที่มี";
  if (condition === "pending_current_courses") {
    return expectedTerm ? `จบได้${formatTermLabel(expectedTerm)} ถ้าวิชาที่รอผลผ่าน` : "จบได้ถ้าวิชาที่รอผลผ่าน";
  }
  if (condition === "planned_remaining_courses") {
    return expectedTerm ? `จบได้${formatTermLabel(expectedTerm)} ถ้าเรียนตามแผนที่เหลือผ่าน` : "จบได้ถ้าเรียนตามแผนที่เหลือผ่าน";
  }
  return "ยังจัดแผนจบไม่ได้ ต้องตรวจรายวิชาที่ติดเงื่อนไข";
}

function buildConditionDetail(
  condition: GraduationForecast["condition"],
  pendingCourses: GraduationForecastCourse[],
  unplannedCourses: CourseStatus[]
) {
  if (condition === "pending_current_courses") {
    const pendingCodes = pendingCourses.map((course) => course.courseCode).join(", ");
    return `รอผลเกรด ${pendingCodes} ถ้าออกผ่านจะเข้าเงื่อนไขจบ ถ้าไม่ผ่านต้องลงซ้ำหรือวางแผนใหม่`;
  }
  if (condition === "planned_remaining_courses") {
    return "ยังมีรายวิชาที่ยังไม่ได้ลงหรือยังไม่ผ่าน ระบบจึงวางแผนไปยังเทอมถัดไปตามเทอมที่เปิดสอน";
  }
  if (condition === "blocked") {
    return `ยังมีรายวิชาที่จัดแผนไม่ได้ ${unplannedCourses.map((course) => course.courseCode).join(", ")} ต้องตรวจ prerequisite หรือข้อมูลเปิดสอน`;
  }
  return "เรียนครบและไม่พบรายวิชาค้างตามข้อมูลผลการเรียนที่ยืนยันแล้ว";
}

function formatTermLabel(term: AcademicTerm) {
  if (term.semester === 3) return `เทอม 3/ภาคฤดูร้อน ${term.academicYear}`;
  return `เทอม ${term.semester}/${term.academicYear}`;
}

function chooseLaterTerm(current: AcademicTerm | undefined, candidate: AcademicTerm | undefined) {
  if (!candidate) return current;
  if (!current) return candidate;
  if (candidate.academicYear !== current.academicYear) {
    return candidate.academicYear > current.academicYear ? candidate : current;
  }
  return candidate.semester > current.semester ? candidate : current;
}

function getNextTerm(term: AcademicTerm): AcademicTerm {
  if (term.semester === 1) return { academicYear: term.academicYear, semester: 2 };
  if (term.semester === 2) return { academicYear: term.academicYear, semester: 3 };
  return { academicYear: term.academicYear + 1, semester: 1 };
}

function getPendingResolutionTerm(term: AcademicTerm | undefined): AcademicTerm | undefined {
  if (!term) return undefined;
  if (term.semester === 1) return { academicYear: term.academicYear, semester: 2 };
  if (term.semester === 2) return { academicYear: term.academicYear, semester: 3 };
  return term;
}

function toForecastCourse(course: CourseStatus, reason: string): GraduationForecastCourse {
  return {
    courseCode: course.courseCode,
    courseName: course.courseName,
    credits: course.credits,
    category: course.category,
    reason
  };
}

function buildForecastNotes(regularCreditLimit: number, summerCreditLimit: number, hasOfferings: boolean, blockedCount: number) {
  const notes = [
    `จำกัดหน่วยกิตเทอมปกติ: ${regularCreditLimit}`,
    `จำกัดหน่วยกิตเทอม 3/Summer: ${summerCreditLimit}`,
    "ระบบรองรับการวางแผนเทอม 1, เทอม 2 และเทอม 3/Summer"
  ];

  if (!hasOfferings) {
    notes.push("ยังไม่พบข้อมูลรายวิชาที่เปิดสอน ระบบจึงอ้างอิงเทอมจาก study plan ก่อน");
  }

  if (blockedCount > 0) {
    notes.push(`มี ${blockedCount} วิชาที่ยังจัดลงแผนไม่ได้ภายในช่วงเวลาที่ระบบคาดการณ์`);
  }

  return notes;
}
