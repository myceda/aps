import { buildGraduationForecast } from "@/lib/analysis/graduation-forecast";
import type {
  CourseStatus,
  GraduationForecast,
  GraduationForecastCourse,
  PrerequisiteRule,
  ProgramCode,
  WhatIfSimulationInput,
  WhatIfSimulationResult
} from "@/lib/types";
import type { AnalysisData } from "@/lib/db/repository";

type WhatIfData = Pick<
  AnalysisData,
  "prerequisites" | "studyPlan" | "courseOfferings" | "summerOfferings" | "transcriptCourses" | "transcriptSummaries"
>;

export function simulateGraduationWhatIf(
  programCode: ProgramCode,
  courseStatuses: CourseStatus[],
  data: WhatIfData,
  input: WhatIfSimulationInput
): WhatIfSimulationResult {
  const startTerm = getNextTerm({ academicYear: input.academicYear, semester: input.semester });
  const baselineForecast = buildGraduationForecast(programCode, courseStatuses, data, { startTerm });
  const simulatedCourseStatuses = applyScenario(courseStatuses, input);
  const simulatedForecast = buildGraduationForecast(programCode, simulatedCourseStatuses, data, { startTerm });
  const unlockedCourses = findUnlockedCourses(courseStatuses, data.prerequisites, input.addCourseCode);
  const newlyBlockedCourses = findNewlyBlockedCourses(baselineForecast, simulatedForecast);
  const graduationDelayTerms = calculateGraduationDelayTerms(baselineForecast, simulatedForecast);

  return {
    baselineForecast,
    simulatedForecast,
    graduationDelayTerms,
    unlockedCourses,
    newlyBlockedCourses,
    summary: buildSummary(graduationDelayTerms, simulatedForecast),
    notes: buildNotes(input)
  };
}

function applyScenario(courseStatuses: CourseStatus[], input: WhatIfSimulationInput) {
  const next = courseStatuses.map((course) => ({ ...course }));

  if (input.withdrawCourseCode) {
    setCourseAs(next, input.withdrawCourseCode, "withdrawn", "จำลองว่าถอนรายวิชานี้ จึงต้องวางแผนเรียนใหม่");
  }

  if (input.failCourseCode) {
    setCourseAs(next, input.failCourseCode, "failed", "จำลองว่ายังไม่ผ่านรายวิชานี้ จึงอาจ block รายวิชาตัวต่อ");
  }

  if (input.addCourseCode) {
    setCourseAs(next, input.addCourseCode, "passed", "จำลองว่าลงและผ่านรายวิชานี้ในเทอมที่เลือก");
  }

  return next;
}

function setCourseAs(courseStatuses: CourseStatus[], courseCode: string, status: CourseStatus["status"], reason: string) {
  const course = courseStatuses.find((item) => item.courseCode === courseCode);
  if (!course) return;

  course.status = status;
  course.reason = reason;
}

function findUnlockedCourses(courseStatuses: CourseStatus[], prerequisites: PrerequisiteRule[], addedCourseCode?: string) {
  if (!addedCourseCode) return [];

  const completed = new Set(
    courseStatuses.filter((course) => course.status === "passed" || course.status === "non_credit").map((course) => course.courseCode)
  );
  completed.add(addedCourseCode);
  const courseByCode = new Map(courseStatuses.map((course) => [course.courseCode, course]));
  const downstreamCodes = prerequisites
    .filter((rule) => rule.prereqCourseCode === addedCourseCode)
    .map((rule) => rule.courseCode);

  const unlocked: GraduationForecastCourse[] = [];

  for (const courseCode of downstreamCodes) {
    const course = courseByCode.get(courseCode);
    if (!course || course.status === "passed" || course.status === "non_credit") continue;

    const missingPrerequisites = prerequisites
      .filter((rule) => rule.courseCode === courseCode && !rule.isCorequisite)
      .filter((rule) => !completed.has(rule.prereqCourseCode));

    if (missingPrerequisites.length === 0) {
      unlocked.push(toForecastCourse(course, `ปลดล็อกหลังผ่าน ${addedCourseCode}`));
    }
  }

  return unlocked;
}

function findNewlyBlockedCourses(baselineForecast: GraduationForecast, simulatedForecast: GraduationForecast) {
  const baselineBlocked = new Set(baselineForecast.blockedCourses.map((course) => course.courseCode));
  return simulatedForecast.blockedCourses.filter((course) => !baselineBlocked.has(course.courseCode));
}

function calculateGraduationDelayTerms(baselineForecast: GraduationForecast, simulatedForecast: GraduationForecast) {
  if (!baselineForecast.canGraduate || !simulatedForecast.canGraduate) return null;
  if (!baselineForecast.expectedAcademicYear || !baselineForecast.expectedSemester) return null;
  if (!simulatedForecast.expectedAcademicYear || !simulatedForecast.expectedSemester) return null;

  return (
    termIndex(simulatedForecast.expectedAcademicYear, simulatedForecast.expectedSemester) -
    termIndex(baselineForecast.expectedAcademicYear, baselineForecast.expectedSemester)
  );
}

function buildSummary(delayTerms: number | null, forecast: GraduationForecast) {
  if (!forecast.canGraduate) return "แผนจำลองยังจัดรายวิชาจนจบไม่ได้ ต้องตรวจรายวิชาที่ถูก block เพิ่ม";
  if (delayTerms === null) return "ระบบคำนวณแผนจำลองได้ แต่ยังเทียบจำนวนเทอมที่ช้าลงไม่ได้";
  if (delayTerms > 0) return `แผนจำลองทำให้จบช้าลง ${delayTerms} เทอม`;
  if (delayTerms < 0) return `แผนจำลองทำให้จบเร็วขึ้น ${Math.abs(delayTerms)} เทอม`;
  return "แผนจำลองไม่ทำให้เทอมจบเปลี่ยน";
}

function buildNotes(input: WhatIfSimulationInput) {
  const notes = [`จำลองจากปีการศึกษา ${input.academicYear} เทอม ${input.semester}`];

  if (input.addCourseCode) {
    notes.push(`กรณีลง ${input.addCourseCode} ระบบสมมติว่านักศึกษาผ่านวิชานี้หลังจบเทอมที่เลือก`);
  }

  if (input.withdrawCourseCode) {
    notes.push(`กรณีถอน ${input.withdrawCourseCode} ระบบจะนำวิชานี้กลับไปวางแผนเรียนใหม่`);
  }

  if (input.failCourseCode) {
    notes.push(`กรณีไม่ผ่าน ${input.failCourseCode} ระบบจะตรวจรายวิชาตัวต่อที่ถูก block`);
  }

  return notes;
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

function getNextTerm(term: { academicYear: number; semester: number }) {
  if (term.semester === 1) return { academicYear: term.academicYear, semester: 2 };
  if (term.semester === 2) return { academicYear: term.academicYear, semester: 3 };
  return { academicYear: term.academicYear + 1, semester: 1 };
}

function termIndex(academicYear: number, semester: number) {
  return academicYear * 3 + semester;
}
