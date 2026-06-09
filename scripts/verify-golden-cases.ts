import { APS_GOLDEN_CASES, type GoldenCaseId } from "../src/lib/analysis/golden-cases";

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
    expectedAcademicYear: 2568,
    expectedSemester: 2
  });

  for (const caseId of ["CS_F", "CS_Nook", "CS_Golf"] as const) {
    assertCase(caseId, {
      track: "research",
      regStatus: "applied",
      readiness: "applied_pending_result",
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
      expectedAcademicYear: 2568,
      expectedSemester: 3
    });
    assertIncludes(caseById.get(caseId)?.pendingGradeCodes ?? [], "517497", `${caseId} pending I grade`);
  }

  assertCase("CS_Moss", {
    track: "research",
    regStatus: "not_found",
    readiness: "not_ready"
  });

  console.log(`Golden cases OK: ${APS_GOLDEN_CASES.length} cases`);

  function assertCase(caseId: GoldenCaseId, expected: Partial<(typeof APS_GOLDEN_CASES)[number]>) {
    const actual = caseById.get(caseId);
    assert(actual, `missing golden case ${caseId}`);

    for (const [key, value] of Object.entries(expected)) {
      assertEqual(actual[key as keyof typeof actual], value, `${caseId}.${key}`);
    }
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
