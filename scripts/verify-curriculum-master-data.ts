import {
  demoCourses,
  demoPrerequisites,
  demoPrograms,
  demoStructures,
  demoStudyPlan,
  summerOfferings
} from "../src/data/demo-data";
import { getTrackRequirementDefinitions } from "../src/lib/analysis/track-requirements";
import type { PlanTrack, ProgramCode } from "../src/lib/types";

const EXPECTED_PROGRAMS = [
  { programCode: "CS2565", totalCreditsMin: 126 },
  { programCode: "IT2565", totalCreditsMin: 133 }
] as const;

const REQUIRED_TRACKS: PlanTrack[] = ["research", "coop"];

function main() {
  for (const expected of EXPECTED_PROGRAMS) {
    assertProgramTotal(expected.programCode, expected.totalCreditsMin);
    assertStructureTotal(expected.programCode, expected.totalCreditsMin);
    assertStudyPlanCoursesExist(expected.programCode);
    assertTrackRequirements(expected.programCode);
  }

  assertPrerequisitesReferToKnownCourses();
  assertSummerOfferings();

  console.log("Curriculum master data OK: CS2565 and IT2565 are separated and complete enough for APS analysis");
}

function assertProgramTotal(programCode: ProgramCode, expectedCredits: number) {
  const program = demoPrograms.find((item) => item.code === programCode);
  assert(program, `missing Program ${programCode}`);
  assertEqual(program.totalCreditsMin, expectedCredits, `${programCode}.totalCreditsMin`);
}

function assertStructureTotal(programCode: ProgramCode, expectedCredits: number) {
  const structures = demoStructures.filter((structure) => structure.programCode === programCode);
  assert(structures.length > 0, `missing structures for ${programCode}`);

  const total = structures.reduce((sum, structure) => sum + structure.minCredits, 0);
  assertEqual(total, expectedCredits, `${programCode} structure credit total`);

  assertIncludes(
    structures.map((structure) => structure.category),
    "ศึกษาทั่วไป",
    `${programCode} structures`
  );
  assertIncludes(
    structures.map((structure) => structure.category),
    "วิชาเฉพาะ",
    `${programCode} structures`
  );
  assertIncludes(
    structures.map((structure) => structure.category),
    "วิชาเลือกเสรี",
    `${programCode} structures`
  );
}

function assertStudyPlanCoursesExist(programCode: ProgramCode) {
  const coursesForProgram = new Set(
    demoCourses
      .filter((course) => course.programCode === programCode || !course.programCode)
      .map((course) => course.code)
  );

  for (const item of demoStudyPlan.filter((plan) => plan.programCode === programCode && plan.courseCode)) {
    assert(coursesForProgram.has(item.courseCode!), `${programCode} study plan references unknown course ${item.courseCode}`);
  }
}

function assertTrackRequirements(programCode: ProgramCode) {
  const coursesForProgram = new Set(demoCourses.filter((course) => course.programCode === programCode).map((course) => course.code));

  for (const track of REQUIRED_TRACKS) {
    const requiredCourses = getTrackRequirementDefinitions(programCode, track);
    assert(requiredCourses.length > 0, `${programCode} missing ${track} track requirement definitions`);

    for (const requiredCourse of requiredCourses) {
      assert(coursesForProgram.has(requiredCourse.courseCode), `${programCode}/${track} missing Course ${requiredCourse.courseCode}`);
      assert(
        demoStudyPlan.some(
          (plan) =>
            plan.programCode === programCode &&
            plan.courseCode === requiredCourse.courseCode &&
            (!plan.track || plan.track === track)
        ),
        `${programCode}/${track} missing StudyPlan item ${requiredCourse.courseCode}`
      );
    }
  }
}

function assertPrerequisitesReferToKnownCourses() {
  for (const rule of demoPrerequisites) {
    assertCourseExists(rule.courseCode, `Prerequisite target ${rule.courseCode}`);
    assertCourseExists(rule.prereqCourseCode, `Prerequisite source ${rule.prereqCourseCode}`);
  }
}

function assertCourseExists(courseCode: string, label: string) {
  assert(demoCourses.some((course) => course.code === courseCode), `${label} is not in Course master data`);
}

function assertSummerOfferings() {
  for (const courseCode of ["517494", "520494"]) {
    assert(summerOfferings.has(courseCode), `summer offering must include research project 2 ${courseCode}`);
  }
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
