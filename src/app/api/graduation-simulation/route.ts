import { NextResponse } from "next/server";
import { auditCurriculum } from "@/lib/analysis/curriculum-audit";
import { simulateGraduationWhatIf } from "@/lib/analysis/what-if-simulator";
import { requireApiUser } from "@/lib/auth/api-guard";
import { getAnalysisData, resolveProgramCode } from "@/lib/db/repository";
import type { WhatIfSimulationInput } from "@/lib/types";

export async function POST(request: Request) {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  const body = (await request.json()) as Partial<WhatIfSimulationInput> & { programCode?: string };
  const programCode = await resolveProgramCode(auth.user.id, body.programCode);
  const data = await getAnalysisData(auth.user.id, programCode);
  const audit = auditCurriculum(programCode, data.transcriptCourses, data);

  const input: WhatIfSimulationInput = {
    withdrawCourseCode: cleanCourseCode(body.withdrawCourseCode),
    addCourseCode: cleanCourseCode(body.addCourseCode),
    failCourseCode: cleanCourseCode(body.failCourseCode),
    academicYear: Number(body.academicYear ?? 2568),
    semester: Number(body.semester ?? 1)
  };

  const result = simulateGraduationWhatIf(programCode, audit.courseStatuses, data, input);
  return NextResponse.json({ success: true, result });
}

function cleanCourseCode(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
