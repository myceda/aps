import { NextResponse } from "next/server";
import { analyzeAcademicPlanFromDatabase, analyzeAndPersistAcademicPlan } from "@/lib/analysis";
import { requireApiUser } from "@/lib/auth/api-guard";
import { getStudentProgram, resolveProgramCode, resolveTranscriptOwner } from "@/lib/db/repository";

export async function GET(request: Request) {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  try {
    const owner = await resolveTranscriptOwner(auth.user, {
      ownerEmail: url.searchParams.get("ownerEmail")
    });
    const studentProgram = await getStudentProgram(owner.id);
    const programCode = await resolveProgramCode(owner.id, url.searchParams.get("program"));
    const selectedTrack = studentProgram?.track === "coop" ? "coop" : "research";
    return NextResponse.json({ success: true, analysis: await analyzeAcademicPlanFromDatabase(programCode, owner.id, selectedTrack) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "วิเคราะห์ข้อมูลไม่สำเร็จ" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  try {
    const owner = await resolveTranscriptOwner(auth.user, {
      ownerEmail: url.searchParams.get("ownerEmail")
    });
    const studentProgram = await getStudentProgram(owner.id);
    const programCode = await resolveProgramCode(owner.id, url.searchParams.get("program"));
    const selectedTrack = studentProgram?.track === "coop" ? "coop" : "research";
    return NextResponse.json({ success: true, analysis: await analyzeAndPersistAcademicPlan(programCode, owner.id, selectedTrack) });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "บันทึกผลวิเคราะห์ไม่สำเร็จ" }, { status: 400 });
  }
}
