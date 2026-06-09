import { analyzeAcademicPlan } from "../src/lib/analysis";
import {
  APS_GOLDEN_CASES,
  buildGoldenCaseTranscript,
  type GoldenCaseId
} from "../src/lib/analysis/golden-cases";

const REQUIRED_CASES: GoldenCaseId[] = [
  "IT_Sand",
  "CS_F",
  "CS_Nook",
  "CS_Golf",
  "CS_Neoi",
  "CS_Minie",
  "CS_Moss"
];

function main() {
  assertEqual(APS_GOLDEN_CASES.length, REQUIRED_CASES.length, "golden case count");

  const caseIds = new Set(APS_GOLDEN_CASES.map((goldenCase) => goldenCase.caseId));
  assertEqual(caseIds.size, APS_GOLDEN_CASES.length, "golden case ids must be unique");

  for (const caseId of REQUIRED_CASES) {
    assert(caseIds.has(caseId), `missing golden case ${caseId}`);
  }

  const caseById = new Map(APS_GOLDEN_CASES.map((goldenCase) => [goldenCase.caseId, goldenCase]));

  assertCase("IT_Sand", {
    track: "research",
    regStatus: "approved",
    readiness: "approved",
    academicEligibility: "eligible_now",
    expectedAcademicYear: 2568,
    expectedSemester: 2
  });

  for (const caseId of ["CS_F", "CS_Nook", "CS_Golf"] as const) {
    assertCase(caseId, {
      track: "research",
      regStatus: "applied",
      readiness: "applied_pending_result",
      academicEligibility: "eligible_if_pending_passed",
      expectedAcademicYear: 2568,
      expectedSemester: 3
    });
    assertIncludes(caseById.get(caseId)?.pendingCourseCodes ?? [], "517494", `${caseId} pending research project 2`);
  }

  for (const caseId of ["CS_Neoi", "CS_Minie"] as const) {
    assertCase(caseId, {
      track: "coop",
      regStatus: "applied",
      readiness: "applied_pending_result",
      academicEligibility: "eligible_if_pending_passed",
      expectedAcademicYear: 2568,
      expectedSemester: 3
    });
    assertIncludes(caseById.get(caseId)?.pendingGradeCodes ?? [], "517497", `${caseId} pending I grade`);
  }

  assertCase("CS_Moss", {
    track: "research",
    regStatus: "not_found",
    readiness: "not_ready",
    academicEligibility: "forecast_eligible"
  });

  for (const goldenCase of APS_GOLDEN_CASES) {
    assertAnalysisMatchesGoldenCase(goldenCase);
  }

  console.log(`Golden cases OK: ${APS_GOLDEN_CASES.length} cases verified against analysis engine`);

  function assertCase(caseId: GoldenCaseId, expected: Partial<(typeof APS_GOLDEN_CASES)[number]>) {
    const actual = caseById.get(caseId);
    assert(actual, `missing golden case ${caseId}`);

    for (const [key, value] of Object.entries(expected)) {
      assertEqual(actual[key as keyof typeof actual], value, `${caseId}.${key}`);
    }
  }
}

function assertAnalysisMatchesGoldenCase(goldenCase: (typeof APS_GOLDEN_CASES)[number]) {
  const transcriptCourses = buildGoldenCaseTranscript(goldenCase);
  const analysis = analyzeAcademicPlan(goldenCase.programCode, transcriptCourses, goldenCase.track, {
    regStatus: goldenCase.regStatus
  });

  assertEqual(analysis.trackRequirement.track, goldenCase.track, `${goldenCase.caseId}.analysis.track`);
  assertEqual(analysis.regGraduationStatus.status, goldenCase.regStatus, `${goldenCase.caseId}.analysis.regStatus`);
  assertEqual(
    analysis.graduationReadiness.state,
    goldenCase.readiness,
    `${goldenCase.caseId}.analysis.graduationReadiness`
  );
  assertEqual(
    analysis.academicEligibility.state,
    goldenCase.academicEligibility,
    `${goldenCase.caseId}.analysis.academicEligibility`
  );

  if (goldenCase.expectedAcademicYear) {
    assertEqual(
      analysis.graduationReadiness.expectedAcademicYear,
      goldenCase.expectedAcademicYear,
      `${goldenCase.caseId}.analysis.expectedAcademicYear`
    );
  }

  if (goldenCase.expectedSemester) {
    assertEqual(
      analysis.graduationReadiness.expectedSemester,
      goldenCase.expectedSemester,
      `${goldenCase.caseId}.analysis.expectedSemester`
    );
  }

  for (const courseCode of goldenCase.pendingCourseCodes) {
    assertIncludes(
      analysis.graduationReadiness.pendingCourseCodes,
      courseCode,
      `${goldenCase.caseId}.analysis.pendingCourseCodes`
    );
  }

  for (const courseCode of goldenCase.pendingGradeCodes) {
    const courseStatus = analysis.courseStatuses.find((course) => course.courseCode === courseCode);
    assert(courseStatus, `${goldenCase.caseId}.analysis.courseStatus.${courseCode} missing`);
    assertEqual(courseStatus.status, "incomplete", `${goldenCase.caseId}.analysis.courseStatus.${courseCode}`);
  }

  if (goldenCase.caseId === "CS_Moss") {
    assert(analysis.missingCredits > 0, "CS_Moss.analysis.missingCredits should be greater than 0");
    assertIncludes(
      analysis.courseStatuses
        .filter((course) => course.status === "not_taken")
        .map((course) => course.courseCode),
      "520251",
      "CS_Moss.analysis.missing normal course"
    );
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
