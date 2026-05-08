import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { getStudentProgram, upsertStudentProgram } from "@/lib/db/repository";
import type { ProgramCode } from "@/lib/types";

export async function GET() {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  return NextResponse.json({ success: true, studentProgram: await getStudentProgram(auth.user.id) });
}

export async function POST(request: Request) {
  const auth = await requireApiUser(["student", "admin"]);
  if (auth.error) return auth.error;

  const body = (await request.json()) as {
    programCode?: ProgramCode;
    studentCode?: string;
    track?: "research" | "coop";
  };

  if (!body.programCode || !body.studentCode || !body.track) {
    return NextResponse.json({ success: false, error: "programCode, studentCode and track are required" }, { status: 400 });
  }

  const studentProgram = await upsertStudentProgram(auth.user.id, {
    programCode: body.programCode,
    studentCode: body.studentCode,
    track: body.track
  });

  return NextResponse.json({ success: true, studentProgram });
}
