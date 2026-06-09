import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { listCourseOfferings, resolveProgramCode, resolveTranscriptOwner } from "@/lib/db/repository";

export async function GET(request: Request) {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const academicYearParam = url.searchParams.get("academicYear");
  const semesterParam = url.searchParams.get("semester");
  const academicYear = academicYearParam ? Number(academicYearParam) : undefined;
  const semester = semesterParam ? Number(semesterParam) : undefined;

  try {
    const owner = await resolveTranscriptOwner(auth.user, {
      ownerEmail: url.searchParams.get("ownerEmail")
    });
    const programCode = await resolveProgramCode(owner.id, url.searchParams.get("program"));
    return NextResponse.json({
      success: true,
      offerings: await listCourseOfferings(programCode, academicYear, semester)
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "โหลดวิชาเปิดไม่สำเร็จ" }, { status: 400 });
  }
}
