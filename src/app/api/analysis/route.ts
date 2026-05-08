import { NextResponse } from "next/server";
import { analyzeAcademicPlanFromDatabase, analyzeAndPersistAcademicPlan } from "@/lib/analysis";
import { requireApiUser } from "@/lib/auth/api-guard";
import type { ProgramCode } from "@/lib/types";

export async function GET(request: Request) {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const programCode = (url.searchParams.get("program") ?? "CS2565") as ProgramCode;
  return NextResponse.json({ success: true, analysis: await analyzeAcademicPlanFromDatabase(programCode, auth.user.id) });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const programCode = (url.searchParams.get("program") ?? "CS2565") as ProgramCode;
  return NextResponse.json({ success: true, analysis: await analyzeAndPersistAcademicPlan(programCode, auth.user.id) });
}
