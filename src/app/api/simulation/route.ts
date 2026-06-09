import { NextResponse } from "next/server";
import { simulateGpax } from "@/lib/analysis/gpax-simulator";
import { getLatestTranscriptSummary } from "@/lib/analysis/status";
import { requireApiUser } from "@/lib/auth/api-guard";
import { getAnalysisData, resolveProgramCode, resolveTranscriptOwner } from "@/lib/db/repository";
import type { SimulationCourseInput } from "@/lib/types";

export async function POST(request: Request) {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  const body = (await request.json()) as { ownerEmail?: string; targetGpax?: number; courses?: SimulationCourseInput[] };
  const owner = await resolveTranscriptOwner(auth.user, {
    ownerEmail: body.ownerEmail
  });
  const programCode = await resolveProgramCode(owner.id);
  const data = await getAnalysisData(owner.id, programCode);
  const result = simulateGpax(
    data.transcriptCourses,
    body.courses ?? [],
    body.targetGpax ?? 3.2,
    data.gradeMappings,
    getLatestTranscriptSummary(data.transcriptSummaries)
  );
  return NextResponse.json({ success: true, result });
}
