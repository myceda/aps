import { analyzeAcademicPlan } from "../src/lib/analysis";
import { APS_GOLDEN_CASES, buildGoldenCaseTranscript } from "../src/lib/analysis/golden-cases";
import type { TranscriptCourse } from "../src/lib/types";

function main() {
  const itSand = getGoldenCase("IT_Sand");
  const csF = getGoldenCase("CS_F");

  const completed = analyzeAcademicPlan(itSand.programCode, buildGoldenCaseTranscript(itSand), itSand.track, {
    regStatus: itSand.regStatus
  });
  assertForecastTerm(completed, 2568, 2, "IT_Sand completed forecast");
  assertEqual(completed.graduationForecast.condition, "completed", "IT_Sand condition");

  const pending = analyzeAcademicPlan(csF.programCode, buildGoldenCaseTranscript(csF), csF.track, {
    regStatus: csF.regStatus
  });
  assertForecastTerm(pending, 2568, 3, "CS_F pending project forecast");
  assertEqual(pending.graduationForecast.condition, "pending_current_courses", "CS_F pending condition");
  assertIncludes(
    pending.graduationForecast.pendingCourses.map((course) => course.courseCode),
    "517494",
    "CS_F pending course"
  );

  const notYetEnrolledTranscript = buildGoldenCaseTranscript(csF).filter((course) => course.courseCode !== "517494");
  const notYetEnrolled = analyzeAcademicPlan(csF.programCode, notYetEnrolledTranscript, csF.track, {
    regStatus: "not_found"
  });
  assertForecastTerm(notYetEnrolled, 2568, 3, "CS_F not-yet-enrolled summer forecast");
  assertEqual(notYetEnrolled.graduationForecast.condition, "planned_remaining_courses", "CS_F not-yet-enrolled condition");
  assertPlannedCourseInTerm(notYetEnrolled, "517494", 2568, 3);

  const failedSummerTranscript = replaceCourseAttempt(buildGoldenCaseTranscript(csF), "517494", {
    gradeChar: "F",
    semester: 3,
    academicYear: 2568
  });
  const failedSummer = analyzeAcademicPlan(csF.programCode, failedSummerTranscript, csF.track, {
    regStatus: csF.regStatus
  });
  assertForecastTerm(failedSummer, 2569, 2, "CS_F failed summer project forecast");
  assertEqual(failedSummer.graduationForecast.condition, "planned_remaining_courses", "CS_F failed summer condition");
  assertPlannedCourseInTerm(failedSummer, "517494", 2569, 2);

  console.log("Graduation forecast OK: supports term 1/2/3 planning, summer pending, and 2569 delay cases");
}

function getGoldenCase(caseId: (typeof APS_GOLDEN_CASES)[number]["caseId"]) {
  const goldenCase = APS_GOLDEN_CASES.find((item) => item.caseId === caseId);
  assert(goldenCase, `missing golden case ${caseId}`);
  return goldenCase;
}

function replaceCourseAttempt(
  transcriptCourses: TranscriptCourse[],
  courseCode: string,
  patch: Pick<TranscriptCourse, "gradeChar" | "semester" | "academicYear">
) {
  return transcriptCourses.map((course) =>
    course.courseCode === courseCode
      ? {
          ...course,
          ...patch,
          sourceRow: `${course.sourceRow} patched for forecast regression`
        }
      : course
  );
}

function assertForecastTerm(
  analysis: ReturnType<typeof analyzeAcademicPlan>,
  academicYear: number,
  semester: number,
  label: string
) {
  assertEqual(analysis.graduationForecast.expectedAcademicYear, academicYear, `${label}.expectedAcademicYear`);
  assertEqual(analysis.graduationForecast.expectedSemester, semester, `${label}.expectedSemester`);
}

function assertPlannedCourseInTerm(
  analysis: ReturnType<typeof analyzeAcademicPlan>,
  courseCode: string,
  academicYear: number,
  semester: number
) {
  const term = analysis.graduationForecast.terms.find(
    (item) => item.academicYear === academicYear && item.semester === semester
  );
  assert(term, `missing forecast term ${semester}/${academicYear}`);
  assertIncludes(
    term.courses.map((course) => course.courseCode),
    courseCode,
    `forecast term ${semester}/${academicYear}`
  );
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertIncludes(values: string[], expectedValue: string, label: string) {
  if (!values.includes(expectedValue)) {
    throw new Error(`${label}: expected ${expectedValue} in [${values.join(", ")}]`);
  }
}

main();
