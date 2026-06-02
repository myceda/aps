import { NextResponse } from "next/server";
import { analyzeAcademicPlanFromDatabase, analyzeAndPersistAcademicPlan } from "@/lib/analysis";
import { requireApiUser } from "@/lib/auth/api-guard";
import { resolveProgramCode } from "@/lib/db/repository";

export async function GET(request: Request) {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  try {
    const programCode = await resolveProgramCode(auth.user.id, url.searchParams.get("program"));
    return NextResponse.json({ success: true, analysis: await analyzeAcademicPlanFromDatabase(programCode, auth.user.id) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "วิเคราะห์ข้อมูลไม่สำเร็จ" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  try {
    const programCode = await resolveProgramCode(auth.user.id, url.searchParams.get("program"));
    return NextResponse.json({ success: true, analysis: await analyzeAndPersistAcademicPlan(programCode, auth.user.id) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "บันทึกผลวิเคราะห์ไม่สำเร็จ" }, { status: 400 });
  }
}
