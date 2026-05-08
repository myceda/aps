import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { listCourseOfferings } from "@/lib/db/repository";
import type { ProgramCode } from "@/lib/types";

export async function GET(request: Request) {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const programCode = (url.searchParams.get("program") ?? "CS2565") as ProgramCode;
  const academicYear = Number(url.searchParams.get("academicYear") ?? 2568);
  const semester = Number(url.searchParams.get("semester") ?? 1);

  return NextResponse.json({
    success: true,
    offerings: await listCourseOfferings(programCode, academicYear, semester)
  });
}
